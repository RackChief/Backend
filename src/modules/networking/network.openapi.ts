import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "../../openapi/zod.js";
import { registerCrud, registerResourcePath, assetIdParam, interfaceIdParam, idParam } from "../../openapi/resource.js";
import { interfaceSchema, portSchema, connectionSchema, addressSchema, createInterfaceSchema, updateInterfaceSchema, createPortSchema, updatePortSchema, createConnectionSchema, updateConnectionSchema, createAddressSchema, updateAddressSchema } from "./network.schema.js";
export function registerNetworkOpenApi(registry: OpenAPIRegistry) {
    const assetQuery = z.object({ assetId: z.uuid().optional() });
    const connQuery = assetQuery.extend({ portId: z.uuid().optional() });
    const assets = "/api/v1/assets/{assetId}";
    registerResourcePath(registry, { method: "get", path: `${assets}/interfaces`, tag: "Network Interfaces", summary: "List asset interfaces", response: z.array(interfaceSchema), params: assetIdParam });
    registerResourcePath(registry, { method: "post", path: `${assets}/interfaces`, tag: "Network Interfaces", summary: "Create asset interface", response: interfaceSchema, body: createInterfaceSchema, params: assetIdParam });
    registerResourcePath(registry, { method: "get", path: `${assets}/ports`, tag: "Network Ports", summary: "List asset ports", response: z.array(portSchema), params: assetIdParam });
    registerResourcePath(registry, { method: "post", path: `${assets}/ports`, tag: "Network Ports", summary: "Create asset port", response: portSchema, body: createPortSchema, params: assetIdParam });
    for (const item of [
        { path: "/api/v1/network-interfaces", tag: "Network Interfaces", name: "interface", response: interfaceSchema, update: updateInterfaceSchema },
        { path: "/api/v1/network-ports", tag: "Network Ports", name: "port", response: portSchema, update: updatePortSchema },
    ]) {
        registerResourcePath(registry, { method: "get", path: item.path, tag: item.tag, summary: `List ${item.name}s`, response: z.array(item.response), query: assetQuery });
        registerResourcePath(registry, { method: "get", path: `${item.path}/{id}`, tag: item.tag, summary: `Get ${item.name}`, response: item.response, params: idParam });
        registerResourcePath(registry, { method: "patch", path: `${item.path}/{id}`, tag: item.tag, summary: `Update ${item.name}`, response: item.response, body: item.update, params: idParam });
        registerResourcePath(registry, { method: "delete", path: `${item.path}/{id}`, tag: item.tag, summary: `Delete ${item.name}`, params: idParam });
    }
    registerCrud(registry, { path: "/api/v1/network-connections", tag: "Network Connections", name: "connection", response: connectionSchema, create: createConnectionSchema, update: updateConnectionSchema, listQuery: connQuery });
    const ips = "/api/v1/network-interfaces/{interfaceId}/ip-addresses";
    registerResourcePath(registry, { method: "get", path: ips, tag: "IP Addresses", summary: "List interface IP addresses", response: z.array(addressSchema), params: interfaceIdParam });
    registerResourcePath(registry, { method: "post", path: ips, tag: "IP Addresses", summary: "Add interface IP address", response: addressSchema, body: createAddressSchema, params: interfaceIdParam });
    registerResourcePath(registry, { method: "get", path: "/api/v1/ip-addresses", tag: "IP Addresses", summary: "List IP addresses", response: z.array(addressSchema) });
    registerResourcePath(registry, { method: "patch", path: "/api/v1/ip-addresses/{id}", tag: "IP Addresses", summary: "Update IP address", response: addressSchema, body: updateAddressSchema, params: idParam });
    registerResourcePath(registry, { method: "delete", path: "/api/v1/ip-addresses/{id}", tag: "IP Addresses", summary: "Delete IP address", params: idParam });
}
