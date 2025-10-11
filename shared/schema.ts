import { pgTable, text, serial, integer, boolean, decimal, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { ENUMS } from "./enums";

// Session table for connect-pg-simple
export const sessions = pgTable("session", {
  sid: text("sid").primaryKey(),
  sess: text("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

// Products table - laptops and computers
// For Inventory TAB
// adsId, brand,prodHealth,prodStatus, costPrice
export const products = pgTable("products", {
  adsId: text("ads_id").primaryKey(), // 11-digit numeric string, e.g., "12345678901"
  referenceNumber: text("reference_number").notNull().unique(), // "ADS" + adsId, e.g., "ADS12345678901"
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  costPrice: decimal("cost", { precision: 10, scale: 2 }).notNull(),
  specifications: text("specifications"), // JSON string of specs
  prodId: text("prod_id").notNull(), // Serial number of the product
  prodHealth: text("prod_health").$default(() => "working"), // "working", "maintenance", "expired"
  prodStatus: text("prod_status").$default(() => "available"), // "leased", "sold", "leased but not working", "leased but maintenance", "available","returned"
  lastAuditDate: text("last_audit_date"), // ISO date string
  auditStatus: text("audit_status"), // "Y", "N"
  maintenanceDate: text("maintenance_date"), // ISO date string, NULL for last maintenance date
  maintenanceStatus: text("maintenance_status"), // "Y", "N"
  orderStatus: text("order_status").$default(() => "INVENTORY"), // "RENT" = rent, "PURCHASE" = purchase , "INVENTORY" = in inventory
  productType: text("prod_type"), // "laptop", "desktop"
  createdBy: text("created_by"), // emp_id
  createdAt: text("created_at"), // ISO date string

  // Audit trail fields (Recommendation #2)
  auditTrail: text("audit_trail"), // JSON array of changes
  lastModifiedBy: text("last_modified_by"),
  lastModifiedAt: text("last_modified_at"),

  // Soft delete fields
  isDeleted: boolean("is_deleted").notNull().default(false),
  deletedAt: text("deleted_at"),
  deletedBy: text("deleted_by"),
});

// Clients table
// For Customer Info Tab
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  customerId: text("customer_id").notNull().unique(), // CX000001, CX000002, etc.
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: integer("zip_code"),
  company: text("company"),
  isActive: boolean("is_active").notNull().default(true),
  gst: text("gst"), // 15-digit GST number
  pan: text("pan"), // 10-digit PAN number
  website: text("website"),
  createdAt: text("created_at"), // ISO date string
  createdBy: text("created_by"), // emp_id
  updatedAt: text("updated_at"), // ISO date string
  updatedBy: text("updated_by"), // emp_id
});



// Product lifecycle date tracking
export const productDateEvents = pgTable("product_date_events", {
    id: serial("id").primaryKey(),
    adsId: text("ads_id").notNull(), // Reference to products.adsId
    clientId: integer("client_id"), // optional, for customer-related events
    eventType: text("event_type").notNull(), // see EVENT_TYPES constant below
    eventDate: text("event_date").notNull(), // ISO date string
    notes: text("notes"),
    createdAt: text("created_at").notNull(),
});

// Event types are now part of ENUMS.EVENT_TYPES


// For Orders TAB
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(), // Reference to clients.id
  adsIds: text("ads_ids").array().notNull(), // Array of adsIds for products in this order
  orderId: text("order_id").notNull().unique(), // Auto-generated based on customer ID and date
  orderType: text("order_type").notNull(), // "RENT" = rent, "PURCHASE" = purchase (only these two values)
  requiredPieces: integer("required_pieces").notNull(),
  deliveredPieces: integer("delivered_pieces").notNull().default(0),
  paymentPerPiece: decimal("payment_per_piece", { precision: 10, scale: 2 }).notNull(), // this is irrelevant as multiple products can have different prices
  securityDeposit: decimal("security_deposit", { precision: 10, scale: 2 }),
  totalPaymentReceived: decimal("total_payment", { precision: 10, scale: 2 }).notNull(),
  contractDate: text("contract_date").notNull(), // ISO date string
  deliveryDate: text("delivery_date"), // ISO date string
  estimatedDeliveryDate: text("estimated_delivery_date"), // ISO date string
  orderDeliveryStatus: text("order_delivery_status").$default(() => "pending"), // "pending", "in_transit", "delivered"
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }),
  quotedPrice: decimal("quoted_price", { precision: 10, scale: 2 }),
  discount: text("discount"),
  createdAt: text("created_at").notNull(), // ISO date string
  createdBy: text("created_by"), // emp_id
  productType: text("prod_type"), // "laptop", "desktop"
});

