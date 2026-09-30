import { netboxDeviceTypeLibraryProvider } from "./providers/netbox-device-type-library.provider.js";
export const catalogService = {
  providers: async () => [{ id: netboxDeviceTypeLibraryProvider.id, name: netboxDeviceTypeLibraryProvider.name, revision: await netboxDeviceTypeLibraryProvider.getRevision() }],
  manufacturers: () => netboxDeviceTypeLibraryProvider.listManufacturers(),
  search: (query: Parameters<typeof netboxDeviceTypeLibraryProvider.searchDeviceTypes>[0]) => netboxDeviceTypeLibraryProvider.searchDeviceTypes(query),
  get: (id: string) => netboxDeviceTypeLibraryProvider.getDeviceType(id),
};
