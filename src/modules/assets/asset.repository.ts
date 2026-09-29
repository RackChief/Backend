import { eq } from "drizzle-orm";

import { db } from "../../db/index.js";
import {
    assets,
    type Asset,
    type NewAsset,
} from "../../db/schema.js";

export const assetRepository = {
    async get(id: string): Promise<Asset | undefined> {
        return db.query.assets.findFirst({
            where: eq(assets.id, id),
        });
    },

    async all(): Promise<Asset[]> {
        return db.query.assets.findMany({
            orderBy: (assets, { asc }) => [
                asc(assets.name),
            ],
        });
    },

    async create(input: NewAsset): Promise<Asset> {
        const [asset] = await db
            .insert(assets)
            .values(input)
            .returning();

        return asset;
    },
};
