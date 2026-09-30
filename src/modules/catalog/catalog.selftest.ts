import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const directory = await mkdtemp(join(tmpdir(), "rackchief-catalog-"));
try {
  process.env.DEVICE_CATALOG_INDEX = join(directory, "index.json");
  await writeFile(process.env.DEVICE_CATALOG_INDEX, JSON.stringify([{ provider: "netbox-device-type-library", id: "Dell/PowerEdge-R730", sourceRevision: "abc123", manufacturer: "Dell", model: "PowerEdge R730", slug: "poweredge-r730", partNumber: null, uHeight: 2, isFullDepth: true, airflow: null, weight: null, weightUnit: null, frontImageAvailable: true, rearImageAvailable: false, interfaces: [], consolePorts: [], powerPorts: [], powerOutlets: [], frontPorts: [], rearPorts: [], moduleBays: [], deviceBays: [], inventoryItems: [], images: { front: null, rear: null } }]));
  const { netboxDeviceTypeLibraryProvider } = await import("./providers/netbox-device-type-library.provider.js");
  const results = await netboxDeviceTypeLibraryProvider.searchDeviceTypes({ q: "poweredge", hasFrontImage: true });
  if (results.length !== 1 || results[0].id !== "Dell/PowerEdge-R730") throw new Error("catalog search self-test failed");
  let rejected = false; try { await netboxDeviceTypeLibraryProvider.getDeviceType("../secret"); } catch { rejected = true; }
  if (!rejected) throw new Error("catalog path traversal was not rejected");
  console.log("catalog self-test passed");
} finally { await rm(directory, { recursive: true, force: true }); }
