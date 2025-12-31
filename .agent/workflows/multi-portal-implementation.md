---
description: Implementation plan for multi-role portal system with 4 user types
---

# 🍕 Fooddala Multi-Portal Implementation Plan

## Overview
Design and implement a scalable food delivery application with role-based access control and 4 distinct portals:
1. **User Portal** (Customer) - Browse, order, pay, track
2. **Restaurant Portal** - Manage menu, orders, earnings
3. **Delivery Partner Portal** - Accept deliveries, update status, earnings
4. **Admin Portal** - Full system management

---

## Current State Analysis

### ✅ Already Implemented
| Component | Status | Notes |
|-----------|--------|-------|
| User Model with Roles | ✅ Done | Roles: `customer`, `restaurant`, `driver`, `admin` |
| Driver Model | ✅ Done | Vehicle info, location tracking, earnings |
| Restaurant Model | ✅ Done | Owner, menu, orders, ratings |
| Order Model | ✅ Done | Full order lifecycle, status history |
| User Portal (Basic) | ✅ Done | Home, restaurants, checkout, orders |
| Admin Dashboard (Basic) | ✅ Done | Stats, recent orders |
| Authentication | ✅ Done | JWT + Google OAuth |

### ❌ Needs Implementation
| Component | Priority | Effort |
|-----------|----------|--------|
| Role Selection Login Page | High | Medium |
| Restaurant Portal (Full) | High | High |
| Delivery Partner Portal | High | High |
| Admin Portal (Full) | Medium | High |
| Real-time Order Updates | Medium | Medium |
| Role-based Route Protection | High | Low |

---

## Implementation Phases

### Phase 1: Login System with Role Selection (Priority: HIGH)

#### 1.1 Update Login Page
- Add role selection tabs: "Customer", "Restaurant", "Delivery Partner"
- Admin login via special route (`/admin/login`)
- After login, redirect based on role:
  - `customer` → `/`
  - `restaurant` → `/restaurant-portal`
  - `driver` → `/driver-portal`
  - `admin` → `/admin`

#### 1.2 Backend Auth Updates
- Update login endpoint to return role
- Create registration endpoints for restaurant owners and drivers
- Add role validation middleware

#### 1.3 Files to Create/Modify
```
web/src/app/login/page.js          # Update with role tabs
web/src/context/AuthContext.js     # Update redirect logic
backend/controllers/authController.js  # Role-based response
```

---

### Phase 2: Restaurant Portal (Priority: HIGH)

#### 2.1 Portal Structure
```
web/src/app/restaurant-portal/
├── page.js                 # Dashboard (orders, stats)
├── page.module.css
├── menu/
│   └── page.js             # Menu management (CRUD)
├── orders/
│   └── page.js             # Order management
├── earnings/
│   └── page.js             # Revenue & payouts
└── settings/
    └── page.js             # Restaurant profile
```

#### 2.2 Features
1. **Dashboard**
   - Today's orders count
   - Revenue (today/week/month)
   - Pending orders queue
   - Quick actions

2. **Menu Management**
   - Add/Edit/Delete menu items
   - Set availability (in stock/out of stock)
   - Category management
   - Price updates
   - Image upload

3. **Order Management**
   - Real-time order notifications
   - Accept/Reject orders
   - Update status (Preparing → Ready)
   - Assign to delivery partner
   - Order history

4. **Earnings**
   - Daily/Weekly/Monthly breakdown
   - Order-wise earnings
   - Commission deduction view
   - Payout history

#### 2.3 Backend APIs Needed
```
GET    /api/restaurant/dashboard     # Stats
GET    /api/restaurant/orders        # Orders list
PUT    /api/restaurant/orders/:id    # Update order status
POST   /api/menu-items               # Already exists
PUT    /api/menu-items/:id           # Already exists
DELETE /api/menu-items/:id           # Already exists
GET    /api/restaurant/earnings      # New
```

---

### Phase 3: Delivery Partner Portal (Priority: HIGH)

#### 3.1 Portal Structure
```
web/src/app/driver-portal/
├── page.js                 # Dashboard + Available Orders
├── page.module.css
├── active/
│   └── page.js             # Current active delivery
├── history/
│   └── page.js             # Completed deliveries
├── earnings/
│   └── page.js             # Earnings tracker
└── profile/
    └── page.js             # Driver profile & documents
```

#### 3.2 Features
1. **Dashboard**
   - Online/Offline toggle
   - Available delivery requests
   - Today's stats (deliveries, earnings)
   - Accept/Reject orders

