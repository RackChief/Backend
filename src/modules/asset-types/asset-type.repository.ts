import { asc, eq } from "drizzle-orm";

import { db } from "../../db/index.js";
import {
    assetTypes,
    type AssetType,
} from "../../db/schema.js";

export const assetTypeRepository = {
    async all(): Promise<AssetType[]> {
        return db
            .select()
            .from(assetTypes)
            .orderBy(asc(assetTypes.name));
    },

    async get(id: string): Promise<AssetType | undefined> {
        const [assetType] = await db
            .select()
            .from(assetTypes)
            .where(eq(assetTypes.id, id))
            .limit(1);

        return assetType;
    },
};
