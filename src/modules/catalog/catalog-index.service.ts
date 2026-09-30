import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import { promisify } from "node:util";
import { parse } from "yaml";
import { and, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { catalogDeviceTypes, catalogManufacturers, catalogProviders } from "../../db/schema/catalog.js";
import { catalogRoot, resetCatalogProviderCache } from "./providers/netbox-device-type-library.provider.js";

const providerId = "netbox-device-type-library";
const exec = promisify(execFile);
type CatalogRow = typeof catalogDeviceTypes.$inferInsert;
async function walk(dir: string, yamlOnly = true): Promise<string[]> {
  const result: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await walk(path, yamlOnly));
    else if (!yamlOnly || /\.ya?ml$/i.test(entry.name)) result.push(path);
  }
  return result;
}
async function sourceFingerprint(yamlFiles: string[]) {
  const hash = createHash("sha256");
  for (const path of yamlFiles) {
    const info = await stat(path);
    hash.update(relative(catalogRoot, path).replace(/\\/g, "/"));
    hash.update(`\0${info.size}\0${info.mtimeMs}\n`);
  }
  const imageRoot = join(catalogRoot, "elevation-images");
  try {
    for (const path of (await walk(imageRoot, false)).filter(path => /\.(png|jpe?g|webp)$/i.test(path)).sort()) {
      const info = await stat(path);
      hash.update(relative(catalogRoot, path).replace(/\\/g, "/"));
      hash.update(`\0${info.size}\0${info.mtimeMs}\n`);
    }
  } catch {}
  return hash.digest("hex");
}
async function sourceRevision(fingerprint: string) {
  try {
    const { stdout } = await exec("git", ["-C", catalogRoot, "rev-parse", "HEAD"]);
    const commit = stdout.trim();
    if (/^[a-f0-9]{40}$/i.test(commit)) return commit;
  } catch {}
  return `sha256:${fingerprint}`;
}
async function findImage(manufacturer: string, slug: string, side: "front" | "rear") {
  if (!manufacturer || manufacturer === "." || manufacturer === ".." || /[\\/\0]/.test(manufacturer) || !/^[\w.-]+$/.test(slug)) return null;
  const directory = join(catalogRoot, "elevation-images", manufacturer);
  for (const extension of ["png", "jpg", "jpeg", "webp"]) {
    const candidate = join(directory, `${slug}.${side}.${extension}`);
    try { await stat(candidate); return `${manufacturer}/${slug}.${side}.${extension}`; } catch {}
  }
  return null;
}
function numberOrNull(value: unknown) { const result = typeof value === "number" ? value : value == null ? null : Number(value); return result !== null && Number.isFinite(result) ? result : null; }

export async function buildCatalogIndex() {
  const yamlFiles = (await walk(join(catalogRoot, "device-types"))).sort();
  const fingerprint = await sourceFingerprint(yamlFiles);
  const revision = await sourceRevision(fingerprint);
  const [previous] = await db.select().from(catalogProviders).where(eq(catalogProviders.providerId, providerId)).limit(1);
  if (previous?.fingerprint === fingerprint && previous.revision === revision) {
    resetCatalogProviderCache();
    return { entryCount: previous.entryCount, skipped: previous.skippedCount, revision, fingerprint, unchanged: true };
  }

  const rows: CatalogRow[] = [];
  let skipped = 0;
  for (const path of yamlFiles) {
    try {
      const raw = parse(await readFile(path, "utf8")) as Record<string, unknown>;
      if (!raw || typeof raw !== "object" || typeof raw.manufacturer !== "string" || typeof raw.model !== "string") { skipped++; continue; }
      const deviceId = relative(join(catalogRoot, "device-types"), path).replace(/\\/g, "/").replace(/\.ya?ml$/i, "");
      const slug = typeof raw.slug === "string" ? raw.slug : deviceId.split("/").at(-1)!;
      const [frontImagePath, rearImagePath] = await Promise.all([findImage(raw.manufacturer, slug, "front"), findImage(raw.manufacturer, slug, "rear")]);
      rows.push({ providerId, deviceId, sourceRevision: revision, manufacturer: raw.manufacturer, model: raw.model, slug, partNumber: raw.part_number == null ? null : String(raw.part_number), uHeight: numberOrNull(raw.u_height), isFullDepth: typeof raw.is_full_depth === "boolean" ? raw.is_full_depth : null, airflow: raw.airflow == null ? null : String(raw.airflow), weight: numberOrNull(raw.weight), weightUnit: raw.weight_unit == null ? null : String(raw.weight_unit), frontImagePath, rearImagePath });
    } catch { skipped++; }
  }

  const counts = new Map<string, number>();
  for (const row of rows) counts.set(row.manufacturer, (counts.get(row.manufacturer) || 0) + 1);
  await db.transaction(async tx => {
    await tx.insert(catalogProviders).values({ providerId, name: "NetBox Community Device Type Library", revision, fingerprint, indexedAt: new Date(), entryCount: rows.length, skippedCount: skipped }).onConflictDoUpdate({ target: catalogProviders.providerId, set: { name: "NetBox Community Device Type Library", revision, fingerprint, indexedAt: new Date(), entryCount: rows.length, skippedCount: skipped } });
    await tx.delete(catalogDeviceTypes).where(eq(catalogDeviceTypes.providerId, providerId));
    await tx.delete(catalogManufacturers).where(eq(catalogManufacturers.providerId, providerId));
    const manufacturers = [...counts].map(([name, deviceCount]) => ({ providerId, name, deviceCount }));
    for (let start = 0; start < manufacturers.length; start += 500) await tx.insert(catalogManufacturers).values(manufacturers.slice(start, start + 500));
    for (let start = 0; start < rows.length; start += 500) await tx.insert(catalogDeviceTypes).values(rows.slice(start, start + 500));
  });
  resetCatalogProviderCache();
  return { entryCount: rows.length, skipped, revision, fingerprint, unchanged: false };
}
if (process.argv[1]?.includes("catalog-index.service")) buildCatalogIndex().then(value => console.log(JSON.stringify(value))).catch(error => { console.error(error); process.exitCode = 1; });
