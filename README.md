# MEDISYNC - Smart Pharmacy Network Platform

A full-stack application connecting patients with nearby pharmacies for seamless prescription fulfillment and real-time inventory management.

## 🎯 Features

### Pharmacist Features
- **Stock Management Dashboard**: Real-time inventory control with expiry date tracking and alerts
- **Stock Alerts**: Automatic notifications for low stock and near-expiry medicines
- **Database-Driven Configuration**: All stock thresholds and parameters configured per medicine (zero hardcoding)
- **Live Stock Updates**: Real-time notifications via Socket.io when stock changes
- **Medicine Availability**: Public medicine previews showing only name, brand, and availability to patients

### Patient Features
- **Pharmacy Search**: Find pharmacies by name, city, or geolocation with distance calculation
- **Geolocation-Based Discovery**: Filter pharmacies within a specified radius from your location
- **Pagination**: Browse large result sets with limit/skip pagination
- **Prescription Upload**: Upload and track prescriptions for processing
- **Order Tracking**: Track orders through pickup/delivery lifecycle with real-time updates
- **Payment Processing**: Stripe integration for secure payments
- **Real-time Notifications**: Live toast notifications for prescription and order updates

### System Features
- **Real-time Communication**: Socket.io for live updates across all connected clients
- **Role-Based Access Control**: Separate flows for patients, pharmacists, and admins
- **Public API**: Pharmacies expose limited medicine info to patients (name, brand, availability only)
- **Database-Centric**: All configuration and data fetched from MongoDB (zero hardcoded values)
- **Type Safety**: Form input coercion and validation at both client and server
- **Toast Notifications**: In-app notification system with auto-dismiss and manual close

## 🛠️ Tech Stack

### Backend
- **Node.js + Express**: REST API server with middleware pipeline
- **MongoDB + Mongoose**: Document database with schema validation
- **Socket.io**: Real-time bidirectional communication with room-based broadcasting
- **JWT**: Secure token-based authentication
- **Stripe API**: Payment processing with webhook integration

### Frontend
- **React 18 + Vite**: Modern React with optimized Vite build tool
- **React Router 6**: Client-side routing with protected routes
- **Tailwind CSS**: Utility-first styling framework
- **Lucide React**: Comprehensive icon library
- **Socket.io Client**: Real-time event subscription
- **Context API**: State management for auth and notifications

## 📋 Quick Start

### Prerequisites
- Node.js 16+ and npm/yarn
- MongoDB 4.4+ (local or Atlas connection string)
- Stripe account for payment testing (optional)

### Setup

1. **Install Dependencies**
   ```bash
   # Backend
   cd backend
   npm install

   # Frontend
   cd frontend
   npm install
   ```

2. **Configure Environment Variables**

   Create `backend/.env`:
   ```
   NODE_ENV=development
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/medisync
   JWT_SECRET=your-secret-key-here
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=http://localhost:5173
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

   Create `frontend/.env`:
   ```
   VITE_API_BASE_URL=http://localhost:5000
   VITE_STRIPE_PUBLIC_KEY=pk_test_...
   ```

3. **Seed Demo Data**
   ```bash
   cd backend
   npm run seed
   ```

   This creates:
   - 1 admin user
   - 5 pharmacists with full pharmacy setups
   - 5 patients
   - 5 pharmacies with 8 medicines each
   - Various prescriptions and orders at different stages

4. **Start Services**

   Terminal 1 - Backend (API):
   ```bash
   cd backend
   npm run dev
   ```

   Terminal 2 - Frontend (UI):
   ```bash
   cd frontend
   npm run dev
   ```

   - Backend API: `http://localhost:5000`
   - Frontend UI: `http://localhost:5173`
   - Both services support hot-reload in development

## 👥 Demo Credentials

After running `npm run seed`, use these credentials:

### Pharmacists (all with password: `password123`)
- `pharmacist@medisync.test` - Main Street Pharmacy
- `pharmacist2@medisync.test` - Downtown Pharmacy
- `pharmacist3@medisync.test` - Riverside Pharmacy
- `pharmacist4@medisync.test` - Westside Clinic Pharmacy
- `pharmacist5@medisync.test` - Uptown Health Pharmacy

### Patients (all with password: `password123`)
- `patient@medisync.test` - Primary test patient
- `patient1@medisync.test` through `patient4@medisync.test` - Additional test patients

