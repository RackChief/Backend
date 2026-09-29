import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { racks, rackPlacements } from "../../db/schema.js";
import { componentService } from "../components/component.service.js";
import { locationService } from "../locations/location.service.js";
import { networkService } from "../networking/network.service.js";
import { relationshipService } from "../relationships/relationship.service.js";
import { assetService } from "./asset.service.js";
export const assetDetailService = {
    async get(id: string) {
        const asset = await assetService.get(id);
        const [components, interfaces, ports, relationships, rackRows, location] = await Promise.all([
            componentService.list({ assetId: id }), networkService.interfaces(id), networkService.ports(id), relationshipService.list(id),
            db.select({ placement: rackPlacements, rack: { id: racks.id, name: racks.name } }).from(rackPlacements).innerJoin(racks, eq(rackPlacements.rackId, racks.id)).where(eq(rackPlacements.assetId, id)),
            asset.locationId ? locationService.get(asset.locationId) : Promise.resolve(null),
        ]);
        const interfacesWithAddresses = await Promise.all(interfaces.map(async iface => ({ ...iface, ipAddresses: await networkService.addresses(iface.id) })));
        return { ...asset, location: location ? { id: location.id, name: location.name, parentId: location.parentId } : null,
            rackPlacements: rackRows.map(row => ({ ...row.placement, rack: row.rack })),
            components, interfaces: interfacesWithAddresses, ports, relationships };
    },
};