2. **Active Delivery**
   - Pickup location map
   - Drop location map
   - Navigation integration
   - Status updates (Picked Up → On the Way → Delivered)
   - Customer contact

3. **Delivery History**
   - Past deliveries list
   - Ratings received
   - Issues/disputes

4. **Earnings**
   - Per-delivery earnings
   - Tips received
   - Weekly payouts
   - Bonus tracking

#### 3.3 Backend APIs Needed
```
GET    /api/driver/dashboard         # Stats + available orders
PUT    /api/driver/toggle-online     # Go online/offline
GET    /api/driver/available-orders  # Orders ready for pickup
POST   /api/driver/accept-order/:id  # Accept delivery
PUT    /api/driver/update-status/:id # Update delivery status
PUT    /api/driver/location          # Update live location
GET    /api/driver/earnings          # Earnings data
GET    /api/driver/history           # Completed deliveries
```

---

### Phase 4: Admin Portal (Priority: MEDIUM)

#### 4.1 Portal Structure
```
web/src/app/admin/
├── page.js                 # Dashboard overview
├── page.module.css
├── users/
│   └── page.js             # Manage customers
├── restaurants/
│   └── page.js             # Manage restaurants
├── drivers/
│   └── page.js             # Manage delivery partners
├── orders/
│   └── page.js             # All orders monitoring
├── analytics/
│   └── page.js             # Charts & reports
└── settings/
    └── page.js             # System configuration
```

#### 4.2 Features
1. **Dashboard**
   - Platform-wide stats
   - Revenue charts
   - Active users/restaurants/drivers
   - Recent activity feed

2. **User Management**
   - View all customers
   - Activate/Deactivate accounts
   - View order history

3. **Restaurant Management**
   - Approve/Reject restaurant applications
   - View restaurant details
   - Suspend restaurants
   - Commission management

4. **Driver Management**
   - Verify driver documents
   - Approve/Reject applications
   - Track active drivers
   - Payout management

5. **Order Monitoring**
   - View all orders (filterable)
   - Resolve disputes
   - Issue refunds
   - Cancel orders

6. **Analytics**
   - Revenue trends
   - Order volume
   - Popular restaurants
   - Delivery performance

---

### Phase 5: Real-time Updates (Priority: MEDIUM)

#### 5.1 Implementation Options
1. **Socket.IO** - Best for real-time bidirectional communication
2. **Server-Sent Events (SSE)** - Simpler, one-way updates
3. **Polling** - Fallback, less efficient

#### 5.2 Real-time Events
- New order notification (to restaurant)
- Order status change (to customer)
- Delivery request (to driver)
- Driver location update (to customer)

---

## Order Flow Diagram

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   CUSTOMER  │───▶│ RESTAURANT  │───▶│   DRIVER    │───▶│  DELIVERED  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
     │                   │                   │                  │
     ▼                   ▼                   ▼                  ▼
  Places Order      Accepts Order      Picks Up Order    Completes Delivery
  Status: PLACED    Status: CONFIRMED  Status: PICKED_UP Status: DELIVERED
                    Status: PREPARING  Status: ON_THE_WAY
                    Status: READY
```

---

## Database Schema Summary

### User Roles
```javascript
role: ['customer', 'restaurant', 'driver', 'admin']
```

### Order Status Flow
```javascript
status: ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'on_the_way', 'delivered', 'cancelled']
```

---

## File Structure After Implementation

```
web/src/app/
├── (customer)/                    # Customer routes (existing)
│   ├── page.js                    # Home
│   ├── restaurants/
│   ├── checkout/
│   ├── orders/
│   └── profile/
├── login/                         # Updated with role selection
├── register/                      # Customer registration
├── restaurant-portal/             # NEW: Restaurant dashboard
│   ├── page.js
│   ├── menu/
│   ├── orders/
│   └── earnings/
├── driver-portal/                 # NEW: Driver dashboard
│   ├── page.js
│   ├── active/
│   ├── history/
│   └── earnings/
└── admin/                         # Enhanced admin panel
    ├── page.js
    ├── users/
    ├── restaurants/
    ├── drivers/
    └── orders/
```

---

## Implementation Order

1. **Week 1**: Login system with role selection + route protection
2. **Week 2**: Restaurant Portal (Dashboard + Menu + Orders)
3. **Week 3**: Delivery Partner Portal (Dashboard + Active Delivery)
4. **Week 4**: Admin Portal enhancements
5. **Week 5**: Real-time updates + Polish

---

## Let's Start!

Ready to begin implementation? Start with:
1. Login page with role selection
2. Route protection middleware
3. Restaurant Portal dashboard

Say "proceed" to start building!
