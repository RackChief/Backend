import { z } from "../../openapi/zod.js";
import { assetTypeSummarySchema } from "../assets/asset.schema.js";

const money = z.number().finite().nonnegative().max(9999999999.99).multipleOf(0.01);
const sortOrder = z.number().finite().min(-99999999.99).max(99999999.99).multipleOf(0.01);
const date = z.iso.date();
const dateTime = z.iso.datetime({ offset: true });

export const projectStatusSchema = z.enum([
    "idea", "planned", "committed", "in_progress", "waiting",
    "completed", "cancelled", "archived",
]);
export const projectPrioritySchema = z.enum(["low", "normal", "high", "critical"]);
export const projectItemTypeSchema = z.enum(["work", "purchase"]);
export const projectItemStatusSchema = z.enum([
    "planned", "committed", "in_progress", "ordered", "received",
    "completed", "blocked", "cancelled",
]);

export const projectAssetSummarySchema = z.object({
    id: z.uuid(),
    name: z.string(),
    hostname: z.string().nullable(),
    assetType: assetTypeSummarySchema,
});

export const projectSummarySchema = z.object({
    id: z.uuid(),
    name: z.string(),
    description: z.string().nullable(),
    status: projectStatusSchema,
    priority: projectPrioritySchema,
    targetDate: date.nullable(),
    estimatedCost: money.nullable(),
    actualCost: money.nullable(),
    notes: z.string().nullable(),
    completedAt: dateTime.nullable(),
    archivedAt: dateTime.nullable(),
    createdAt: dateTime,
    updatedAt: dateTime,
    assets: z.array(projectAssetSummarySchema),
});

export const projectItemSchema = z.object({
    id: z.uuid(),
    projectId: z.uuid(),
    type: projectItemTypeSchema,
    title: z.string(),
    description: z.string().nullable(),
    status: projectItemStatusSchema,
    targetDate: date.nullable(),
    vendor: z.string().nullable(),
    url: z.url().nullable(),
    estimatedCost: money.nullable(),
    actualCost: money.nullable(),
    shippingCost: money.nullable(),
    orderedAt: dateTime.nullable(),
    receivedAt: dateTime.nullable(),
    completedAt: dateTime.nullable(),
    notes: z.string().nullable(),
    sortOrder,
    createdAt: dateTime,
    updatedAt: dateTime,
});

export const projectUpdateSchema = z.object({
    id: z.uuid(),
    projectId: z.uuid(),
    body: z.string(),
    createdAt: dateTime,
});

export const projectSchema = projectSummarySchema.extend({
    items: z.array(projectItemSchema),
    updates: z.array(projectUpdateSchema),
});

const projectFields = z.object({
    name: z.string().trim().min(1),
    description: z.string().nullable(),
    status: projectStatusSchema,
    priority: projectPrioritySchema,
    targetDate: date.nullable(),
    estimatedCost: money.nullable(),
    actualCost: money.nullable(),
    notes: z.string().nullable(),
    assetIds: z.array(z.uuid()).refine((ids) => new Set(ids).size === ids.length, "Duplicate asset IDs"),
});

export const createProjectSchema = projectFields.pick({ name: true }).extend(
    projectFields.omit({ name: true }).partial().shape,
);
export const updateProjectSchema = projectFields.partial().refine(
    (input) => Object.keys(input).length > 0,
    "At least one field is required",
);

const itemFields = z.object({
    type: projectItemTypeSchema,
    title: z.string().trim().min(1),
    description: z.string().nullable(),
    status: projectItemStatusSchema,
    targetDate: date.nullable(),
    vendor: z.string().nullable(),
    url: z.url().nullable(),
    estimatedCost: money.nullable(),
    actualCost: money.nullable(),
    shippingCost: money.nullable(),
    orderedAt: dateTime.nullable(),
    receivedAt: dateTime.nullable(),
    completedAt: dateTime.nullable(),
    notes: z.string().nullable(),
    sortOrder,
});

export const createProjectItemSchema = itemFields.pick({ type: true, title: true }).extend(
    itemFields.omit({ type: true, title: true }).partial().shape,
);
export const updateProjectItemSchema = itemFields.partial().refine(
    (input) => Object.keys(input).length > 0,
    "At least one field is required",
);
export const createProjectUpdateSchema = z.object({ body: z.string().trim().min(1) });

export const projectIdParamsSchema = z.object({ id: z.uuid() });
export const projectParamsSchema = z.object({ projectId: z.uuid() });
export const projectItemParamsSchema = projectParamsSchema.extend({ itemId: z.uuid() });
export const projectUpdateParamsSchema = projectParamsSchema.extend({ updateId: z.uuid() });

export type CreateProject = z.infer<typeof createProjectSchema>;
export type UpdateProject = z.infer<typeof updateProjectSchema>;
export type CreateProjectItem = z.infer<typeof createProjectItemSchema>;
export type UpdateProjectItem = z.infer<typeof updateProjectItemSchema>;
export type CreateProjectUpdate = z.infer<typeof createProjectUpdateSchema>;
