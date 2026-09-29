import { boolean, index, inet, integer, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { assets } from "./assets.js";
import { sql } from "drizzle-orm";

export const networkInterfaceType = pgEnum("network_interface_type", ["ethernet", "wireless", "virtual", "bridge", "bond", "loopback", "other"]);
export const networkPortType = pgEnum("network_port_type", ["rj45", "sfp", "sfp_plus", "sfp28", "qsfp", "qsfp28", "fiber", "other"]);
export const networkConnectionType = pgEnum("network_connection_type", ["copper", "fiber", "dac", "other"]);
export const networkInterfaces = pgTable("network_interfaces", {
    id: uuid("id").primaryKey().defaultRandom(), assetId: uuid("asset_id").notNull().references(() => assets.id, { onDelete: "restrict" }),
    name: text("name").notNull(), description: text("description"), macAddress: text("mac_address"), speedMbps: integer("speed_mbps"),
    interfaceType: networkInterfaceType("interface_type").notNull(), enabled: boolean("enabled").notNull().default(true), notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [index("network_interfaces_asset_id_idx").on(table.assetId), uniqueIndex("network_interfaces_asset_name_idx").on(table.assetId, table.name)]);
export const networkPorts = pgTable("network_ports", {
    id: uuid("id").primaryKey().defaultRandom(), assetId: uuid("asset_id").notNull().references(() => assets.id, { onDelete: "restrict" }),
    interfaceId: uuid("interface_id").references(() => networkInterfaces.id, { onDelete: "restrict" }),
    name: text("name").notNull(), portNumber: integer("port_number"), portType: networkPortType("port_type").notNull(), speedMbps: integer("speed_mbps"),
    poeCapable: boolean("poe_capable").notNull().default(false), poeEnabled: boolean("poe_enabled").notNull().default(false), enabled: boolean("enabled").notNull().default(true),
    description: text("description"), notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [index("network_ports_asset_id_idx").on(table.assetId), index("network_ports_interface_id_idx").on(table.interfaceId), uniqueIndex("network_ports_asset_name_idx").on(table.assetId, table.name)]);
export const networkConnections = pgTable("network_connections", {
    id: uuid("id").primaryKey().defaultRandom(), portAId: uuid("port_a_id").notNull().references(() => networkPorts.id, { onDelete: "restrict" }),
    portBId: uuid("port_b_id").notNull().references(() => networkPorts.id, { onDelete: "restrict" }),
    connectionType: networkConnectionType("connection_type"), label: text("label"), notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [uniqueIndex("network_connections_port_a_idx").on(table.portAId), uniqueIndex("network_connections_port_b_idx").on(table.portBId)]);
export const ipAddresses = pgTable("ip_addresses", {
    id: uuid("id").primaryKey().defaultRandom(), networkInterfaceId: uuid("network_interface_id").notNull().references(() => networkInterfaces.id, { onDelete: "cascade" }),
    address: inet("address").notNull(), isPrimary: boolean("is_primary").notNull().default(false), description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [index("ip_addresses_interface_id_idx").on(table.networkInterfaceId), uniqueIndex("ip_addresses_interface_address_idx").on(table.networkInterfaceId, table.address), uniqueIndex("ip_addresses_one_primary_idx").on(table.networkInterfaceId).where(sql`${table.isPrimary} = true`)]);
export type NetworkInterface = typeof networkInterfaces.$inferSelect;
export type NetworkPort = typeof networkPorts.$inferSelect;
export type NetworkConnection = typeof networkConnections.$inferSelect;
export type IpAddress = typeof ipAddresses.$inferSelect;
