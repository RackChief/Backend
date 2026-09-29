import { and, asc, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
    assets, assetTypes, projectAssets, projectItems, projects, projectUpdates,
    type NewProject, type NewProjectItem,
} from "../../db/schema.js";

export class MissingProjectAssetsError extends Error {}

type AssetSummary = {
    id: string;
    name: string;
    hostname: string | null;
    assetType: { id: string; name: string; slug: string };
};

async function assetsForProjects(projectIds: string[]): Promise<Map<string, AssetSummary[]>> {
    const result = new Map<string, AssetSummary[]>(projectIds.map((id) => [id, []]));
    if (!projectIds.length) return result;

    const rows = await db.select({
        projectId: projectAssets.projectId,
        id: assets.id,
        name: assets.name,
        hostname: assets.hostname,
        assetType: { id: assetTypes.id, name: assetTypes.name, slug: assetTypes.slug },
    }).from(projectAssets)
        .innerJoin(assets, eq(projectAssets.assetId, assets.id))
        .innerJoin(assetTypes, eq(assets.assetTypeId, assetTypes.id))
        .where(inArray(projectAssets.projectId, projectIds))
        .orderBy(asc(assets.name), asc(assets.id));

    for (const { projectId, ...asset } of rows) result.get(projectId)!.push(asset);
    return result;
}

async function validateAssetIds(
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
    assetIds: string[],
) {
    if (!assetIds.length) return;
    const found = await tx.select({ id: assets.id }).from(assets)
        .where(inArray(assets.id, assetIds));
    if (found.length !== assetIds.length) throw new MissingProjectAssetsError();
}

export const projectRepository = {
    async exists(id: string) {
        const [project] = await db.select({ id: projects.id }).from(projects)
            .where(eq(projects.id, id)).limit(1);
        return !!project;
    },

    async all() {
        const rows = await db.select().from(projects).orderBy(asc(projects.name), asc(projects.id));
        const assetMap = await assetsForProjects(rows.map((row) => row.id));
        return rows.map((row) => ({ ...row, assets: assetMap.get(row.id)! }));
    },

    async get(id: string) {
        const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
        if (!project) return undefined;
        const [assetMap, items, updates] = await Promise.all([
            assetsForProjects([id]),
            this.items(id),
            this.updates(id),
        ]);
        return { ...project, assets: assetMap.get(id)!, items, updates };
    },

    async create(input: NewProject, assetIds: string[]) {
        const id = await db.transaction(async (tx) => {
            await validateAssetIds(tx, assetIds);
            const [project] = await tx.insert(projects).values(input).returning({ id: projects.id });
            if (assetIds.length) await tx.insert(projectAssets).values(
                assetIds.map((assetId) => ({ projectId: project.id, assetId })),
            );
            return project.id;
        });
        return this.get(id);
    },

    async update(id: string, input: Partial<NewProject>, assetIds?: string[]) {
        const updated = await db.transaction(async (tx) => {
            if (assetIds !== undefined) await validateAssetIds(tx, assetIds);
            const [project] = await tx.update(projects).set({ ...input, updatedAt: new Date() })
                .where(eq(projects.id, id)).returning({ id: projects.id });
            if (!project) return false;
            if (assetIds !== undefined) {
                await tx.delete(projectAssets).where(eq(projectAssets.projectId, id));
                if (assetIds.length) await tx.insert(projectAssets).values(
                    assetIds.map((assetId) => ({ projectId: id, assetId })),
                );
            }
            return true;
        });
        return updated ? this.get(id) : undefined;
    },

    async archive(id: string) {
        const [project] = await db.update(projects).set({
            status: "archived", archivedAt: new Date(), updatedAt: new Date(),
        }).where(eq(projects.id, id)).returning({ id: projects.id });
        return project ? this.get(id) : undefined;
    },

    async restore(id: string) {
        const [project] = await db.update(projects).set({
            status: "planned", archivedAt: null, updatedAt: new Date(),
        }).where(eq(projects.id, id)).returning({ id: projects.id });
        return project ? this.get(id) : undefined;
    },

    async deleteArchived(id: string) {
        const deleted = await db.delete(projects)
            .where(and(eq(projects.id, id), isNotNull(projects.archivedAt)))
            .returning({ id: projects.id });
        return deleted.length > 0;
    },

    async items(projectId: string) {
        return db.select().from(projectItems).where(eq(projectItems.projectId, projectId))
            .orderBy(asc(projectItems.sortOrder), asc(projectItems.createdAt), asc(projectItems.id));
    },

    async createItem(input: NewProjectItem) {
        const [item] = await db.insert(projectItems).values(input).returning();
        return item;
    },

    async updateItem(projectId: string, itemId: string, input: Partial<NewProjectItem>) {
        const [item] = await db.update(projectItems).set({ ...input, updatedAt: new Date() })
            .where(and(eq(projectItems.projectId, projectId), eq(projectItems.id, itemId)))
            .returning();
        return item;
    },

    async deleteItem(projectId: string, itemId: string) {
        const rows = await db.delete(projectItems)
            .where(and(eq(projectItems.projectId, projectId), eq(projectItems.id, itemId)))
            .returning({ id: projectItems.id });
        return rows.length > 0;
    },

    async updates(projectId: string) {
        return db.select().from(projectUpdates).where(eq(projectUpdates.projectId, projectId))
            .orderBy(desc(projectUpdates.createdAt), desc(projectUpdates.id));
    },

    async createUpdate(projectId: string, body: string) {
        const [update] = await db.insert(projectUpdates).values({ projectId, body }).returning();
        return update;
    },

    async deleteUpdate(projectId: string, updateId: string) {
        const rows = await db.delete(projectUpdates)
            .where(and(eq(projectUpdates.projectId, projectId), eq(projectUpdates.id, updateId)))
            .returning({ id: projectUpdates.id });
        return rows.length > 0;
    },
};
