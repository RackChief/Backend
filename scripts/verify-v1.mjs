// Opt-in development data and cross-domain API verification. Never run as a production seed.
const cookie = process.env.RACKCHIEF_TEST_COOKIE;
if (!cookie) throw new Error("Set RACKCHIEF_TEST_COOKIE to a Better Auth session cookie");
const base = process.env.RACKCHIEF_API_URL ?? "http://127.0.0.1:3000/api/v1";
async function request(path, method = "GET", body, expected) {
    const response = await fetch(`${base}${path}`, {
        method, headers: { Cookie: cookie, ...(body ? { "Content-Type": "application/json" } : {}) },
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = response.status === 204 ? null : await response.json();
    if (expected !== undefined) {
        if (response.status !== expected) throw new Error(`${method} ${path}: expected ${expected}, got ${response.status}: ${JSON.stringify(data)}`);
    } else if (!response.ok) throw new Error(`${method} ${path}: ${response.status}: ${JSON.stringify(data)}`);
    return data;
}
async function ensure(path, list, match, input) {
    const existing = (await request(list)).find(match);
    return existing ?? request(path, "POST", input);
}
const types = await request("/asset-types");
const type = slug => {
    const value = types.find(t => t.slug === slug);
    if (!value) throw new Error(`Missing asset type ${slug}`);
    return value.id;
};
const componentTypes = await request("/component-types");
const componentType = slug => componentTypes.find(t => t.slug === slug)?.id ?? (() => { throw new Error(`Missing component type ${slug}`); })();
const home = await ensure("/locations", "/locations", l => l.name === "V1 Demo Home", { name: "V1 Demo Home" });
const room = await ensure("/locations", "/locations", l => l.name === "V1 Demo Server Room", { name: "V1 Demo Server Room", parentId: home.id });
const rack = await ensure("/racks", "/racks", r => r.name === "V1 Demo Primary Rack", { name: "V1 Demo Primary Rack", totalUnits: 37, locationId: room.id });
async function asset(name, slug) {
    return ensure("/assets", "/assets", a => a.name === name, { name, assetTypeId: type(slug), locationId: room.id });
}
const artemis = await asset("V1 Demo Artemis", "server");
const nas = await asset("V1 Demo NAS", "storage");
const switchAsset = await asset("V1 Demo USW Aggregation", "switch");
const ups = await asset("V1 Demo UPS", "ups");
async function component(name, typeSlug, assetId, status, attributes = {}) {
    return ensure("/components", "/components", c => c.name === name, { name, componentTypeId: componentType(typeSlug), assetId, status, quantity: 1, locationId: room.id, attributes });
}
await component("V1 Demo Artemis CPU", "cpu", artemis.id, "installed", { cores: 24 });
const memory = await component("V1 Demo Artemis RAM", "memory", artemis.id, "installed", { capacityGb: 16, speedMt: 2133, memoryType: "DDR4", ecc: true });
await component("V1 Demo Artemis GPU", "gpu", artemis.id, "installed", { vramGb: 16 });
await component("V1 Demo Artemis HBA", "hba", artemis.id, "installed");
await component("V1 Demo Artemis SSD", "ssd", artemis.id, "installed", { capacityBytes: 4000787030016 });
await component("V1 Demo Spare HBA", "hba", null, "spare");
await component("V1 Demo Spare SSD", "ssd", null, "spare");
if ((await request(`/components/${memory.id}`)).attributes.capacityGb !== 16) throw new Error("Component attributes failed to round-trip");
for (const [assetId, startUnit, heightUnits] of [[ups.id, 1, 2], [nas.id, 4, 4], [artemis.id, 10, 2], [switchAsset.id, 20, 1]]) {
    if (!(await request(`/racks/${rack.id}/placements`)).some(p => p.assetId === assetId)) await request(`/racks/${rack.id}/placements`, "POST", { assetId, startUnit, heightUnits });
}
await request(`/racks/${rack.id}/placements`, "POST", { assetId: nas.id, startUnit: 10, heightUnits: 2 }, 409);
async function iface(assetId, name, data) {
    return ensure(`/assets/${assetId}/interfaces`, `/assets/${assetId}/interfaces`, i => i.name === name, { name, ...data });
}
const artemisIface = await iface(artemis.id, "V1 Demo 10Gb", { interfaceType: "ethernet", speedMbps: 10000, macAddress: "02-00-00-00-00-01" });
async function port(assetId, name, interfaceId) {
    return ensure(`/assets/${assetId}/ports`, `/assets/${assetId}/ports`, p => p.name === name, { name, interfaceId, portType: "sfp_plus", speedMbps: 10000 });
}
const serverPort = await port(artemis.id, "V1 Demo SFP+ 1", artemisIface.id);
const switchPort = await port(switchAsset.id, "V1 Demo SFP+ 3", null);
const connected = (await request("/network-connections")).some(c => [c.portAId, c.portBId].includes(serverPort.id));
if (!connected) await request("/network-connections", "POST", { portAId: serverPort.id, portBId: switchPort.id, connectionType: "fiber" });
await request("/network-connections", "POST", { portAId: switchPort.id, portBId: serverPort.id }, 409);
const addresses = await request(`/network-interfaces/${artemisIface.id}/ip-addresses`);
if (!addresses.some(a => a.address === "192.0.2.10")) await request(`/network-interfaces/${artemisIface.id}/ip-addresses`, "POST", { address: "192.0.2.10", isPrimary: true });
if (!addresses.some(a => a.address === "2001:db8::10")) await request(`/network-interfaces/${artemisIface.id}/ip-addresses`, "POST", { address: "2001:db8::10" });
await request(`/network-interfaces/${artemisIface.id}/ip-addresses`, "POST", { address: "192.0.2.11", isPrimary: true }, 409);
if (!(await request(`/asset-relationships?assetId=${artemis.id}`)).some(r => r.sourceAssetId === artemis.id && r.targetAssetId === ups.id && r.relationshipType === "powered_by")) {
    await request("/asset-relationships", "POST", { sourceAssetId: artemis.id, targetAssetId: ups.id, relationshipType: "powered_by" });
}
const project = await ensure("/projects", "/projects", p => p.name === "V1 Demo Infrastructure Upgrade", { name: "V1 Demo Infrastructure Upgrade", assetIds: [artemis.id, switchAsset.id], status: "planned" });
if (!(await request(`/projects/${project.id}/items`)).some(i => i.title === "V1 Demo SFP+ modules")) {
    await request(`/projects/${project.id}/items`, "POST", { type: "purchase", title: "V1 Demo SFP+ modules", estimatedCost: 79.99, status: "planned" });
}
const detail = await request(`/assets/${artemis.id}/detail`);
if (!detail.components.length || !detail.interfaces[0]?.ipAddresses.length || !detail.rackPlacements.length || !detail.relationships.length) throw new Error("Asset detail is incomplete");
console.log(JSON.stringify({ status: "ok", locationId: room.id, rackId: rack.id, assetIds: [artemis.id, nas.id, switchAsset.id, ups.id], projectId: project.id, checks: ["component attributes", "rack overlap", "port exclusivity", "IPv4/IPv6", "single primary IP", "asset detail"] }));
