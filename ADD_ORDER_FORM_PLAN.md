# Add Order Form Implementation Plan

## Overview
This document outlines the complete implementation plan for the enhanced Add Order Form with customer search, inline customer creation, product selection with individual pricing, and comprehensive order management.

## Database Schema Changes ✅ COMPLETED

### 1. Orders Table - New Fields Added
- `estimatedDeliveryDate`: ISO date string
- `orderDeliveryStatus`: "pending" | "in_transit" | "delivered"
- `discountPercentage`: decimal(5,2)

### 2. OrderItems Junction Table Created
```sql
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id TEXT NOT NULL,
  ads_id TEXT NOT NULL,
  selling_price DECIMAL(10,2) NOT NULL,
  rental_price_per_month DECIMAL(10,2),
  created_at TEXT NOT NULL
);
```

### 3. Schema Validation & Types Added
- `insertOrderItemSchema` with validation
- `OrderItem` and `InsertOrderItem` types
- Relations: `orderItemsRelations`

## Backend Implementation

### Phase 1: Storage Layer (server/storage.ts)

#### A. Add OrderItem Import
```typescript
import {
  // ... existing imports
  OrderItem, InsertOrderItem
} from "@shared/schema";
```

#### B. Update IStorage Interface
```typescript
export interface IStorage {
  // ... existing methods
  
  // Order Items
  getOrderItems(orderId: string): Promise<OrderItem[]>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  createOrderItems(orderItems: InsertOrderItem[]): Promise<OrderItem[]>;
  deleteOrderItems(orderId: string): Promise<boolean>;
}
```

#### C. Implement OrderItem Methods
```typescript
// Get order items by order ID
async getOrderItems(orderId: string): Promise<OrderItem[]> {
  const res = await pool.query(
    "SELECT * FROM order_items WHERE order_id = $1 ORDER BY created_at",
    [orderId]
  );
  return res.rows.map(row => ({
    id: row.id,
    orderId: row.order_id,
    adsId: row.ads_id,
    sellingPrice: row.selling_price,
    rentalPricePerMonth: row.rental_price_per_month,
    createdAt: row.created_at
  }));
}

// Create single order item
async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
  const res = await pool.query(
    `INSERT INTO order_items 
      (order_id, ads_id, selling_price, rental_price_per_month, created_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      item.orderId,
      item.adsId,
      item.sellingPrice,
      item.rentalPricePerMonth ?? null,
      item.createdAt
    ]
  );
  
  const row = res.rows[0];
  return {
    id: row.id,
    orderId: row.order_id,
    adsId: row.ads_id,
    sellingPrice: row.selling_price,
    rentalPricePerMonth: row.rental_price_per_month,
    createdAt: row.created_at
  };
}