### Admin
- `admin@medisync.test` - Administrator account (password: `password123`)

## 📖 Workflows

### Pharmacist Stock Management

1. **Login** with pharmacist credentials
2. **Go to "Stock Control"** in the navigation
3. **View Dashboard**:
   - Total medicines in catalog
   - Total units in stock
   - Low stock item count
   - Near-expiry item count
   - Live alert feed
4. **Add New Medicine**:
   - Enter name (e.g., "Amoxicillin")
   - Enter brand (e.g., "Generic")
   - Set price
   - Set stock count
   - Set expiry date
   - Configure low stock threshold (default 10)
   - Configure near-expiry alert days (default 30)
   - Mark as available
5. **Edit Existing Medicine**: Click medicine in list to edit
6. **Live Alerts**:
   - Automatic alert when stock falls below threshold
   - Automatic alert when expiry date approaches
   - Toast notification appears in top-right corner

### Patient Pharmacy Discovery

1. **Login** with patient credentials
2. **Go to "Find Pharmacy"**
3. **Search Options**:
   - By pharmacy name: "Downtown", "Main St", etc.
   - By city: "Metro City", "Riverside", etc.
   - **Use Geolocation**: Click "Use my location" button
     - Browser requests permission
     - System calculates distances to all pharmacies
     - Results sorted by nearest first
     - Set search radius (1-50 km)
4. **View Results**:
   - Pharmacy cards show name, location, description
   - Distance displayed if geolocation used
   - First 3 medicines shown with availability
   - Pagination controls for large result sets
5. **View Full Details**:
   - Click "View details" on any pharmacy
   - See hours, delivery info
   - See all medicines (name, brand, availability)
   - See ratings and reviews
   - Upload prescription

### Prescription to Order Flow

1. **Patient selects pharmacy** and goes to detail page
2. **Upload prescription** as image/PDF
3. **Pharmacist receives** real-time notification
4. **Pharmacist reviews** and accepts or rejects
5. **Create order** from accepted prescription
6. **Choose fulfillment**:
   - Pickup: Come to pharmacy
   - Delivery: Pharmacy delivers to address
7. **Payment**:
   - View order total
   - Process payment via Stripe
8. **Track order**:
   - See status updates in real-time
   - Receive notifications on status change

## 📁 Project Structure

```
MEDISYNC/
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   ├── User.js              # Auth + roles
│   │   │   ├── Pharmacy.js          # Pharmacy + medicines subdoc
│   │   │   ├── Prescription.js      # Prescription + items
│   │   │   ├── Order.js             # Order management
│   │   │   ├── Review.js            # Pharmacy ratings
│   │   │   └── Message.js           # Patient-pharmacist chat
│   │   ├── routes/
│   │   │   ├── auth.routes.js       # /api/auth
│   │   │   ├── pharmacy.routes.js   # /api/pharmacies
│   │   │   ├── stock.routes.js      # /api/pharmacies/me/stock
│   │   │   ├── prescription.routes.js
│   │   │   ├── order.routes.js
│   │   │   └── message.routes.js
│   │   ├── middleware/
│   │   │   ├── auth.js              # JWT verify + socket auth
│   │   │   └── role.js              # Role-based access
│   │   ├── utils/
│   │   │   ├── stock.js             # Stock state, alerts, projections
│   │   │   └── geolocation.js       # Distance calculation
│   │   └── app.js                   # Express setup + routes
│   ├── scripts/
│   │   └── seed.js                  # 5 pharmacies + sample data
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── patient/
│   │   │   │   ├── PatientHome.jsx          # Action cards
│   │   │   │   ├── PharmacySearch.jsx       # Search + geolocation + pagination
│   │   │   │   ├── PharmacyDetail.jsx       # Detail + limited medicine preview
│   │   │   │   ├── PrescriptionUpload.jsx   # Prescription form
│   │   │   │   └── OrderTracking.jsx        # Order status
│   │   │   └── pharmacist/
│   │   │       ├── PharmacistHome.jsx       # Dashboard cards
│   │   │       ├── Stock.jsx                # Stock management UI
│   │   │       ├── PrescriptionQueue.jsx    # Review + accept/reject
│   │   │       └── OrderManagement.jsx      # Fulfillment status
│   │   ├── components/
│   │   │   ├── Toast.jsx                    # Single toast notification
│   │   │   ├── ToastContainer.jsx           # Toast list + positioning
│   │   │   ├── PharmacyCard.jsx             # Search result card
│   │   │   ├── Layout.jsx                   # Header + nav + socket hook
│   │   │   └── ProtectedRoute.jsx           # Role-based routing
│   │   ├── context/
│   │   │   ├── AuthContext.jsx              # User + socket + login
│   │   │   └── NotificationContext.jsx      # Toast state
│   │   ├── hooks/
│   │   │   └── useSocketNotifications.js    # Socket event listeners
│   │   ├── lib/
│   │   │   └── api.js                       # HTTP client
│   │   ├── App.jsx                          # Router + routes
│   │   └── main.jsx                         # React mount + providers
│   ├── .env.example
│   └── package.json
├── docker-compose.yml                       # Containerization
├── .gitignore
└── README.md                               # This file
```

