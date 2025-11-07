# Batch Expiration System Documentation

## Overview
The batch expiration system tracks product inventory in batches with expiration dates, implementing FIFO (First In First Out) stock management.

## Location of Files

### 1. **Backend Service** (`src/services/inventoryService.js`)
   - **Collection Name**: `product_batches`
   - **Key Functions**:
     - `createProductBatches(deliveryData)` - Creates batches when PO is delivered
     - `getProductBatches(branchId, productId, filters)` - Gets batches for a specific product
     - `getBranchBatches(branchId, filters)` - Gets all batches for a branch
     - `deductStockFIFO(deductionData)` - Deducts stock using FIFO (oldest batches first)
     - `updateBatchExpirationStatus(branchId)` - Auto-updates expired batch statuses
     - `getExpiringBatches(branchId, daysAhead)` - Gets batches expiring within X days
     - `getExpiredBatches(branchId)` - Gets all expired batches

### 2. **Inventory Controller Purchase Orders** (`src/pages/06_InventoryController/PurchaseOrders.jsx`)
   - **Lines 619-704**: `handleMarkAsDelivered()` - Creates batches when marking PO as delivered
   - **Lines 705-721**: `handleOpenDeliveryModal()` - Opens modal to input expiration dates
   - **Lines 1589-1743**: Delivery Modal UI - Where expiration dates are entered

### 3. **Expiry Tracker Page** (`src/pages/06_InventoryController/ExpiryTracker.jsx`)
   - **Lines 77-101**: `loadBatches()` - Loads batches for display
   - **Lines 103-111**: `updateExpirationStatus()` - Auto-updates expiration status
   - Displays all batches with expiration tracking, statistics, and filters

## Database Structure

### Firestore Collection: `product_batches`

Each document contains:

```javascript
{
  batchNumber: "PO-2024-001-BATCH-001",        // Auto-generated batch number
  productId: "product123",                      // Product ID
  productName: "Olaplex No.3 Hair Perfector",   // Product name
  branchId: "branch1",                          // Branch ID (auto-filtered)
  purchaseOrderId: "PO-2024-001",              // Source purchase order
  quantity: 50,                                 // Original quantity received
  remainingQuantity: 45,                        // Current remaining quantity (decremented on sales)
  unitCost: 1400,                               // Cost per unit
  expirationDate: Timestamp,                    // Expiration date (from delivery input)
  receivedDate: Timestamp,                      // When batch was received
  receivedBy: "userId123",                     // Who received the batch
  status: "active",                             // Status: "active", "expired", "depleted"
  createdAt: Timestamp,                         // Batch creation timestamp
  updatedAt: Timestamp                          // Last update timestamp
}
```

## How It Works

### 1. **Creating Batches (When PO is Delivered)**

**Location**: `src/pages/06_InventoryController/PurchaseOrders.jsx` → `handleMarkAsDelivered()`

**Flow**:
1. Inventory Controller marks an Approved PO as "Delivered"
2. Modal opens asking for expiration date for each product
3. User enters expiration dates
4. `inventoryService.createProductBatches()` is called
5. Creates one batch document per product item in the delivery
6. Batch is stored in Firestore `product_batches` collection
7. Stock is also updated in `branch_stocks` collection

**Code Example**:
```javascript
// In PurchaseOrders.jsx
const deliveryData = {
  purchaseOrderId: selectedOrder.orderId,
  branchId: userData.branchId,
  items: itemsWithExpiration,  // Each item has: productId, quantity, unitPrice, expirationDate
  receivedBy: userData.uid,
  receivedAt: new Date()
};

const batchesResult = await inventoryService.createProductBatches(deliveryData);
```

**What Gets Stored**:
- One batch document per product in the PO
- Each batch tracks: quantity, remaining quantity, expiration date, unit cost
- Batch number format: `PO-{orderId}-BATCH-{sequence}`

### 2. **FIFO Stock Deduction**

**Location**: `src/services/inventoryService.js` → `deductStockFIFO()`

**How It Works**:
- When stock is deducted (e.g., from sales), the system:
  1. Gets all active batches for the product
  2. Sorts by expiration date (oldest first)
  3. Deducts from oldest batches first
  4. Updates `remainingQuantity` in each batch
  5. Marks batch as `depleted` when `remainingQuantity` reaches 0

**Code Example**:
```javascript
await inventoryService.deductStockFIFO({
  branchId: userData.branchId,
  productId: productId,
  quantity: 5,  // Deduct 5 units
  reason: "Sale",
  notes: "Transaction #123",
  createdBy: userData.uid
});
```

### 3. **Expiration Status Updates**

**Location**: `src/services/inventoryService.js` → `updateBatchExpirationStatus()`

**How It Works**:
- Automatically updates batch status based on expiration date:
  - `active` → `expired` when expiration date passes
- Called when batches are loaded in Expiry Tracker

### 4. **Viewing Batches (Expiry Tracker)**

**Location**: `src/pages/06_InventoryController/ExpiryTracker.jsx`

**Features**:
- Shows all batches for the Inventory Controller's branch
- Displays expiration status: Good, Expiring Soon, Critical, Expired
- Statistics: Total batches, at-risk value, expiring count
- Filters by status, days ahead, search
- Batch details modal

## Key Semantics

### Batch Status Values:
- **`active`**: Batch has remaining stock and hasn't expired
- **`expired`**: Expiration date has passed (but may still have stock)
- **`depleted`**: All stock has been used (remainingQuantity = 0)

### Expiration Date Tracking:
- **Required**: When marking PO as delivered, expiration date must be entered for each product
- **Optional**: Products without expiration dates can have `null` expiration date
- **FIFO Sorting**: Batches are sorted by expiration date (oldest first) for stock deduction

### Stock Management:
- **Original Quantity**: `quantity` - never changes (original amount received)
- **Remaining Quantity**: `remainingQuantity` - decreases as stock is used
- **Deduction**: Always from oldest batches first (FIFO)
- **Depletion**: Batch marked as `depleted` when `remainingQuantity` reaches 0

## Database Collections Used

1. **`product_batches`** - Main collection storing batch data
2. **`branch_stocks`** - Updated when batches are created (total stock)
3. **`inventory_movements`** - Records movement when batches are created/deducted

## Firestore Security Rules

**Location**: `firebase.rules`

```javascript
match /product_batches/{batchId} {
  // Allow system admin to read/write all batches
  allow read, write: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'systemAdmin';
  
  // Allow branch admin and inventory controller to read/write batches in their branch
  allow read, write: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['branchAdmin', 'inventoryController'] &&
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.branchId == resource.data.branchId;
  
  // Allow branch manager to read/write batches in their branch
  allow read, write: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'branchManager' &&
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.branchId == resource.data.branchId;
  
  // Allow create with branchId validation
  allow create: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['branchAdmin', 'branchManager', 'inventoryController'] &&
    request.resource.data.branchId == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.branchId;
}
```

## Summary

✅ **Batches ARE stored in the database** - Firestore collection `product_batches`
✅ **Expiration dates ARE stored** - As `Timestamp` in each batch document
✅ **FIFO is implemented** - Oldest batches are used first
✅ **Status tracking** - Automatic expiration status updates
✅ **Full CRUD operations** - Create, Read, Update, Delete batches

The system is fully functional and all data is persisted in Firestore.



