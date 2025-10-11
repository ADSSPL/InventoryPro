# InventoryPro - Database Reset Strategy

**IMPORTANT:** This application uses a **database reset strategy** for development and deployment:

## 🚀 Database Reset Strategy

### Why Database Resets?
- **Rapid Development:** Schema changes happen frequently during development
- **Clean State:** Every `npm run dev`, `npm run build`, and `npm install` starts with a fresh database
- **No Migrations:** No need for backward compatibility or migration scripts
- **Simple Schema Updates:** Just update the schema file and restart
- **Automatic User Creation:** 17 users with employee IDs created automatically

### How It Works
1. **Database Reset:** `scripts/resetDatabase.ts` drops and recreates the entire database
2. **Schema Creation:** Drizzle ORM pushes current schema to database
3. **User Creation:** 17 users with auto-generated employee IDs (ADS0001-ADS0017)
4. **Clean State:** Ready for development or deployment

### When Database Resets Occur
- ✅ `npm run dev` - Development server start
- ✅ `npm run build` - Production build
- ✅ `npm install` - Package installation
- ✅ Manual: `npm run db:reset`

## 📋 Available Scripts

### Core Scripts
```bash
npm run dev          # Start dev server (with DB reset)
npm run dev:no-reset # Start dev server (without DB reset)
npm run build        # Build for production (with DB reset)
npm run start        # Start production server
npm run check        # TypeScript type checking
```

### Database Scripts
```bash
npm run db:reset     # Reset database and create 17 users
npm run db:push      # Push schema changes to database
```

## 👥 User Management

### Auto-Created Users
The system automatically creates **17 users** with employee IDs:

| Role | Count | Employee IDs | Username Pattern |
|------|-------|--------------|------------------|
| Admin | 3 | ADS0001-ADS0003 | admin_01, admin_02, admin_03 |
| Developer | 2 | ADS0004-ADS0005 | dev_01, dev_02 |
| Support | 2 | ADS0006-ADS0007 | support_01, support_02 |
| Salesperson | 6 | ADS0008-ADS0013 | sales_01 to sales_06 |
| Sales Manager | 2 | ADS0014-ADS0015 | sales_mgr_01, sales_mgr_02 |
| Inventory Staff | 2 | ADS0016-ADS0017 | inv_staff_01, inv_staff_02 |

### Login Credentials
- **Username:** `[role]_[number]` (e.g., `admin_01`, `sales_01`)
- **Password:** `[username]123` (e.g., `admin_01123`, `sales_01123`)

## 🔧 Schema Update Process

When adding new columns/tables:

1. **Update Schema File:** Modify `shared/schema.ts`
2. **Restart Application:** Database will reset with new schema automatically
3. **No Manual Migrations:** Drizzle ORM handles schema synchronization

## 📁 Project Structure

```
scripts/
└── resetDatabase.ts          # ✅ Main database setup script

shared/
└── schema.ts                      # ✅ TypeScript type definitions & schema

drizzle.config.ts                  # ✅ Drizzle configuration for db:push
```

## 🎯 Benefits

- **Zero Configuration:** Works out of the box
- **Fast Development:** No migration complexity
- **Consistent State:** Same database state every time
- **Automatic Setup:** Users created automatically
- **Clean Architecture:** Single source of truth



This approach ensures **fast development cycles** without migration complexity while maintaining **consistent database state** across all environments.