import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { AssetWithType } from "../assets/asset.repository.js";
import { catalogRoot, netboxDeviceTypeLibraryProvider } from "../catalog/providers/netbox-device-type-library.provider.js";

export type ImageSide = "front" | "rear";
type ImageFile = { bytes: Buffer; contentType: string; source: "custom" | "netbox" };
const root = process.env.DEVICE_IMAGE_DIR || "/data/device-images";
const maxBytes = 5 * 1024 * 1024;
const missingTtlMs = 24 * 60 * 60 * 1000;
const lookupBudgetMs = 10000;
const requestTimeoutMs = 2500;
const unavailableTtlMs = 5 * 60 * 1000;
const extensions = ["png", "jpg", "jpeg", "webp"] as const;
const mime: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp" };
const pending = new Map<string, Promise<ImageFile | null>>();
const unavailableUntil = new Map<string, number>();
type CatalogImage = { path: string; side: ImageSide; label: string; rawUrl: string };
const catalogCache = new Map<string, { expires: number; images: CatalogImage[] }>();

function slug(value: string) {
    return value.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100);
}

function imageType(bytes: Buffer): string | null {
    if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "png";
    if (bytes.length >= 3 && bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) return "jpg";
    if (bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return "webp";
    return null;
}
async function readCatalogImage(relativePath: string): Promise<ImageFile | null> {
    if (relativePath.includes("..") || relativePath.startsWith("/") || relativePath.includes("\\")) return null;
    try { const bytes = await readFile(join(catalogRoot, "elevation-images", relativePath)); const ext = imageType(bytes); return ext && bytes.length <= maxBytes ? { bytes, contentType: mime[ext], source: "netbox" } : null; } catch { return null; }
}

async function findImage(directory: string, prefix: string, source: ImageFile["source"]): Promise<ImageFile | null> {
    for (const ext of extensions) {
        try {
            const bytes = await readFile(join(directory, `${prefix}.${ext}`));
            const actual = imageType(bytes);
            if (actual && (actual === ext || (actual === "jpg" && ext === "jpeg"))) return { bytes, contentType: mime[actual], source };
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        }
    }
    return null;
}

function manufacturerFolders(manufacturer: string) {
    const trimmed = manufacturer.trim().slice(0, 80);
    const title = trimmed.replace(/\b\w/g, letter => letter.toUpperCase());
    return [...new Set([trimmed, title, trimmed.toUpperCase()])].filter(Boolean);
}

function modelSlugs(manufacturer: string, model: string) {
    const vendor = slug(manufacturer);
    const item = slug(model);
    const candidates = [slug(`${manufacturer} ${model}`), item];
    if (vendor === "dell" && /^r\d/i.test(model.trim())) candidates.push(slug(`Dell PowerEdge ${model}`));
    return [...new Set(candidates)].filter(Boolean);
}

async function fetchDefault(manufacturer: string, model: string, side: ImageSide): Promise<ImageFile | null> {
    const vendor = slug(manufacturer);
    const modelKey = slug(model);
    if (!vendor || !modelKey) return null;
    const directory = join(root, "netbox", vendor);
    const prefix = `${vendor}-${modelKey}.${side}`;
    const cached = await findImage(directory, prefix, "netbox");
    if (cached) return cached;
    const retryAt = unavailableUntil.get(prefix);
    if (retryAt && retryAt > Date.now()) return null;
    unavailableUntil.delete(prefix);
    const missing = join(directory, `${prefix}.missing`);
    try { if (Date.now() - (await stat(missing)).mtimeMs < missingTtlMs) return null; } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    let lookupUnavailable = false;
    const deadline = Date.now() + lookupBudgetMs;
    lookup: for (const folder of manufacturerFolders(manufacturer)) {
        for (const imageSlug of modelSlugs(manufacturer, model)) {
            for (const ext of extensions) {
                const remainingMs = deadline - Date.now();
                if (remainingMs <= 0) { lookupUnavailable = true; break lookup; }
                const url = `https://raw.githubusercontent.com/netbox-community/devicetype-library/master/elevation-images/${encodeURIComponent(folder)}/${encodeURIComponent(imageSlug)}.${side}.${ext}`;
                let response: Response;
                try { response = await fetch(url, { headers: { "User-Agent": "RackChief-device-images" }, signal: AbortSignal.timeout(Math.min(requestTimeoutMs, remainingMs)), redirect: "error" }); }
                catch { lookupUnavailable = true; continue; }
                if (response.status === 404) continue;
                if (!response.ok) { lookupUnavailable = true; continue; }
                if (Number(response.headers.get("content-length") || 0) > maxBytes) continue;
                let bytes: Buffer;
                try { bytes = Buffer.from(await response.arrayBuffer()); }
                catch { lookupUnavailable = true; continue; }
                const actual = imageType(bytes);
                if (!actual || bytes.length > maxBytes) continue;
                await mkdir(directory, { recursive: true });
                const target = join(directory, `${prefix}.${actual}`);
                const temporary = `${target}.${randomUUID()}.tmp`;
                await writeFile(temporary, bytes);
                await rename(temporary, target);
                await rm(missing, { force: true });
                unavailableUntil.delete(prefix);
                return { bytes, contentType: mime[actual], source: "netbox" };
            }
        }
    }
    if (lookupUnavailable) {
        const now = Date.now();
        for (const [key, expires] of unavailableUntil) if (expires <= now) unavailableUntil.delete(key);
        if (unavailableUntil.size >= 512) unavailableUntil.delete(unavailableUntil.keys().next().value!);
        unavailableUntil.set(prefix, now + unavailableTtlMs);
    }
    else { await mkdir(directory, { recursive: true }); await writeFile(missing, ""); }
    return null;
}

export const deviceImageService = {
    async searchCatalog(query: string): Promise<CatalogImage[]> {
        const normalized = query.trim().toLowerCase();
        if (normalized.length < 2) return [];
        const cached = catalogCache.get(normalized);
        let images = cached && cached.expires > Date.now() ? cached.images : null;
        if (!images) {
            const results = await netboxDeviceTypeLibraryProvider.searchDeviceTypes({ q: normalized, limit: 100 });
            images = results.flatMap((entry) => [
                ...(entry.frontImageAvailable ? [{ path: `${entry.id}.front`, side: "front" as const, label: `${entry.manufacturer}/${entry.slug}.front`, rawUrl: "" }] : []),
                ...(entry.rearImageAvailable ? [{ path: `${entry.id}.rear`, side: "rear" as const, label: `${entry.manufacturer}/${entry.slug}.rear`, rawUrl: "" }] : []),
            ]);
            if (catalogCache.size >= 64) catalogCache.delete(catalogCache.keys().next().value!);
            catalogCache.set(normalized, { expires: Date.now() + 10 * 60 * 1000, images });
        }
        return images.slice(0, 50);
    },
    async setCatalog(assetId: string, side: ImageSide, path: string) {
        if (!path.endsWith(`.${side}`)) throw Object.assign(new Error("That catalog image is not available for this side"), { statusCode: 400 });
        const deviceId = path.slice(0, -`.${side}`.length);
        const device = await netboxDeviceTypeLibraryProvider.getDeviceType(deviceId);
        const imagePath = device?.images[side];
        if (!imagePath) throw Object.assign(new Error("Catalog image is unavailable"), { statusCode: 404 });
        const image = await readCatalogImage(imagePath);
        if (!image) throw Object.assign(new Error("Catalog image is unavailable"), { statusCode: 404 });
        return this.setCustom(assetId, side, image.bytes);
    },
    async resolve(asset: AssetWithType, side: ImageSide): Promise<ImageFile | null> {
        const custom = await findImage(join(root, "custom"), `${asset.id}.${side}`, "custom");
        if (custom) return custom;
        if (!asset.manufacturer || !asset.model) return null;
        const catalog = await netboxDeviceTypeLibraryProvider.searchDeviceTypes({ q: asset.model, manufacturer: asset.manufacturer, limit: 10 });
        for (const summary of catalog) {
            const device = await netboxDeviceTypeLibraryProvider.getDeviceType(summary.id);
            const imagePath = device?.images[side];
            if (imagePath) {
                const image = await readCatalogImage(imagePath); if (image) return image;
            }
        }
        const key = `${slug(asset.manufacturer)}/${slug(asset.model)}/${side}`;
        let task = pending.get(key);
        if (!task) {
            task = fetchDefault(asset.manufacturer, asset.model, side).finally(() => pending.delete(key));
            pending.set(key, task);
        }
        return task;
    },
    async setCustom(assetId: string, side: ImageSide, bytes: Buffer) {
        if (!bytes.length || bytes.length > maxBytes) throw Object.assign(new Error("Image must be at most 5 MB"), { statusCode: 400 });
        const ext = imageType(bytes);
        if (!ext) throw Object.assign(new Error("Use a PNG, JPEG, or WebP image"), { statusCode: 400 });
        const directory = join(root, "custom");
        await mkdir(directory, { recursive: true });
        const target = join(directory, `${assetId}.${side}.${ext}`);
        const temporary = `${target}.${randomUUID()}.tmp`;
        await writeFile(temporary, bytes);
        await rename(temporary, target);
        for (const other of extensions) if (other !== ext) await rm(join(directory, `${assetId}.${side}.${other}`), { force: true });
        return mime[ext];
    },
    async deleteCustom(assetId: string, side: ImageSide) {
        const directory = join(root, "custom");
        for (const ext of extensions) await rm(join(directory, `${assetId}.${side}.${ext}`), { force: true });
    },
    async customSides(assetId: string) {
        try {
            const names = await readdir(join(root, "custom"));
            const available = (side: ImageSide) => extensions.some(ext => names.includes(`${assetId}.${side}.${ext}`));
            return { front: available("front"), rear: available("rear") };
        } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return { front: false, rear: false }; throw error; }
    },
};
