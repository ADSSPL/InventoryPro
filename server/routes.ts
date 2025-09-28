import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertProductSchema,
  updateProductSchema,
  insertClientSchema,
  insertProductDateEventSchema,
  baseInsertOrderSchema,
  insertSalesBuySchema,
  insertSalesRentSchema
} from "@shared/schema";
import { ENUMS, getEnumValues, getEnumOptions } from "@shared/enums";
import passport from "passport";
import pool from "../db";
import bcrypt from "bcrypt";
import { drizzle } from "drizzle-orm/node-postgres";
import multer from "multer";
import csv from "csv-parser";
import * as XLSX from "xlsx";
import { Readable } from "stream";

// Configure multer for file uploads
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Sample CSV download route
  app.get("/api/products/sample-csv", (req, res) => {
    console.log('Generating sample CSV template...');

    const sampleData = [
      {
        brand: "Apple",
        model: "MacBook Pro",
        condition: "new",
        costPrice: "1999.99",
        specifications: "16GB RAM, 512GB SSD, M2 Pro chip",
        prodId: "MBP001",
        prodHealth: "working",
        prodStatus: "available",
        orderStatus: "INVENTORY",
        productType: "laptop",
        createdBy: "ADS0001"
      },
      {
        brand: "Dell",
        model: "XPS 13",
        condition: "refurbished",
        costPrice: "699.99",
        specifications: "8GB RAM, 256GB SSD, Intel i5",
        prodId: "DXPS001",
        prodHealth: "working",
        prodStatus: "available",
        orderStatus: "INVENTORY",
        productType: "laptop",
        createdBy: "ADS0001"
      }
    ];

    console.log('Sample data:', JSON.stringify(sampleData, null, 2));

    const headers = 'brand,model,condition,costPrice,specifications,prodId,prodHealth,prodStatus,orderStatus,productType,createdBy';
    console.log('CSV Headers:', headers);

    const csvRows = sampleData.map((row, index) => {
      const csvRow = `"${row.brand}","${row.model}","${row.condition}","${row.costPrice}","${row.specifications}","${row.prodId}","${row.prodHealth}","${row.prodStatus}","${row.orderStatus}","${row.productType}","${row.createdBy}"`;
      console.log(`Row ${index + 1} CSV:`, csvRow);
      return csvRow;
    });

    const csvContent = [headers, ...csvRows].join('\n');
    console.log('Full CSV content length:', csvContent.length);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="sample_products.csv"');
    res.send(csvContent);
  });

  // File upload route
  app.post("/api/products/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileExtension = req.file.originalname.split('.').pop()?.toLowerCase();
      const products: any[] = [];

      if (fileExtension === 'csv') {
        // Parse CSV
        const csvData = req.file.buffer.toString('utf-8');
        const stream = Readable.from(csvData);

        await new Promise((resolve, reject) => {
          stream
            .pipe(csv())
            .on('data', (row) => {
              products.push(row);
            })
            .on('end', resolve)
            .on('error', reject);
        });
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Parse Excel
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        products.push(...jsonData);
      } else {
        return res.status(400).json({ message: "Unsupported file format" });
      }

      // Validate and transform data
      const validProducts = [];
      const errors = [];

      for (let i = 0; i < products.length; i++) {
        const row = products[i];
        try {
          // Map CSV/Excel columns to our schema
          const productData: any = {
            brand: row.brand || row.Brand,
            model: row.model || row.Model,
            condition: row.condition || row.Condition || 'new',
            costPrice: (row.costPrice || row.cost || row.Cost || '0').toString(),
            specifications: row.specifications || row.Specifications || null,
            prodId: row.prodId || row.prod_id || null,
            prodHealth: row.prodHealth || row.prod_health || 'working',
            prodStatus: row.prodStatus || row.prod_status || 'available',
            lastAuditDate: row.lastAuditDate || row.last_audit_date || null,
            auditStatus: row.auditStatus || row.audit_status || null,
            maintenanceDate: row.maintenanceDate || row.maintenance_date || null,
            maintenanceStatus: row.maintenanceStatus || row.maintenance_status || null,
            orderType: row.orderType || row.order_type || row.orderStatus || row.order_status || 'INVENTORY',
            productType: row.productType || row.product_type || 'laptop',
            createdBy: row.createdBy || row.created_by || null,
          };

          // Validate required fields
          if (!productData.brand || !productData.model) {
            errors.push(`Row ${i + 1}: Missing required fields (brand, model)`);
            continue;
          }

          // Validate and convert data types
          const costPrice = parseFloat(productData.costPrice);

          if (isNaN(costPrice) || costPrice < 0) {
            errors.push(`Row ${i + 1}: Invalid cost price`);
            continue;
          }

          // Generate adsId for the product
          const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
          const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0'); // 4-digit random
          productData.adsId = `${timestamp}${random}`;

          // Update the product data with properly typed values
          productData.costPrice = costPrice.toFixed(2);

          // Validate condition
          if (!['new', 'refurbished', 'used'].includes(productData.condition)) {
            errors.push(`Row ${i + 1}: Invalid condition (must be 'new', 'refurbished', or 'used')`);
            continue;
          }

          if (!['new', 'refurbished', 'used'].includes(productData.condition)) {
            errors.push(`Row ${i + 1}: Invalid condition (must be 'new', 'refurbished', or 'used')`);
            continue;
          }

          // Validate prodHealth
          if (!['working', 'maintenance', 'expired'].includes(productData.prodHealth)) {
            errors.push(`Row ${i + 1}: Invalid prodHealth (must be 'working', 'maintenance', or 'expired')`);
            continue;
          }

          // Validate prodStatus
          const validProdStatuses = ['leased', 'sold', 'leased but not working', 'leased but maintenance', 'available', 'returned'];
          if (!validProdStatuses.includes(productData.prodStatus)) {
            errors.push(`Row ${i + 1}: Invalid prodStatus (must be one of: ${validProdStatuses.join(', ')})`);
            continue;
          }

          // Validate orderStatus
          if (!['RENT', 'PURCHASE', 'INVENTORY'].includes(productData.orderType)) {
            errors.push(`Row ${i + 1}: Invalid orderStatus (must be 'RENT', 'PURCHASE', or 'INVENTORY')`);
            continue;
          }

          // Validate productType
          if (!['laptop', 'desktop'].includes(productData.productType)) {
            errors.push(`Row ${i + 1}: Invalid productType (must be 'laptop' or 'desktop')`);
            continue;
          }

          validProducts.push(productData);
        } catch (error) {
          errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Invalid data'}`);
        }
      }

      if (validProducts.length === 0) {
        return res.status(400).json({
          message: "No valid products found",
          errors
        });
      }

      // Create products in database
      const result = await storage.createProducts(validProducts);

      let message = `Successfully processed ${result.products.length} products`;
      if (result.created > 0 && result.updated > 0) {
        message += ` (${result.created} created, ${result.updated} updated)`;
      } else if (result.created > 0) {
        message += ` (${result.created} created)`;
      } else if (result.updated > 0) {
        message += ` (${result.updated} updated)`;
      }

      res.status(201).json({
        message,
        products: result.products,
        summary: {
          total: result.products.length,
          created: result.created,
          updated: result.updated
        },
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({
        message: "Failed to process file upload",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Products routes
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.get("/api/products/adsId/:adsId", async (req, res) => {
    try {
      const adsId = req.params.adsId;
      const product = await storage.getProductByAdsId(adsId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      // Preprocess the data to ensure correct types
      const rawData = req.body;
      const processedData = {
        ...rawData,
        // Ensure costPrice is valid number
        costPrice: (() => {
          const costPrice = rawData.costPrice || rawData.cost;
          if (typeof costPrice === 'string') return parseFloat(costPrice) || 0;
          if (typeof costPrice === 'number') return costPrice;
          return 0;
        })(),
        createdBy: rawData.createdBy || null,
        prodId: rawData.prodId || null,
        prodHealth: rawData.prodHealth || null,
        prodStatus: rawData.prodStatus || 'available',
        lastAuditDate: rawData.lastAuditDate || null,
        auditStatus: rawData.auditStatus || null,
        maintenanceDate: rawData.maintenanceDate || null,
        maintenanceStatus: rawData.maintenanceStatus || null,
        orderType: rawData.orderType || rawData.orderStatus || 'INVENTORY',
      };

      console.log('Raw data:', rawData);
      console.log('Processed data:', processedData);

      const productData = insertProductSchema.parse(processedData);
      const product = await storage.createProduct(productData);


      // Automatically track product addition date
      await storage.createProductDateEvent({
        adsId: product.adsId,
        eventType: ENUMS.EVENT_TYPES.PRODUCT_ADDED,
        eventDate: new Date().toISOString(),
        notes: `Product ${product.brand} ${product.model} added to inventory`,
        createdAt: new Date().toISOString()
      });
      console.log("Product date event created successfully");

      res.status(201).json(product);
    } catch (error) {
      console.error('Validation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
      res.status(400).json({
        message: "POST Invalid product data",
        error: errorMessage,
        details: error instanceof Error && 'issues' in error ? error.issues : undefined
      });
    }
  });

  app.put("/api/products/:adsId", async (req, res) => {
    try {
      const adsId = req.params.adsId;

      // Extract lastModifiedBy before schema validation since it's not in the schema
      const lastModifiedBy = req.body.lastModifiedBy;

      // Preprocess the data to ensure correct types
      const rawData = req.body;
      const processedData = {
        ...rawData,
        costPrice: rawData.costPrice !== undefined ? (() => {
          const costPrice = rawData.costPrice;
          if (typeof costPrice === 'string') return parseFloat(costPrice) || 0;
          if (typeof costPrice === 'number') return costPrice;
          return undefined;
        })() : undefined,
        prodId: rawData.prodId || undefined,
        prodHealth: rawData.prodHealth || undefined,
        prodStatus: rawData.prodStatus || undefined,
        lastAuditDate: rawData.lastAuditDate || undefined,
        auditStatus: rawData.auditStatus || undefined,
        maintenanceDate: rawData.maintenanceDate || undefined,
        maintenanceStatus: rawData.maintenanceStatus || undefined,
        orderType: rawData.orderType || rawData.orderStatus || undefined,
      };

      console.log('PUT Raw data:', rawData);
      console.log('PUT Processed data:', processedData);
      console.log('PUT lastModifiedBy:', lastModifiedBy);

      const productData = updateProductSchema.partial().parse(processedData);
      // Add lastModifiedBy back to the product data for storage
      const productDataWithMeta = { ...productData, lastModifiedBy };
      
      console.log('PUT productDataWithMeta:', productDataWithMeta);
      const product = await storage.updateProductByAdsId(adsId, productDataWithMeta);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error('PUT Validation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
      res.status(400).json({
        message: "PUT Invalid product data",
        error: errorMessage,
        details: error instanceof Error && 'issues' in error ? error.issues : undefined
      });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteProduct(id);
      if (!deleted) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Get product audit trail
  app.get("/api/products/:adsId/history", async (req, res) => {
    try {
      const adsId = req.params.adsId;
      console.log('Fetching history for adsId:', adsId);
      
      const product = await storage.getProductByAdsId(adsId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      console.log('Raw audit trail from DB:', product.auditTrail);
      console.log('Audit trail type:', typeof product.auditTrail);

      // Parse audit trail JSON from database string
      let auditTrail = [];
      try {
        if (typeof product.auditTrail === 'string') {
          auditTrail = JSON.parse(product.auditTrail);
        } else if (Array.isArray(product.auditTrail)) {
          auditTrail = product.auditTrail;
        }
      } catch (parseError) {
        console.error('Error parsing audit trail JSON:', parseError);
        auditTrail = [];
      }

      console.log('Parsed audit trail:', auditTrail);
      console.log('Audit trail length:', auditTrail.length);

      const response = {
        adsId: product.adsId,
        brand: product.brand,
        model: product.model,
        auditTrail
      };

      console.log('Sending response:', response);
      res.json(response);
    } catch (error) {
      console.error('Error fetching product history:', error);
      res.status(500).json({ message: "Failed to fetch product history" });
    }
  });

  // Clients routes
  app.get("/api/clients", async (req, res) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const clientData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(clientData);
      res.status(201).json(client);
    } catch (error) {
      res.status(400).json({ message: "Invalid client data" });
    }
  });

  app.put("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const clientData = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(id, clientData);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(400).json({ message: "Invalid client data" });
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteClient(id);
      if (!deleted) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete client" });
    }
  });


  // Orders routes
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const orderData = baseInsertOrderSchema.parse(req.body);

      // Validate that all adsIds exist and are available
      for (const adsId of orderData.adsIds) {
        const product = await storage.getProductByAdsId(adsId);
        if (!product) {
          return res.status(400).json({
            message: `Product with adsId ${adsId} not found`
          });
        }
        if (product.orderStatus !== "INVENTORY") {
          return res.status(400).json({
            message: `Product ${adsId} is not available (current status: ${product.orderStatus})`
          });
        }
      }

      // Create the order
      const order = await storage.createOrder(orderData);

      // Update product statuses for all products in the order
      const newOrderStatus = orderData.orderType; // "RENT" or "PURCHASE"
      const newProdStatus = orderData.orderType === "RENT" ? "leased" : "sold";

      for (const adsId of orderData.adsIds) {
        // Update both orderStatus and prodStatus
        await storage.updateProductOrderStatus(adsId, newOrderStatus);
        await storage.updateProductProdStatus(adsId, newProdStatus);

        // Create product date event for each product
        await storage.createProductDateEvent({
          adsId: adsId,
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
      res.status(400).json({ message: "Invalid order data" });
    }
  });

  app.put("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const orderData = baseInsertOrderSchema.partial().parse(req.body);
      const order = await storage.updateOrder(id, orderData);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(400).json({ message: "Invalid order data" });
    }
  });

  app.delete("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteOrder(id);
      if (!deleted) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete order" });
    }
  });

  // Sales Buy routes
  app.get("/api/sales-buy", async (req, res) => {
    try {
      const salesBuy = await storage.getSalesBuy();
      res.json(salesBuy);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sales buy records" });
    }
  });

  app.post("/api/sales-buy", async (req, res) => {
    try {
      const salesBuyData = insertSalesBuySchema.parse(req.body);
      const salesBuy = await storage.createSalesBuy(salesBuyData);
      res.status(201).json(salesBuy);
    } catch (error) {
      res.status(400).json({ message: "Invalid sales buy data" });
    }
  });

  // Sales Rent routes
  app.get("/api/sales-rent", async (req, res) => {
    try {
      const salesRent = await storage.getSalesRent();
      res.json(salesRent);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sales rent records" });
    }
  });

  app.post("/api/sales-rent", async (req, res) => {
    try {
      const salesRentData = insertSalesRentSchema.parse(req.body);
      const salesRent = await storage.createSalesRent(salesRentData);
      res.status(201).json(salesRent);
    } catch (error) {
      res.status(400).json({ message: "Invalid sales rent data" });
    }
  });


  // Product Date Events routes
  app.get("/api/product-date-events", async (req, res) => {
    try {
      const events = await storage.getProductDateEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch date events" });
    }
  });

  app.get("/api/product-date-events/product/:adsId", async (req, res) => {
    try {
      const adsId = req.params.adsId;
      const events = await storage.getProductDateEventsByProduct(adsId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product date events" });
    }
  });

  app.post("/api/product-date-events", async (req, res) => {
    try {
      const eventData = insertProductDateEventSchema.parse(req.body);
      const event = await storage.createProductDateEvent(eventData);
      res.status(201).json(event);
    } catch (error) {
      res.status(400).json({ message: "Invalid date event data" });
    }
  });

  app.put("/api/product-date-events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const eventData = insertProductDateEventSchema.partial().parse(req.body);
      const event = await storage.updateProductDateEvent(id, eventData);
      if (!event) {
        return res.status(404).json({ message: "Date event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(400).json({ message: "Invalid date event data" });
    }
  });

  app.delete("/api/product-date-events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteProductDateEvent(id);
      if (!deleted) {
        return res.status(404).json({ message: "Date event not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete date event" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      // Get basic stats from products and other tables
      const products = await storage.getProducts();
      const clients = await storage.getClients();
      const orders = await storage.getOrders();
      const salesBuy = await storage.getSalesBuy();
      const salesRent = await storage.getSalesRent();

      // Calculate stats
      const totalInventory = products.length;
      const activeClients = clients.filter(c => c.isActive).length;
      const totalOrders = orders.length;

      // Calculate revenue from sales_buy and sales_rent
      const buyRevenue = salesBuy.reduce((sum, sale) => sum + parseFloat(sale.sellingPrice), 0);
      const rentRevenue = salesRent.reduce((sum, sale) => sum + parseFloat(sale.leaseAmount), 0);
      const monthlySales = buyRevenue + rentRevenue;

      // Calculate recovery items (products that need attention)
      const recoveryItems = products.filter(p =>
        p.prodStatus === 'leased but not working' ||
        p.prodStatus === 'maintenance' ||
        p.prodHealth === 'maintenance'
      ).length;

      // Mock growth rates since we don't have historical sales data
      const salesGrowth = 0; // Would need historical data
      const clientGrowth = 0; // Would need historical data

      const stats = {
        totalInventory,
        monthlySales,
        activeClients,
        recoveryItems,
        salesGrowth,
        clientGrowth,
        totalOrders,
        buyRevenue,
        rentRevenue
      };

      res.json(stats);
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Auth routes
  // Login
  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.json({ message: "Logged in", user: req.user });
  });

  // Logout
  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ error: "Logout failed" });
      res.json({ message: "Logged out" });
    });
  });

  // Get all users (for mapping employee IDs to usernames)
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      // Return only necessary fields for security
      const safeUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        employeeId: user.employeeId,
        role: user.role
      }));
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Check auth
  app.get("/api/me", (req, res) => {
    if (req.isAuthenticated()) {
      res.json({ user: req.user });
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  // Setup endpoint for production - simplified due to database reset strategy
  app.post("/api/setup", async (req, res) => {
    try {
      console.log("🚀 Production setup check...");

      // Check if we're in production
      if (process.env.NODE_ENV !== 'production') {
        return res.status(400).json({
          error: "Setup endpoint only available in production",
          message: "This endpoint is designed for production use only"
        });
      }

      // Test database connection
      console.log("📡 Testing database connection...");
      await pool.query('SELECT NOW()');
      console.log("✅ Database connection successful");

      // Check if users exist (database should already be set up by build process)
      const userCheck = await pool.query('SELECT COUNT(*) FROM users');
      const userCount = parseInt(userCheck.rows[0].count);

      if (userCount === 0) {
        return res.status(500).json({
          error: "No users found",
          message: "Database setup may have failed during build. Please check build logs."
        });
      }

      console.log(`📋 Found ${userCount} users in database`);

      // Get user credentials
      const activeUsers = await pool.query(`
        SELECT username, role, employee_id FROM users
        WHERE is_active = true
        ORDER BY username
      `);

      // Generate credentials for all active users
      const credentials: Record<string, string> = {};
      for (const user of activeUsers.rows) {
        credentials[user.username] = `${user.username}123`;
      }

      console.log("🎉 Production setup verified successfully!");

      res.json({
        success: true,
        message: "Production setup verified successfully!",
        users: activeUsers.rows,
        credentials: credentials,
        userTypes: {
          admin: 3,
          developer: 2,
          support: 2,
          salesperson: 6,
          salesmanager: 2,
          InventoryStaff: 2
        }
      });

    } catch (error) {
      console.error("❌ Production setup check failed:", error);
      res.status(500).json({
        error: "Production setup check failed",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Manual product status update endpoint
  app.put("/api/products/:adsId/status", async (req, res) => {
    try {
      const { adsId } = req.params;
      const { prodStatus } = req.body;

      if (!prodStatus) {
        return res.status(400).json({ message: "prodStatus is required" });
      }

      // Validate prodStatus is one of the allowed values
      const allowedStatuses = ["leased", "sold", "leased but not working", "leased but maintenance", "available", "returned"];
      if (!allowedStatuses.includes(prodStatus)) {
        return res.status(400).json({
          message: `Invalid prodStatus. Must be one of: ${allowedStatuses.join(", ")}`
        });
      }

      // Check if product exists
      const product = await storage.getProductByAdsId(adsId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Update product status
      const success = await storage.updateProductProdStatus(adsId, prodStatus);

      if (success) {
        // Create product date event for status change
        await storage.createProductDateEvent({
          adsId: adsId,
          eventType: 'status_updated',
          eventDate: new Date().toISOString(),
          notes: `Product status manually updated to: ${prodStatus}`,
          createdAt: new Date().toISOString()
        });

        res.json({ message: "Product status updated successfully" });
      } else {
        res.status(500).json({ message: "Failed to update product status" });
      }
    } catch (error) {
      console.error('Product status update error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Simple schema creation endpoint
  app.post("/api/init-db", async (req, res) => {
    try {
      console.log("🚀 Database initialization initiated...");

      // Check if we're in production
      if (process.env.NODE_ENV !== 'production') {
        return res.status(400).json({ 
          error: "Init endpoint only available in production",
          message: "This endpoint is designed for production use only"
        });
      }

      console.log("📡 Testing database connection...");
      await pool.query('SELECT NOW()');
      console.log("✅ Database connection successful");

      console.log("🔄 Creating database schema...");
      const { execSync } = await import('child_process');
      
      try {
        execSync('npm run db:push', { stdio: 'inherit' });
        console.log("✅ Database schema created successfully");
        
        res.json({
          success: true,
          message: "Database schema created successfully!",
          nextStep: "Call /api/setup to create users"
        });
      } catch (error) {
        console.error("❌ Failed to create database schema");
        res.status(500).json({ 
          error: "Failed to create database schema",
          message: "Please ensure your DATABASE_URL is correct and the database is accessible"
        });
      }

    } catch (error) {
      console.error("❌ Database initialization failed:", error);
      res.status(500).json({ 
        error: "Database initialization failed", 
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