// Order Items table - Junction table for orders and products with individual pricing
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: text("order_id").notNull(), // Reference to orders.orderId
  adsId: text("ads_id").notNull(), // Reference to products.adsId
  sellingPrice: decimal("selling_price", { precision: 10, scale: 2 }).notNull(), // For PURCHASE orders
  rentalPricePerMonth: decimal("rental_price_per_month", { precision: 10, scale: 2 }), // For RENT orders
  createdAt: text("created_at").notNull(), // ISO date string
});

// Sales Buy table - for purchase transactions
// For Sales And Revenue TAB
export const salesBuy = pgTable("sales_buy", {
  id: serial("id").primaryKey(),
  adsId: text("ads_id").notNull(), // Reference to products.adsId
  salesDate: text("sales_date").notNull(), // ISO date string - when payment is received
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }).notNull(),
  sellingPrice: decimal("selling_price", { precision: 10, scale: 2 }).notNull(),
  customerId: integer("customer_id").notNull(), // Reference to clients.id
  orderId: text("order_id"), // Reference to orders.orderId
  miscCost: decimal("misc_cost", { precision: 10, scale: 2 }), // Cisco, Anti virus etc
  empId: text("emp_id"), // Employee who did the sales
  createdBy: text("created_by"), // emp_id
  createdAt: text("created_at").notNull(), // ISO date string
  updatedAt: text("updated_at").notNull(), // ISO date string
});

// Sales Rent table - for rental/lease transactions
// For Sales And Revenue TAB
export const salesRent = pgTable("sales_rent", {
  id: serial("id").primaryKey(),
  adsId: text("ads_id").notNull(), // Reference to products.adsId
  prodId: text("prod_id"), // Serial number
  customerId: integer("customer_id").notNull(), // Reference to clients.id
  paymentDate: text("payment_date").notNull(), // ISO date string - when product is leased/rented
  paymentDueDate: text("payment_due_date").notNull(), // Start and End date for EMIs
  paymentStatus: text("payment_status").notNull(), // "Pending", "Incoming", "Complete"
  leasedQuantity: integer("leased_quantity").notNull(),
  leaseAmount: decimal("lease_amount", { precision: 10, scale: 2 }).notNull(),
  paymentFrequency: integer("payment_frequency").notNull(), // 1 = per month, 2 = per 2 months
  paymentTotalNumber: integer("payment_total_number").notNull(),
  empId: text("emp_id"), // Employee ID
  createdBy: text("created_by"), // emp_id
  createdAt: text("created_at").notNull(), // ISO date string
  updatedAt: text("updated_at").notNull(), // ISO date string
});

// Users table with employee ID system
// Employee IDs are auto-generated in ADS0001 format during user creation
// Database resets on every npm run dev - see README.md for details
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(), // e.g., "admin", "manager", "staff"
  employeeId: text("employee_id").unique(), // ADS0001, ADS0002, etc. - auto-generated
  dateOfCreation: text("date_of_creation").notNull(), // ISO date string
  isActive: boolean("is_active").notNull().default(true), // Only active users can login
});

// Insert schemas with enhanced validation
export const insertProductSchema = createInsertSchema(products, {
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  costPrice: z.coerce.number().positive("Cost price must be positive").refine(val => {
    const decimalPart = val.toString().split('.')[1];
    return !decimalPart || decimalPart.length <= 2;
  }, "Cost price must have at most 2 decimal places"),
  prodId: z.string().min(1, "Serial/Product ID is required"),
  prodHealth: z.enum(["working", "maintenance", "expired"]).optional(),
  prodStatus: z.enum(["leased", "sold", "leased but not working", "leased but maintenance", "available", "returned"]).optional(),
  orderStatus: z.enum(["RENT", "PURCHASE", "INVENTORY"]).optional(),
  productType: z.enum(["laptop", "desktop"]).optional(),
}).omit({
  adsId: true,
  referenceNumber: true,
  createdAt: true,
  auditTrail: true,
  lastModifiedBy: true,
  lastModifiedAt: true,
  deletedAt: true,
  deletedBy: true,
});

