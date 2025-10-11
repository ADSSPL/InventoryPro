// Centralized Enums for Dropdown Values and Validation
// This file contains all application enums that will grow over time

export const ENUMS = {
  // Product enums
  PRODUCT_CATEGORY: {
    LAPTOP: "laptop",
    DESKTOP: "desktop"
  } as const,

  PRODUCT_CONDITION: {
    NEW: "new",
    REFURBISHED: "refurbished",
    USED: "used"
  } as const,

  PRODUCT_HEALTH: {
    WORKING: "working",
    MAINTENANCE: "maintenance",
    EXPIRED: "expired"
  } as const,

  PRODUCT_STATUS: {
    LEASED: "leased",
    SOLD: "sold",
    LEASED_NOT_WORKING: "leased but not working",
    LEASED_MAINTENANCE: "leased but maintenance",
    AVAILABLE: "available",
    RETURNED: "returned"
  } as const,

  // Order and Product Status enums
  ORDER_TYPE: {
    RENT: "RENT",
    PURCHASE: "PURCHASE"
  } as const,

  ORDER_STATUS: {
    RENT: "RENT",
    PURCHASE: "PURCHASE",
    INVENTORY: "INVENTORY"
  } as const,

  // Yes/No enums
  YES_NO: {
    YES: "Y",
    NO: "N"
  } as const,

  // Client enums
  CLIENT_TYPE: {
    RETAIL: "Retail",
    ORGANIZATION: "ORG"
  } as const,

  ID_PROOF: {
    AADHAR: "Aadhar",
    PAN: "PAN"
  } as const,

  INDIAN_STATES: {
    ANDHRA_PRADESH: "Andhra Pradesh",
    ARUNACHAL_PRADESH: "Arunachal Pradesh",
    ASSAM: "Assam",
    BIHAR: "Bihar",
    CHHATTISGARH: "Chhattisgarh",
    GOA: "Goa",
    GUJARAT: "Gujarat",
    HARYANA: "Haryana",
    HIMACHAL_PRADESH: "Himachal Pradesh",
    JHARKHAND: "Jharkhand",
    KARNATAKA: "Karnataka",
    KERALA: "Kerala",
    MADHYA_PRADESH: "Madhya Pradesh",
    MAHARASHTRA: "Maharashtra",
    MANIPUR: "Manipur",
    MEGHALAYA: "Meghalaya",
    MIZORAM: "Mizoram",
    NAGALAND: "Nagaland",
    ODISHA: "Odisha",
    PUNJAB: "Punjab",
    RAJASTHAN: "Rajasthan",
    SIKKIM: "Sikkim",
    TAMIL_NADU: "Tamil Nadu",
    TELANGANA: "Telangana",
    TRIPURA: "Tripura",
    UTTAR_PRADESH: "Uttar Pradesh",
    UTTARAKHAND: "Uttarakhand",
    WEST_BENGAL: "West Bengal",
    DELHI: "Delhi",
    JAMMU_AND_KASHMIR: "Jammu and Kashmir",
    LADAKH: "Ladakh",
    PUDUCHERRY: "Puducherry",
    CHANDIGARH: "Chandigarh",
    ANDAMAN_AND_NICOBAR_ISLANDS: "Andaman and Nicobar Islands",
    DADRA_AND_NAGAR_HAVELI_AND_DAMAN_AND_DIU: "Dadra and Nagar Haveli and Daman and Diu",
    LAKSHADWEEP: "Lakshadweep"
  } as const,

  // Sales enums
  PAYMENT_STATUS: {
    PENDING: "Pending",
    INCOMING: "Incoming",
    COMPLETE: "Complete"
  } as const,

  // Event types for product lifecycle tracking
  EVENT_TYPES: {
    PRODUCT_ADDED: "product_added",
    FIRST_SALE: "first_sale_to_customer",
    RETURNED_FROM_CUSTOMER: "returned_from_customer",
    REPAIR_STARTED: "repair_started",
    REPAIR_COMPLETED: "repair_completed",
    RESALE_TO_CUSTOMER: "resale_to_customer",
    RECOVERY_RECEIVED: "recovery_received",
    QUALITY_CHECK: "quality_check",
    PRICE_UPDATED: "price_updated",
    STOCK_UPDATED: "stock_updated",
    CUSTOMER_COMPLAINT: "customer_complaint",
    WARRANTY_CLAIM: "warranty_claim",
    DISPOSED: "disposed"
  } as const
} as const;

// Helper function to get enum values as array
export const getEnumValues = (enumObj: Record<string, string>) => {
  return Object.values(enumObj);
};

// Helper function to get enum options for dropdowns
export const getEnumOptions = (enumObj: Record<string, string>) => {
  return Object.entries(enumObj).map(([key, value]) => ({
    label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: value
  }));
};

// Type helpers for better TypeScript support
export type ProductCategory = typeof ENUMS.PRODUCT_CATEGORY[keyof typeof ENUMS.PRODUCT_CATEGORY];
export type ProductCondition = typeof ENUMS.PRODUCT_CONDITION[keyof typeof ENUMS.PRODUCT_CONDITION];
export type ProductHealth = typeof ENUMS.PRODUCT_HEALTH[keyof typeof ENUMS.PRODUCT_HEALTH];
export type ProductStatus = typeof ENUMS.PRODUCT_STATUS[keyof typeof ENUMS.PRODUCT_STATUS];
export type OrderType = typeof ENUMS.ORDER_TYPE[keyof typeof ENUMS.ORDER_TYPE];
export type OrderStatus = typeof ENUMS.ORDER_STATUS[keyof typeof ENUMS.ORDER_STATUS];
export type YesNo = typeof ENUMS.YES_NO[keyof typeof ENUMS.YES_NO];
export type ClientType = typeof ENUMS.CLIENT_TYPE[keyof typeof ENUMS.CLIENT_TYPE];
export type IdProof = typeof ENUMS.ID_PROOF[keyof typeof ENUMS.ID_PROOF];
export type PaymentStatus = typeof ENUMS.PAYMENT_STATUS[keyof typeof ENUMS.PAYMENT_STATUS];
export type EventType = typeof ENUMS.EVENT_TYPES[keyof typeof ENUMS.EVENT_TYPES];
export type IndianState = typeof ENUMS.INDIAN_STATES[keyof typeof ENUMS.INDIAN_STATES];