// Create multiple order items (bulk)
async createOrderItems(items: InsertOrderItem[]): Promise<OrderItem[]> {
  const client = await pool.connect();
  const created: OrderItem[] = [];
  
  try {
    await client.query('BEGIN');
    
    for (const item of items) {
      const res = await client.query(
        `INSERT INTO order_items 
          (order_id, ads_id, selling_price, rental_price_per_month, created_at)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          item.orderId,
          item.adsId,
          item.sellingPrice,
          item.rentalPricePerMonth ?? null,
          item.createdAt
        ]
      );
      
      const row = res.rows[0];
      created.push({
        id: row.id,
        orderId: row.order_id,
        adsId: row.ads_id,
        sellingPrice: row.selling_price,
        rentalPricePerMonth: row.rental_price_per_month,
        createdAt: row.created_at
      });
    }
    
    await client.query('COMMIT');
    return created;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Delete all order items for an order
async deleteOrderItems(orderId: string): Promise<boolean> {
  const res = await pool.query(
    "DELETE FROM order_items WHERE order_id = $1",
    [orderId]
  );
  return (res.rowCount ?? 0) > 0;
}
```

#### D. Update getOrders() Method
Fix the mapping to include new fields:
```typescript
async getOrders(): Promise<Order[]> {
  const res = await pool.query("SELECT * FROM orders ORDER BY created_at DESC");
  return res.rows.map(row => ({
    id: row.id,
    adsIds: row.ads_ids || [],
    customerId: row.customer_id,
    orderId: row.order_id,
    orderType: row.order_type,
    requiredPieces: row.required_pieces,
    deliveredPieces: row.delivered_pieces,
    paymentPerPiece: row.payment_per_piece,
    securityDeposit: row.security_deposit,
    totalPaymentReceived: row.total_payment_received,
    contractDate: row.contract_date,
    deliveryDate: row.delivery_date,
    estimatedDeliveryDate: row.estimated_delivery_date,  // NEW
    orderDeliveryStatus: row.order_delivery_status,      // NEW
    discountPercentage: row.discount_percentage,          // NEW
    quotedPrice: row.quoted_price,
    discount: row.discount,
    productType: row.prod_type,
    createdBy: row.created_by,
    createdAt: row.created_at
  }));
}
```

#### E. Update createOrder() Method
Completely rewrite to handle new schema and orderItems:
```typescript
async createOrder(insertOrder: InsertOrder): Promise<Order> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Create the order
    const orderRes = await client.query(
      `INSERT INTO orders
        (ads_ids, customer_id, order_id, order_type, required_pieces, 
         delivered_pieces, payment_per_piece, security_deposit, 
         total_payment_received, contract_date, delivery_date, 
         estimated_delivery_date, order_delivery_status, discount_percentage,
         quoted_price, discount, prod_type, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
       RETURNING *`,
      [
        insertOrder.adsIds,
        insertOrder.customerId,
        insertOrder.orderId,
        insertOrder.orderType,
        insertOrder.requiredPieces,
        insertOrder.deliveredPieces ?? 0,
        insertOrder.paymentPerPiece,
        insertOrder.securityDeposit ?? null,
        insertOrder.totalPaymentReceived,
        insertOrder.contractDate,
        insertOrder.deliveryDate ?? null,
        insertOrder.estimatedDeliveryDate ?? null,
        insertOrder.orderDeliveryStatus ?? 'pending',
        insertOrder.discountPercentage ?? null,
        insertOrder.quotedPrice ?? null,
        insertOrder.discount ?? null,
        insertOrder.productType ?? null,
        insertOrder.createdBy ?? null,
        insertOrder.createdAt ?? new Date().toISOString()
      ]
    );
    
    await client.query('COMMIT');
    const row = orderRes.rows[0];
    
    return {
      id: row.id,
      customerId: row.customer_id,
      adsIds: row.ads_ids,
      orderId: row.order_id,
      orderType: row.order_type,
      requiredPieces: row.required_pieces,
      deliveredPieces: row.delivered_pieces,
      paymentPerPiece: row.payment_per_piece,
      securityDeposit: row.security_deposit,
      totalPaymentReceived: row.total_payment_received,
      contractDate: row.contract_date,
      deliveryDate: row.delivery_date,
      estimatedDeliveryDate: row.estimated_delivery_date,
      orderDeliveryStatus: row.order_delivery_status,
      discountPercentage: row.discount_percentage,
      quotedPrice: row.quoted_price,
      discount: row.discount,
      productType: row.prod_type,
      createdBy: row.created_by,
      createdAt: row.created_at
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

### Phase 2: API Routes (server/routes.ts)

#### A. Customer Search Endpoint ✅ COMPLETED
```typescript
GET /api/clients/search?q={query}&field={pan|gst|name|id}
```

#### B. Available Products Endpoint ✅ COMPLETED
```typescript
GET /api/products/available
// Returns products with orderStatus="INVENTORY" and prodStatus="available"
```

#### C. Enhanced Order Creation Endpoint
Update POST /api/orders to handle orderItems:
```typescript
app.post("/api/orders", async (req, res) => {
  try {
    const { products, ...orderData } = req.body;
    
    // Validate products array exists
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ 
        message: "Products array is required" 
      });
    }
    
    // Validate all products are available
    for (const product of products) {
      const prod = await storage.getProductByAdsId(product.adsId);
      if (!prod) {
        return res.status(400).json({
          message: `Product ${product.adsId} not found`
        });
      }
      if (prod.orderStatus !== "INVENTORY") {
        return res.status(400).json({
          message: `Product ${product.adsId} is not available`
        });
      }
    }
    
    // Prepare order data
    const adsIds = products.map(p => p.adsId);
    const subtotal = products.reduce((sum, p) => sum + parseFloat(p.price), 0);
    const discountAmount = subtotal * ((orderData.discountPercentage || 0) / 100);
    const totalPayment = subtotal - discountAmount + (parseFloat(orderData.securityDeposit) || 0);
    
    const order = await storage.createOrder({
      ...orderData,
      adsIds,
      requiredPieces: products.length,
      totalPaymentReceived: totalPayment,
      quotedPrice: subtotal,
      createdAt: new Date().toISOString()
    });
    
    // Create order items
    const orderItems = products.map(product => ({
      orderId: order.orderId,
      adsId: product.adsId,
      sellingPrice: product.price,
      rentalPricePerMonth: orderData.orderType === "RENT" ? product.price : null,
      createdAt: new Date().toISOString()
    }));
    
    await storage.createOrderItems(orderItems);
    
    // Update product statuses
    for (const adsId of adsIds) {
      await storage.updateProductOrderStatus(adsId, orderData.orderType);
      await storage.updateProductProdStatus(
        adsId,
        orderData.orderType === "RENT" ? "leased" : "sold"
      );
      
      // Create product date event
      await storage.createProductDateEvent({
        adsId,
        clientId: orderData.customerId,
        eventType: orderData.orderType === "RENT" ? "leased" : "sold",
        eventDate: orderData.contractDate,
        notes: `Order ${order.orderId} - ${orderData.orderType}`,
        createdAt: new Date().toISOString()
      });
    }
    
    res.status(201).json(order);
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(400).json({ 
      message: "Failed to create order",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
```

## Frontend Implementation

### Phase 3: OrderFormV2 Component

Create new file: `client/src/components/forms/order-form-v2.tsx`

#### Component Structure
```typescript
interface OrderFormV2Props {
  onSuccess: () => void;
  onCancel: () => void;
}

interface SelectedProduct {
  adsId: string;
  brand: string;
  model: string;
  price: number;
}

interface OrderFormState {
  // Customer selection
  selectedCustomer: Client | null;
  isCreatingCustomer: boolean;
  
  // Order type
  orderType: 'RENT' | 'PURCHASE';
  
  // Products
  selectedProducts: SelectedProduct[];
  
  // Order details
  contractDate: string;
  estimatedDeliveryDate: string;
  deliveryDate: string;
  orderDeliveryStatus: 'pending' | 'in_transit' | 'delivered';
  discountPercentage: number;
  securityDeposit: number;
  
  // Calculations
  subtotal: number;
  discountAmount: number;
  totalPayment: number;
}
```

#### Key Features
1. **Customer Selection Step**
   - Radio buttons: "New Customer" / "Existing Customer"
   - Existing: Multi-field search (PAN/GST/Name/ID)
   - New: Inline ClientForm component
   - Display current date prominently

2. **Order Type Selection**
   - Toggle between RENT/PURCHASE
   - Changes price label (Monthly Rental / Selling Price)

3. **Product Selection**
   - Search input for ADS ID or product name
   - Dropdown with available products only
   - Dynamic table showing added products
   - Individual price input for each product
   - Remove button per product

4. **Order Details Form**
   - Contract Date (required, defaults to today)
   - Estimated Delivery Date
   - Actual Delivery Date
   - Order Status dropdown
   - Discount Percentage (0-100)
   - Security Deposit (RENT only)

5. **Order Summary**
   - Real-time calculations:
     - Subtotal = sum of all product prices
     - Discount = subtotal × (discount% ÷ 100)
     - Total = subtotal - discount + security deposit

6. **Validation**
   - Customer selected
   - At least one product added
   - All products have price > 0
   - Required dates filled
   - Discount within 0-100%

### Phase 4: Integration

#### Update client/src/pages/orders.tsx
Replace OrderForm with OrderFormV2:
```typescript
import OrderFormV2 from "@/components/forms/order-form-v2";

// In the Dialog component:
<OrderFormV2
  onSuccess={() => setIsOrderFormOpen(false)}
  onCancel={() => setIsOrderFormOpen(false)}
/>
```

## Testing Checklist

### Backend Testing
- [ ] Customer search works with all fields (PAN, GST, Name, ID)
- [ ] Available products endpoint returns only INVENTORY products
- [ ] Order creation with orderItems succeeds
- [ ] Product statuses update correctly
- [ ] Product date events are created
- [ ] Transaction rollback works on error

### Frontend Testing
- [ ] Customer search is fast and accurate
- [ ] Inline customer form creates and selects customer
- [ ] Product search filters correctly
- [ ] Adding/removing products updates table
- [ ] Price calculations are accurate
- [ ] RENT shows security deposit field
- [ ] PURCHASE hides security deposit field
- [ ] Validation messages are clear
- [ ] Form submission creates order successfully
- [ ] Success message displays correctly

### Integration Testing
- [ ] Complete flow: search customer → select → add products → submit
- [ ] Complete flow: create new customer → add products → submit
- [ ] Error handling: product not available
- [ ] Error handling: network errors
- [ ] Database reset creates schema correctly

## Implementation Priority

1. **HIGH PRIORITY** (Complete first)
   - [x] Database schema changes
   - [x] Customer search endpoint
   - [x] Available products endpoint
   - [ ] Storage methods for orderItems
   - [ ] Update order creation endpoint

2. **MEDIUM PRIORITY** (After backend works)
   - [ ] Create OrderFormV2 base component
   - [ ] Implement customer selection step
   - [ ] Implement product selection
   - [ ] Implement order details form
   - [ ] Implement calculation summary

3. **LOW PRIORITY** (Polish and test)
   - [ ] Add loading states
   - [ ] Add error handling
   - [ ] Add validation messages
   - [ ] Test all flows
   - [ ] Update documentation

## Notes

- Following database reset strategy - no migrations needed
- Schema automatically recreated on `npm run dev`
- All changes tested after database reset
- Backend must be completed before frontend testing
- Use existing UI components (Button, Input, Dialog, etc.)
- Follow existing code patterns in project

## Next Steps

1. Add orderItems methods to storage.ts
2. Update order creation endpoint in routes.ts
3. Create OrderFormV2 component
4. Test complete flow
5. Update documentation