// Schema for updating products - allows lastModifiedBy
export const updateProductSchema = createInsertSchema(products, {
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  costPrice: z.coerce.number().positive("Cost price must be positive").refine(val => {
    const decimalPart = val.toString().split('.')[1];
    return !decimalPart || decimalPart.length <= 2;
  }, "Cost price must have at most 2 decimal places"),
  prodId: z.string().min(1, "Serial/Product ID is required"),
  prodHealth: z.enum(["working", "maintenance", "expired"]).optional(),
  prodStatus: z.enum(["leased", "sold", "leased but not working", "leased but maintenance", "available", "returned"]).optional(),
  orderStatus: z.enum(["RENT", "PURCHASE", "INVENTORY"]).optional(),
  productType: z.enum(["laptop", "desktop"]).optional(),
  lastModifiedBy: z.string().optional(),
}).omit({
  adsId: true,
  referenceNumber: true,
  auditTrail: true,
  lastModifiedAt: true,
  deletedAt: true,
  deletedBy: true,
});


export const insertClientSchema = createInsertSchema(clients, {
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().regex(/^\d{10}$/, "Mobile number must be exactly 10 digits"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.coerce.number().int().positive().optional().refine(val => !val || val.toString().length === 6, "PIN code must be exactly 6 digits"),
  company: z.string().optional(),
  gst: z.string().optional().refine(val => !val || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9]{1}[A-Z]{1}[0-9]{1}$/.test(val), "GST must be 15 characters in format: 22AAAAA0000A1Z5"),
  pan: z.string().optional().refine(val => !val || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val), "PAN must be in format AAAAA9999A"),
  website: z.string().url("Valid website URL required").optional(),
}).omit({
  id: true,
  customerId: true,
  createdAt: true,
  createdBy: true,
  updatedAt: true,
  updatedBy: true,
});

export const updateClientSchema = createInsertSchema(clients, {
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().regex(/^\d{10}$/, "Mobile number must be exactly 10 digits"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.coerce.number().int().positive().optional().refine(val => !val || val.toString().length === 6, "PIN code must be exactly 6 digits"),
  company: z.string().optional(),
  gst: z.string().optional().refine(val => !val || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9]{1}[A-Z]{1}[0-9]{1}$/.test(val), "GST must be 15 characters in format: 22AAAAA0000A1Z5"),
  pan: z.string().optional().refine(val => !val || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val), "PAN must be in format AAAAA9999A"),
  website: z.string().url("Valid website URL required").optional(),
}).omit({
  id: true,
  customerId: true,
  createdAt: true,
  createdBy: true,
});

export const insertProductDateEventSchema = createInsertSchema(productDateEvents, {
  adsId: z.string().regex(/^\d{11}$/, "adsId must be exactly 11 digits"),
  clientId: z.number().int().positive("Valid client ID required").optional(),
  eventType: z.string().min(1, "Event type is required"),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/, "Valid ISO date required"),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/, "Valid ISO date required"),
}).omit({
  id: true,
});

export const insertUserSchema = createInsertSchema(users, {
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.string().min(1, "Role is required"),
  employeeId: z.string().regex(/^ADS\d{4}$/, "Employee ID must be in format ADS0001").optional(),
  dateOfCreation: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/, "Valid ISO date required"),
}).omit({
  id: true,
});

