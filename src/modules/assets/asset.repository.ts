import { asc, eq } from "drizzle-orm";

import { db } from "../../db/index.js";

import {
    assets,
    assetTypes,
    type Asset,
    type AssetType,
    type NewAsset,
} from "../../db/schema.js";

export type AssetWithType = Asset & {
    assetType: Pick<
        AssetType,
        "id" | "name" | "slug"
    >;
};

function mapAssetRow(row: {
    asset: Asset;
    assetType: {
        id: string;
        name: string;
        slug: string;
    };
}): AssetWithType {
    return {
        ...row.asset,
        assetType: row.assetType,
    };
}

export const assetRepository = {
    async get(
        id: string,
    ): Promise<AssetWithType | undefined> {
        const [row] = await db
            .select({
                asset: assets,
                assetType: {
                    id: assetTypes.id,
                    name: assetTypes.name,
                    slug: assetTypes.slug,
                },
            })
            .from(assets)
            .innerJoin(
                assetTypes,
                eq(
                    assets.assetTypeId,
                    assetTypes.id,
                ),
            )
            .where(eq(assets.id, id))
            .limit(1);

        return row
            ? mapAssetRow(row)
            : undefined;
    },

    async all(): Promise<AssetWithType[]> {
        const rows = await db
            .select({
                asset: assets,
                assetType: {
                    id: assetTypes.id,
                    name: assetTypes.name,
                    slug: assetTypes.slug,
                },
            })
            .from(assets)
            .innerJoin(
                assetTypes,
                eq(
                    assets.assetTypeId,
                    assetTypes.id,
                ),
            )
            .orderBy(asc(assets.name));

        return rows.map(mapAssetRow);
    },

    async create(
        input: NewAsset,
    ): Promise<AssetWithType> {
        const [asset] = await db
            .insert(assets)
            .values(input)
            .returning();

        return (await this.get(asset.id))!;
    },

    async update(
        id: string,
        input: Partial<NewAsset>,
    ): Promise<AssetWithType | undefined> {
        const [asset] = await db
            .update(assets)
            .set({
                ...input,
                updatedAt: new Date(),
            })
            .where(eq(assets.id, id))
            .returning();

        if (!asset) {
            return undefined;
        }

        return this.get(asset.id);
    },

    async archive(
        id: string,
    ): Promise<AssetWithType | undefined> {
        const [asset] = await db
            .update(assets)
            .set({
                status: "archived",
                archivedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(assets.id, id))
            .returning();

        if (!asset) {
            return undefined;
        }

        return this.get(asset.id);
    },

    async restore(
        id: string,
    ): Promise<AssetWithType | undefined> {
        const [asset] = await db
            .update(assets)
            .set({
                status: "active",
                archivedAt: null,
                updatedAt: new Date(),
            })
            .where(eq(assets.id, id))
            .returning();

        if (!asset) {
            return undefined;
        }

        return this.get(asset.id);
    },

    async delete(
        id: string,
    ): Promise<boolean> {
        const deleted = await db
            .delete(assets)
            .where(eq(assets.id, id))
            .returning({
                id: assets.id,
            });

        return deleted.length > 0;
    },
};
