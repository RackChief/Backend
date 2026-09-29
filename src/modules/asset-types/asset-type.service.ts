import { assetTypeRepository } from "./asset-type.repository.js";

export const assetTypeService = {
    list() {
        return assetTypeRepository.all();
    },

    async get(id: string) {
        const assetType = await assetTypeRepository.get(id);

        if (!assetType) {
            const error = new Error("Asset type not found");

            Object.assign(error, {
                statusCode: 404,
            });

            throw error;
        }

        return assetType;
    },
};