## 🔌 API Endpoints

### Pharmacies
- `GET /api/pharmacies` - Search pharmacies
  - Query: `search` (name), `city`, `limit`, `skip`, `lat`, `lng`, `radius`
  - Returns: `{data: [...], pagination: {total, limit, skip, pages}}`
- `GET /api/pharmacies/:id` - Get pharmacy details
- `GET /api/pharmacies/:id/reviews` - Get reviews
- `POST /api/pharmacies/:id/reviews` - Post review (patient only)

### Stock Management (Pharmacist Only)
- `GET /api/pharmacies/me/stock` - Authenticated pharmacist's stock with alerts
  - Returns: Full pharmacy + medicines + stock summary + alerts
- `POST /api/pharmacies/me/stock` - Add/update medicine
  - Body: Full medicine object with stockCount, expiryDate, thresholds
  - Returns: Updated pharmacist view
  - Emits: `stock:updated`, `stock:alert` via Socket.io

### Authentication
- `POST /api/auth/register` - Register new user
  - Body: `{name, email, password, role}`
- `POST /api/auth/login` - Login and receive JWT token
  - Body: `{email, password}`
  - Returns: `{user, token}`
- `POST /api/auth/logout` - Logout and invalidate session

### Prescriptions
- `GET /api/prescriptions` - Get prescriptions (filtered by role)
- `POST /api/prescriptions` - Create new prescription
- `PATCH /api/prescriptions/:id` - Update status (accept/reject/complete)

### Orders
- `GET /api/orders` - Get user's orders
- `POST /api/orders` - Create new order
- `PATCH /api/orders/:id` - Update status (processing/ready/in-transit/completed)

## 🔄 Real-Time Events (Socket.io)

### Room Structure
- Patient listens to: `patient:{userId}`, `pharmacy:{pharmacyId}`
- Pharmacist listens to: `pharmacy:{pharmacyId}`
- Events broadcast to specific rooms

### Stock Events
- `stock:updated` - Emitted when pharmacist updates medicine
  - Data: `{pharmacyId, medicine, stockSummary}`
- `stock:alert` - Emitted for low stock or near-expiry
  - Data: `{pharmacyId, message}`

### Prescription Events
- `prescription:created` - New prescription uploaded
- `prescription:updated` - Status changed (accepted/rejected)
- `prescription:completed` - Fulfilled

### Order Events
- `order:updated` - Status changed
- `order:created` - New order created
- `order:completed` - Pickup/delivery finished

### Message Events
- `message:created` - New chat message

## 🧪 Testing the System

### Single-Browser Test

1. Open `http://localhost:5173` in your browser
2. Login as pharmacist (`pharmacist@medisync.test`)
3. Go to Stock Control
4. Add/update a medicine
5. Watch toast notification appear in top-right
6. Logout and login as patient
7. Search pharmacies
8. Use geolocation button to find by location
9. View pharmacy details and see medicine preview

### Multi-Browser Test (Recommended)

1. **Browser 1**: Login as `patient@medisync.test`
   - Search pharmacies
   - Navigate to a pharmacy detail
   - Watch for real-time updates

2. **Browser 2**: Login as `pharmacist@medisync.test`
   - Go to Stock Control
   - Update medicine stock
   - Watch Browser 1 receive notification

3. **Observe**:
   - Toast appears immediately in both browsers
   - Stock updates reflect across all clients
   - No page refresh needed