const baseInsertOrderSchema = createInsertSchema(orders, {
  customerId: z.number().int().positive("Valid customer ID required"),
  adsIds: z.array(z.string().regex(/^\d{11}$/, "Each adsId must be 11 digits")).min(1, "At least one product required"),
  orderId: z.string().min(1, "Order ID is required"),
  orderType: z.enum(["RENT", "PURCHASE"]),
  requiredPieces: z.number().int().positive("Required pieces must be positive"),
  deliveredPieces: z.number().int().min(0, "Delivered pieces cannot be negative").optional(),
  paymentPerPiece: z.coerce.number().positive("Payment per piece must be positive").refine(val => {
    const decimalPart = val.toString().split('.')[1];
    return !decimalPart || decimalPart.length <= 2;
  }, "Payment per piece must have at most 2 decimal places"),
  securityDeposit: z.coerce.number().min(0, "Security deposit cannot be negative").optional().refine(val => {
    if (val === undefined) return true;
    const decimalPart = val.toString().split('.')[1];
    return !decimalPart || decimalPart.length <= 2;
  }, "Security deposit must have at most 2 decimal places"),
  totalPaymentReceived: z.coerce.number().min(0, "Total payment cannot be negative").refine(val => {
    const decimalPart = val.toString().split('.')[1];
    return !decimalPart || decimalPart.length <= 2;
  }, "Total payment must have at most 2 decimal places"),
  contractDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/, "Valid ISO date required"),
  deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/, "Valid ISO date required").optional(),
  estimatedDeliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/, "Valid ISO date required").optional(),
  orderDeliveryStatus: z.enum(["pending", "in_transit", "delivered"]).optional(),
  discountPercentage: z.coerce.number().min(0, "Discount cannot be negative").max(100, "Discount cannot exceed 100%").optional().refine(val => {
    if (val === undefined) return true;
    const decimalPart = val.toString().split('.')[1];
    return !decimalPart || decimalPart.length <= 2;
  }, "Discount percentage must have at most 2 decimal places"),
  quotedPrice: z.coerce.number().min(0, "Quoted price cannot be negative").optional().refine(val => {
    if (val === undefined) return true;
    const decimalPart = val.toString().split('.')[1];
    return !decimalPart || decimalPart.length <= 2;
  }, "Quoted price must have at most 2 decimal places"),
  productType: z.enum(["laptop", "desktop"]).optional(),
}).omit({
  id: true,
});

export { baseInsertOrderSchema };

export const insertOrderSchema = baseInsertOrderSchema.refine((data) => data.orderType === "RENT" || data.orderType === "PURCHASE", {
  message: "Order type must be either 'RENT' or 'PURCHASE'",
  path: ["orderType"],
}).refine((data) => data.adsIds.length === data.requiredPieces, {
  message: "Number of adsIds must match required pieces",
  path: ["adsIds"],
});

export const insertSalesBuySchema = createInsertSchema(salesBuy, {
  adsId: z.string().regex(/^\d{11}$/, "adsId must be exactly 11 digits"),
  salesDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/, "Valid ISO date required"),
  costPrice: z.coerce.number().positive("Cost price must be positive").refine(val => {
    const decimalPart = val.toString().split('.')[1];
    return !decimalPart || decimalPart.length <= 2;
  }, "Cost price must have at most 2 decimal places"),
  sellingPrice: z.coerce.number().positive("Selling price must be positive").refine(val => {
    const decimalPart = val.toString().split('.')[1];
    return !decimalPart || decimalPart.length <= 2;
  }, "Selling price must have at most 2 decimal places"),
  customerId: z.number().int().positive("Valid customer ID required"),
  orderId: z.string().optional(),
  miscCost: z.coerce.number().min(0, "Misc cost cannot be negative").optional().refine(val => {
    if (val === undefined) return true;
    const decimalPart = val.toString().split('.')[1];
    return !decimalPart || decimalPart.length <= 2;
  }, "Misc cost must have at most 2 decimal places"),
  empId: z.string().optional(),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/, "Valid ISO date required"),
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/, "Valid ISO date required"),
}).omit({
  id: true,
});

