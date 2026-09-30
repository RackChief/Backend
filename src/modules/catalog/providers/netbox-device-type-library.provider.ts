import { readFile } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";
import { parse } from "yaml";
import { and, asc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { catalogDeviceTypes, catalogManufacturers, catalogProviders } from "../../../db/schema/catalog.js";
import type { DeviceCatalogProvider } from "./device-catalog-provider.js";
import type { CatalogDeviceType, CatalogDeviceTypeSummary, CatalogManufacturer, CatalogSearchQuery } from "../catalog.types.js";

const root = resolve(process.env.DEVICE_CATALOG_ROOT || join(process.cwd(), "vendor/netbox-device-type-library"));
const providerId = "netbox-device-type-library";
function safeDevicePath(id: string) {
  if (!/^[\w.-]+(?:\/[\w.-]+)+$/.test(id) || id.split("/").some(part => part === "." || part === "..")) throw Object.assign(new Error("Invalid catalog device id"), { statusCode: 400 });
  const base = resolve(root, "device-types");
  const target = resolve(base, `${id}.yaml`);
  const relativePath = relative(base, target);
  if (relativePath.startsWith(`..${sep}`) || relativePath === "..") throw Object.assign(new Error("Invalid catalog device id"), { statusCode: 400 });
  return target;
}
export function resetCatalogProviderCache() { /* Catalog records are queried from PostgreSQL; no process cache to invalidate. */ }
function summary(row: typeof catalogDeviceTypes.$inferSelect): CatalogDeviceTypeSummary {
  return { provider: row.providerId, id: row.deviceId, sourceRevision: row.sourceRevision, manufacturer: row.manufacturer, model: row.model, slug: row.slug, partNumber: row.partNumber, uHeight: row.uHeight, frontImageAvailable: !!row.frontImagePath, rearImageAvailable: !!row.rearImagePath };
}
function list(raw: Record<string, unknown>, key: string) { const value = raw[key]; return Array.isArray(value) ? value : []; }
export const netboxDeviceTypeLibraryProvider: DeviceCatalogProvider = {
  id: providerId,
  name: "NetBox Community Device Type Library",
  async getRevision() { const [provider] = await db.select({ revision: catalogProviders.revision }).from(catalogProviders).where(eq(catalogProviders.providerId, providerId)).limit(1); return provider?.revision || "unavailable"; },
  async listManufacturers(): Promise<CatalogManufacturer[]> { return db.select({ name: catalogManufacturers.name, deviceCount: catalogManufacturers.deviceCount }).from(catalogManufacturers).where(eq(catalogManufacturers.providerId, providerId)).orderBy(asc(catalogManufacturers.name)); },
  async searchDeviceTypes(query: CatalogSearchQuery): Promise<CatalogDeviceTypeSummary[]> {
    const conditions = [eq(catalogDeviceTypes.providerId, providerId)];
    if (query.manufacturer) conditions.push(eq(catalogDeviceTypes.manufacturer, query.manufacturer));
    if (query.uHeight !== undefined) conditions.push(eq(catalogDeviceTypes.uHeight, query.uHeight));
    if (query.hasFrontImage !== undefined) conditions.push(query.hasFrontImage ? sql`${catalogDeviceTypes.frontImagePath} is not null` : sql`${catalogDeviceTypes.frontImagePath} is null`);
    if (query.hasRearImage !== undefined) conditions.push(query.hasRearImage ? sql`${catalogDeviceTypes.rearImagePath} is not null` : sql`${catalogDeviceTypes.rearImagePath} is null`);
    if (query.q?.trim()) { const term = `%${query.q.trim().replace(/[\\%_]/g, "\\$&")}%`; conditions.push(or(ilike(catalogDeviceTypes.manufacturer, term), ilike(catalogDeviceTypes.model, term), ilike(catalogDeviceTypes.slug, term), ilike(catalogDeviceTypes.partNumber, term))!); }
    const rows = await db.select().from(catalogDeviceTypes).where(and(...conditions)).orderBy(asc(catalogDeviceTypes.manufacturer), asc(catalogDeviceTypes.model)).limit(Math.min(query.limit || 50, 100)).offset(query.offset || 0);
    return rows.map(summary);
  },
  async getDeviceType(id: string): Promise<CatalogDeviceType | null> {
    const path = safeDevicePath(id);
    const [row] = await db.select().from(catalogDeviceTypes).where(and(eq(catalogDeviceTypes.providerId, providerId), eq(catalogDeviceTypes.deviceId, id))).limit(1);
    if (!row) return null;
    let raw: Record<string, unknown>;
    try { raw = parse(await readFile(path, "utf8")) as Record<string, unknown>; }
    catch { try { raw = parse(await readFile(path.replace(/\.yaml$/i, ".yml"), "utf8")) as Record<string, unknown>; } catch { return null; } }
    return { ...summary(row), isFullDepth: row.isFullDepth, airflow: row.airflow, weight: row.weight, weightUnit: row.weightUnit, interfaces: list(raw, "interfaces"), consolePorts: list(raw, "console-ports"), powerPorts: list(raw, "power-ports"), powerOutlets: list(raw, "power-outlets"), frontPorts: list(raw, "front-ports"), rearPorts: list(raw, "rear-ports"), moduleBays: list(raw, "module-bays"), deviceBays: list(raw, "device-bays"), inventoryItems: list(raw, "inventory-items"), images: { front: row.frontImagePath, rear: row.rearImagePath } };
  },
};
export { root as catalogRoot };
