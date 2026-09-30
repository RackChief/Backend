import { Router, raw } from "express";
import { z } from "../../openapi/zod.js";
import { assetService } from "../assets/asset.service.js";
import { deviceImageService } from "./device-image.service.js";
import { requireAuth } from "../../auth/middleware.js";
import { signedImageUrls, validImageSignature } from "./device-image-signing.js";

export const deviceImageRouter = Router();
const params = z.object({ assetId: z.uuid(), side: z.enum(["front", "rear"]) });
const upload = raw({ type: ["image/png", "image/jpeg", "image/webp"], limit: "5mb" });
const catalogSelection = z.object({ path: z.string().min(1).max(500) }).strict();

deviceImageRouter.get("/catalog", requireAuth, async (req, res) => {
    const query = z.object({ q: z.string().min(2).max(100) }).parse(req.query);
    res.json(await deviceImageService.searchCatalog(query.q));
});

deviceImageRouter.get("/library", requireAuth, async (_req, res) => {
    const [images, assets] = await Promise.all([deviceImageService.uploadedImages(), assetService.list()]);
    const names = new Map(assets.map(asset => [asset.id, asset.name]));
    const library = images.flatMap(image => {
        const assetName = names.get(image.assetId);
        return assetName ? [{ ...image, assetName, previewUrl: signedImageUrls(image.assetId)[image.side] }] : [];
    });
    res.json(library.sort((a, b) => a.assetName.localeCompare(b.assetName)));
});

deviceImageRouter.get("/:assetId/urls", requireAuth, async (req, res) => {
    const assetId = z.uuid().parse(req.params.assetId);
    await assetService.get(assetId);
    res.json(signedImageUrls(assetId));
});

deviceImageRouter.get("/:assetId/:side/:expires/:nonce/:signature", async (req, res) => {
    const { assetId, side } = params.parse(req.params);
    const signed = z.object({ expires: z.coerce.number().int(), nonce: z.string(), signature: z.string() }).parse(req.params);
    if (!validImageSignature(assetId, side, signed.expires, signed.nonce, signed.signature)) { res.status(401).json({ error: "Invalid or expired image URL" }); return; }
    const asset = await assetService.get(assetId);
    const image = await deviceImageService.resolve(asset, side);
    if (!image) { res.status(404).json({ error: "No device image available" }); return; }
    res.set({ "Content-Type": image.contentType, "Cache-Control": "private, max-age=60", "X-Device-Image-Source": image.source });
    res.send(image.bytes);
});

deviceImageRouter.get("/:assetId", requireAuth, async (req, res) => {
    const assetId = z.uuid().parse(req.params.assetId);
    await assetService.get(assetId);
    res.json(await deviceImageService.customSides(assetId));
});

deviceImageRouter.post("/:assetId/:side/from-asset", requireAuth, async (req, res) => {
    const { assetId, side } = params.parse(req.params);
    const source = z.object({ sourceAssetId: z.uuid(), sourceSide: z.enum(["front", "rear"]) }).strict().parse(req.body);
    await Promise.all([assetService.get(assetId), assetService.get(source.sourceAssetId)]);
    const contentType = await deviceImageService.copyCustom(assetId, side, source.sourceAssetId, source.sourceSide);
    res.json({ side, contentType, source: "custom" });
});

deviceImageRouter.put("/:assetId/:side", requireAuth, upload, async (req, res) => {
    const { assetId, side } = params.parse(req.params);
    await assetService.get(assetId);
    if (!Buffer.isBuffer(req.body)) { res.status(400).json({ error: "Send PNG, JPEG, or WebP image bytes" }); return; }
    const contentType = await deviceImageService.setCustom(assetId, side, req.body);
    res.json({ side, contentType, source: "custom" });
});

deviceImageRouter.post("/:assetId/:side/catalog", requireAuth, async (req, res) => {
    const { assetId, side } = params.parse(req.params);
    await assetService.get(assetId);
    const contentType = await deviceImageService.setCatalog(assetId, side, catalogSelection.parse(req.body).path);
    res.json({ side, contentType, source: "catalog" });
});

deviceImageRouter.delete("/:assetId/:side", requireAuth, async (req, res) => {
    const { assetId, side } = params.parse(req.params);
    await assetService.get(assetId);
    await deviceImageService.deleteCustom(assetId, side);
    res.status(204).send();
});