### Prescription Flow Test

1. Patient logs in and uploads prescription
2. Pharmacist receives real-time notification
3. Pharmacist reviews and accepts
4. Patient creates order from accepted
5. Both track order status in real-time

## 🚀 Deployment

### Production Build

1. **Build Frontend**:
   ```bash
   cd frontend
   npm run build
   # Output: frontend/dist/
   ```

2. **Environment Setup**:
   - Update backend `.env` with production MongoDB, Stripe keys
   - Update frontend env vars with production API endpoint
   - Set `NODE_ENV=production`

3. **Process Manager (PM2)**:
   ```bash
   npm install -g pm2
   
   cd backend
   pm2 start "npm run start" --name medisync-api
   
   cd frontend
   pm2 start "npm run preview" --name medisync-web
   
   pm2 save
   pm2 startup
   ```

4. **Docker Deployment**:
   ```bash
   docker compose -f docker-compose.yml up -d
   ```

5. **Nginx Reverse Proxy** (optional):
   ```nginx
   upstream api {
       server localhost:5000;
   }
   
   upstream app {
       server localhost:5173;
   }
   
   server {
       listen 80;
       server_name yourdomain.com;
       
       location /api/ {
           proxy_pass http://api;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
       }
       
       location / {
           proxy_pass http://app;
       }
   }
   ```

## 📊 Data Schema Highlights

### Pharmacy Document
```javascript
{
  name: String,
  slug: String (unique),
  address: String,
  city: String,
  coordinates: { lat: Number, lng: Number },
  pharmacist: ObjectId (ref User),
  medicines: [{
    name: String,
    brand: String,
    price: Number,
    stockCount: Number (default 0),
    expiryDate: Date,
    lowStockThreshold: Number (default 10),
    nearExpiryThresholdDays: Number (default 30),
    available: Boolean,
    lastStockedAt: Date
  }],
  deliveryEnabled: Boolean,
  openingHours: String
}
```

### Order Document
```javascript
{
  prescription: ObjectId (ref Prescription),
  pharmacy: ObjectId (ref Pharmacy),
  patient: ObjectId (ref User),
  items: [{name, quantity, price, brand}],
  subtotal: Number,
  total: Number,
  fulfillmentMode: 'pickup' | 'delivery',
  status: 'awaiting-payment' | 'processing' | 'ready' | 'in-transit' | 'completed',
  paymentId: String (Stripe),
  createdAt: Date,
  updatedAt: Date
}
```

## 🔑 Key Implementation Details

### Stock Computation
- `computeMedicineStockState()`: Calculates daysToExpiry, status (expired/near-expiry/low-stock/in-stock)
- `summarizeStock()`: Counts total medicines, units, low-stock, near-expiry items
- All thresholds are per-medicine, configured in database

### Public vs Pharmacist Views
- **publicMedicinePreview**: Returns `{name, brand, available}` only
- **pharmacistStockView**: Returns full details including expiry, stock counts, thresholds

### Type Coercion
- Frontend sends form values as strings
- Backend `parseNumber()` and `parseBoolean()` helpers convert to proper types
- Validation runs after coercion

### Geolocation
- Client calls `navigator.geolocation.getCurrentPosition()`
- Latitude/longitude sent in API query
- Backend uses Haversine formula to calculate distances
- Results sorted by distance, filtered by radius

## 🔒 Security Considerations

- JWT tokens stored in memory (cleared on logout)
- All endpoints protected by role-based middleware
- Pharmacist can only view/edit their own pharmacy
- Patient medicine data limited to name/brand/availability
- Stripe keys never exposed to frontend
- CORS configured for API access
- Socket.io authenticated via JWT

## 🤝 Contributing

This is a learning/demo platform. Extend with:
- Multiple payment providers (PayPal, Apple Pay)
- SMS/Email notifications
- Medicine recommendation engine
- Insurance integration
- Prescription image OCR
- Admin dashboard for platform management

## 📝 Notes

- **All configuration is database-driven**: No hardcoded thresholds, prices, or settings
- **Type safety**: Form inputs coerced to proper types before database storage
- **Real-time first**: Socket.io used for all live updates
- **Public API privacy**: Patient-facing APIs never expose sensitive medicine data
- **Scalable**: Pagination, indexing ready for large datasets

---

**Built with ❤️ for healthcare innovation.**

