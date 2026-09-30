import { netboxDeviceTypeLibraryProvider as provider } from "./providers/netbox-device-type-library.provider.js";
import { client } from "../../db/index.js";
import { deviceImageService } from "../device-images/device-image.service.js";

try {
    let rejected = false;
    try { await provider.getDeviceType("../secret"); } catch (error) { rejected = (error as { statusCode?: number }).statusCode === 400; }
    if (!rejected) throw new Error("catalog traversal identifier was not rejected");
    const first = (await provider.searchDeviceTypes({ limit: 1 }))[0];
    if (first) {
        const match = await provider.searchDeviceTypes({ q: first.model, limit: 100 });
        if (!match.some(row => row.id === first.id)) throw new Error("catalog search could not find an indexed device");
        const filtered = await provider.searchDeviceTypes({ q: first.model, hasFrontImage: false, limit: 100 });
        if (filtered.some(row => row.frontImageAvailable)) throw new Error("front-image=false returned an image");
        const detail = await provider.getDeviceType(first.id);
        if (!detail || detail.id !== first.id) throw new Error("indexed device detail could not be read from the pinned checkout");
        const images = await provider.searchDeviceTypes({ hasFrontImage: true, limit: 100 });
        const distinct = images.find(row => row.model !== images[0]?.model);
        if (images[0] && distinct) {
            await deviceImageService.searchCatalog(images[0].model);
            const second = await deviceImageService.searchCatalog(distinct.model);
            if (!second.some(image => image.path === `${distinct.id}.front`)) throw new Error("second image query reused the first query's results");
        }
    }
    console.log(`catalog self-test passed (${first ? "indexed device verified" : "empty optional catalog"})`);
} finally {
    await client.end();
}
