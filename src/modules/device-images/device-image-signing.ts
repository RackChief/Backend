import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../../config/env.js";
import type { ImageSide } from "./device-image.service.js";

const lifetimeSeconds = 6 * 60 * 60;
const key = createHmac("sha256", env.SUPABASE_SECRET_KEY).update("RackChief device images v1").digest();

function signature(assetId: string, side: ImageSide, expires: number) {
    return createHmac("sha256", key).update(`${assetId}:${side}:${expires}`).digest("hex");
}

export function signedImageUrls(assetId: string) {
    const expires = Math.floor(Date.now() / 1000) + lifetimeSeconds;
    const url = (side: ImageSide) => `/api/v1/device-images/${assetId}/${side}?expires=${expires}&signature=${signature(assetId, side, expires)}`;
    return { front: url("front"), rear: url("rear") };
}

export function validImageSignature(assetId: string, side: ImageSide, expires: number, supplied: string) {
    const now = Math.floor(Date.now() / 1000);
    if (!Number.isSafeInteger(expires) || expires < now || expires > now + lifetimeSeconds + 60 || !/^[a-f0-9]{64}$/.test(supplied)) return false;
    return timingSafeEqual(Buffer.from(signature(assetId, side, expires), "hex"), Buffer.from(supplied, "hex"));
}
