import type { NewProjectItem } from "../../db/schema.js";
import { MissingProjectAssetsError, projectRepository } from "./project.repository.js";
import type {
    CreateProject, CreateProjectItem, CreateProjectUpdate,
    UpdateProject, UpdateProjectItem,
} from "./project.schema.js";

function httpError(message: string, statusCode: number) {
    return Object.assign(new Error(message), { statusCode });
}

async function withAssetValidation<T>(operation: () => Promise<T>): Promise<T> {
    try {
        return await operation();
    } catch (error) {
        if (error instanceof MissingProjectAssetsError) {
            throw httpError("One or more assets do not exist", 400);
        }
        throw error;
    }
}

function itemValues(input: CreateProjectItem | UpdateProjectItem): Partial<NewProjectItem> {
    const { orderedAt, receivedAt, completedAt, ...rest } = input;
    return {
        ...rest,
        ...(orderedAt !== undefined && { orderedAt: orderedAt === null ? null : new Date(orderedAt) }),
        ...(receivedAt !== undefined && { receivedAt: receivedAt === null ? null : new Date(receivedAt) }),
        ...(completedAt !== undefined && { completedAt: completedAt === null ? null : new Date(completedAt) }),
    };
}

export const projectService = {
    list() { return projectRepository.all(); },

    async get(id: string) {
        const project = await projectRepository.get(id);
        if (!project) throw httpError("Project not found", 404);
        return project;
    },

    async create(input: CreateProject) {
        const { assetIds = [], ...project } = input;
        return withAssetValidation(() => projectRepository.create(project.status === "archived" ? { ...project, archivedAt: new Date() } : project, assetIds));
    },

    async update(id: string, input: UpdateProject) {
        const { assetIds, ...project } = input;
        if (project.status !== undefined && (await this.get(id)).archivedAt && project.status !== "archived") {
            throw httpError("Restore the project before changing its status", 409);
        }
        const values = project.status === "archived" ? { ...project, archivedAt: new Date() } : project;
        const updated = await withAssetValidation(() => projectRepository.update(id, values, assetIds));
        if (!updated) throw httpError("Project not found", 404);
        return updated;
    },

    async archive(id: string) {
        const project = await projectRepository.archive(id);
        if (!project) throw httpError("Project not found", 404);
        return project;
    },

    async restore(id: string) {
        const project = await projectRepository.restore(id);
        if (!project) throw httpError("Project not found", 404);
        return project;
    },

    async delete(id: string) {
        const project = await this.get(id);
        if (!project.archivedAt) throw httpError("Project must be archived before permanent deletion", 409);
        if (!await projectRepository.deleteArchived(id)) throw httpError("Project not found", 404);
    },

    async items(projectId: string) {
        if (!await projectRepository.exists(projectId)) throw httpError("Project not found", 404);
        return projectRepository.items(projectId);
    },

    async createItem(projectId: string, input: CreateProjectItem) {
        if (!await projectRepository.exists(projectId)) throw httpError("Project not found", 404);
        return projectRepository.createItem({ ...itemValues(input), projectId, type: input.type, title: input.title });
    },

    async updateItem(projectId: string, itemId: string, input: UpdateProjectItem) {
        const item = await projectRepository.updateItem(projectId, itemId, itemValues(input));
        if (!item) throw httpError("Project item not found", 404);
        return item;
    },

    async deleteItem(projectId: string, itemId: string) {
        if (!await projectRepository.deleteItem(projectId, itemId)) {
            throw httpError("Project item not found", 404);
        }
    },

    async updates(projectId: string) {
        if (!await projectRepository.exists(projectId)) throw httpError("Project not found", 404);
        return projectRepository.updates(projectId);
    },

    async createUpdate(projectId: string, input: CreateProjectUpdate) {
        if (!await projectRepository.exists(projectId)) throw httpError("Project not found", 404);
        return projectRepository.createUpdate(projectId, input.body);
    },

    async deleteUpdate(projectId: string, updateId: string) {
        if (!await projectRepository.deleteUpdate(projectId, updateId)) {
            throw httpError("Project update not found", 404);
        }
    },
};