export const insertSalesRentSchema = createInsertSchema(salesRent, {
  adsId: z.string().regex(/^\d{11}$/, "adsId must be exactly 11 digits"),
  prodId: z.string().optional(),
  customerId: z.number().int().positive("Valid customer ID required"),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/, "Valid ISO date required"),
  paymentDueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/, "Valid ISO date required"),
  paymentStatus: z.enum(["Pending", "Incoming", "Complete"]),
  leasedQuantity: z.number().int().positive("Leased quantity must be positive"),
  leaseAmount: z.coerce.number().positive("Lease amount must be positive").refine(val => {
    const decimalPart = val.toString().split('.')[1];
    return !decimalPart || decimalPart.length <= 2;
  }, "Lease amount must have at most 2 decimal places"),
  paymentFrequency: z.number().int().min(1, "Payment frequency must be at least 1"),
  paymentTotalNumber: z.number().int().positive("Payment total number must be positive"),
  empId: z.string().optional(),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/, "Valid ISO date required"),
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/, "Valid ISO date required"),
}).omit({
  id: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems, {
  orderId: z.string().min(1, "Order ID is required"),
  adsId: z.string().regex(/^\d{11}$/, "adsId must be exactly 11 digits"),
  sellingPrice: z.coerce.number().positive("Selling price must be positive").refine(val => {
    const decimalPart = val.toString().split('.')[1];
    return !decimalPart || decimalPart.length <= 2;
  }, "Selling price must have at most 2 decimal places"),
  rentalPricePerMonth: z.coerce.number().positive("Rental price must be positive").optional().refine(val => {
    if (val === undefined) return true;
    const decimalPart = val.toString().split('.')[1];
    return !decimalPart || decimalPart.length <= 2;
  }, "Rental price must have at most 2 decimal places"),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/, "Valid ISO date required"),
}).omit({
  id: true,
});

// Types
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type UpdateClient = z.infer<typeof updateClientSchema>;


export type ProductDateEvent = typeof productDateEvents.$inferSelect;
export type InsertProductDateEvent = z.infer<typeof insertProductDateEventSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type SalesBuy = typeof salesBuy.$inferSelect;
export type InsertSalesBuy = z.infer<typeof insertSalesBuySchema>;

export type SalesRent = typeof salesRent.$inferSelect;
export type InsertSalesRent = z.infer<typeof insertSalesRentSchema>;


// Extended types for joins
// Note: Sale table removed - using salesBuy and salesRent instead

// Relations
export const clientsRelations = relations(clients, ({ many }) => ({
  productDateEvents: many(productDateEvents),
  orders: many(orders),
  salesBuy: many(salesBuy),
  salesRent: many(salesRent),
}));

export const productsRelations = relations(products, ({ many }) => ({
  productDateEvents: many(productDateEvents),
  salesBuy: many(salesBuy),
  salesRent: many(salesRent),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  client: one(clients, {
    fields: [orders.customerId],
    references: [clients.id],
  }),
  salesBuy: many(salesBuy),
  // Note: adsIds is an array, so we don't define direct relations here
  // Relations are handled through the sales tables
}));

export const usersRelations = relations(users, ({ many }) => ({
  // Note: User sessions are managed through passport/connect-pg-simple
  // No direct database relationship to sessions table
}));

export const productDateEventsRelations = relations(productDateEvents, ({ one }) => ({
  client: one(clients, {
    fields: [productDateEvents.clientId],
    references: [clients.id],
  }),
  product: one(products, {
    fields: [productDateEvents.adsId],
    references: [products.adsId],
  }),
}));

export const salesBuyRelations = relations(salesBuy, ({ one }) => ({
  client: one(clients, {
    fields: [salesBuy.customerId],
    references: [clients.id],
  }),
  product: one(products, {
    fields: [salesBuy.adsId],
    references: [products.adsId],
  }),
  order: one(orders, {
    fields: [salesBuy.orderId],
    references: [orders.orderId],
  }),
}));

export const salesRentRelations = relations(salesRent, ({ one }) => ({
  client: one(clients, {
    fields: [salesRent.customerId],
    references: [clients.id],
  }),
  product: one(products, {
    fields: [salesRent.adsId],
    references: [products.adsId],
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.orderId],
  }),
  product: one(products, {
    fields: [orderItems.adsId],
    references: [products.adsId],
  }),
}));

// Note: Sessions store user info in the sess JSON field
// No direct foreign key relationship needed
