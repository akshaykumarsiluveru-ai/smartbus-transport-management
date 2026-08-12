# SmartBus – Bus Tracking & Transport Management System

## Project Overview

**SmartBus** is a modern, responsive, and real-time campus bus tracking and fleet transport management platform built with React.js, Vite, and Tailwind CSS. Designed specifically for university and institutional transit networks, SmartBus integrates interactive geospatial mapping (Leaflet & OpenStreetMap), physics-driven geodesic ETA calculations, role-based access control, operational dispatch workflows, and student grievance management into a unified Single-Page Application (SPA).

---

## Features

### Student Module
- **Login & Registration**: Secure account creation with real-time password strength analyzer and SHA-256 password hashing.
- **Live Bus Tracking**: Real-time interactive Leaflet map displaying active buses, live movement, speedometers, occupancy levels, and route paths.
- **View Bus Routes & Corridors**: Complete timeline of stops, scheduled arrival times, and progress indicators.
- **Bus Timings & Status**: Live operational schedule board categorized by transit states (`On Time`, `Delayed`, `In Transit`, `Completed`, `Cancelled`).
- **Transport Complaints Desk**: Submit grievance tickets across 5 categories (`Bus Delay`, `Driver Behaviour`, `Bus Condition`, `Route Issue`, `Other`) with live resolution tracking.
- **Digital Bus Pass**: Integrated student RFID transit pass with barcode scanner simulator.
- **Emergency SOS**: Real-time safety broadcast trigger.

### Driver Module
- **Assigned Bus & Route**: Automatically resolves assigned vehicle asset and transit corridor.
- **Start / End Trip Controllers**: Dedicated operational lifecycle controls to broadcast live GPS telemetry.
- **GPS Simulation Engine**: Physics-based coordinate movement along actual stop checkpoints with realistic acceleration and deceleration near stops.
- **Current & Next Stop Detection**: Real-time stop progression tracking and checkpoint arrival alerts.
- **Dynamic Physics ETA**: Mathematical travel time and clock arrival calculations using the Haversine great-circle distance formula.
- **Passenger Headcount Management**: Real-time boarding counter and capacity gauge.
- **Report Delays**: Log traffic congestion or breakdowns with automated arrival time recalculations.

### Admin Module
- **Fleet Operations Dashboard**: High-level telemetry summary (active buses, driver readiness, active routes, fleet capacity).
- **Bus Management (CRUD)**: Manage fleet inventory, seat capacity, fuel types, models, and registration details.
- **Driver Management (CRUD)**: Staff roster management, license verification, shift assignments, and availability states.
- **Route & Stop Management**: Configure transit corridors, add/edit/reorder sequential stops with GPS coordinates.
- **Three-Way Operational Dispatch (Assignments)**: Bind `Bus` $\leftrightarrow$ `Driver` $\leftrightarrow$ `Route` with strict validation rules.
- **Live Transport Monitoring**: High-density Leaflet map and a 10-column live telematics table with GPS radar pulse indicators.
- **Trip Monitoring Ledger**: Full dispatch history recording departure times, completion timestamps, and driver logs.
- **Complaints Resolution Desk**: Review student tickets, update investigation status, and provide official resolution remarks.
- **Maintenance Bay**: Workshop repair bay management and vehicle status toggles.
- **Database Schema Explorer**: Interactive table inspector for the 5 core SQL-style data models.

---

## Technology Stack

- **Frontend Core**: React.js (v18)
- **Build Tool & Bundler**: Vite (v5)
- **Styling & Design System**: Tailwind CSS (v3), Autoprefixer, PostCSS
- **State Management**: React Context API (`AppContext`, `AuthContext`)
- **Mapping & Geolocation**: Leaflet (v1.9), OpenStreetMap
- **Icons**: Lucide React
- **Language**: JavaScript (ES6+ / JSX)

---

## Project Architecture

```
Bus Tracking System/
├── public/                     # Static assets
├── src/
│   ├── components/             # Reusable UI components
│   │   ├── AccessDenied.jsx    # Unauthorized route boundary guard
│   │   ├── InteractiveMap.jsx  # Leaflet map container & custom bus markers
│   │   ├── Modal.jsx           # Accessible dialog modal
│   │   ├── Navbar.jsx          # Header navigation & universal logout
│   │   ├── PasswordStrengthIndicator.jsx # Password entropy analyzer
│   │   ├── RoleBadge.jsx       # Visual role identifier pill
│   │   ├── StatCard.jsx        # Dashboard metric tile
│   │   └── StatusBadge.jsx     # Color-coded transit status badges
│   ├── context/                # Global state & business logic
│   │   ├── AppContext.jsx      # Central Single Source of Truth (Buses, Drivers, Routes, Tracking, Trips, Complaints)
│   │   └── AuthContext.jsx     # Authentication state, session storage, and RBAC
│   ├── services/               # Utilities & mock data
│   │   ├── authStorage.js      # LocalStorage & WebCrypto SHA-256 helpers
│   │   ├── geoEtaService.js    # Haversine geodesic distance & ETA calculations
│   │   └── mockData.js         # Initial mock datasets for campus transit
│   ├── views/                  # Role-specific application views
│   │   ├── admin/
│   │   │   └── AdminView.jsx   # Admin Control Center & Live Transport Monitoring
│   │   ├── auth/
│   │   │   ├── LoginModal.jsx  # Login screen with 1-click demo switcher
│   │   │   └── RegisterModal.jsx # Student registration portal
│   │   ├── driver/
│   │   │   └── DriverView.jsx  # Driver Operations Console & Telemetry HUD
│   │   └── student/
│   │       └── StudentView.jsx # Student Live Tracking & Grievance Desk
│   ├── App.jsx                 # Strict Role-Based Router
│   ├── index.css               # Global Tailwind directives & radar animations
│   └── main.jsx                # React root bootstrap
├── index.html                  # HTML5 entry point for Vite
├── package.json                # Project dependencies and npm scripts
├── postcss.config.js           # PostCSS configuration
├── tailwind.config.js          # Tailwind CSS theme configuration
├── vercel.json                 # SPA routing rewrites for Vercel deployment
├── vite.config.js              # Vite server & build configuration
└── README.md                   # Project documentation
```

---

## How to Run

### Prerequisites
- [Node.js](https://nodejs.org/) (Version 18.0.0 or higher)
- `npm` (bundled with Node.js)

### Installation & Development
1. **Clone or download the repository**:
   ```bash
   git clone <repository-url>
   cd "Bus Tracking System"
   ```
2. **Install project dependencies**:
   ```bash
   npm install
   ```
3. **Start the local development server**:
   ```bash
   npm run dev
   ```
4. **Open your browser** and navigate to:
   ```
   http://localhost:3000
   ```

---

## Production Build

To compile and validate the optimized production build:

1. **Build for production**:
   ```bash
   npm run build
   ```
   *(Generates optimized static HTML, CSS, and JS bundles in the `dist/` directory)*

2. **Preview production build locally**:
   ```bash
   npm run preview
   ```

---

## Project Workflow

```
+-----------------------------------------------------------------------------+
|                                 1. ADMIN                                    |
|   Creates Bus (BUS-101) + Driver (Ramesh Sharma) + Route (Express Corridor) |
|   Binds Operational Triad (Bus <-> Driver <-> Route) in Dispatch Console    |
+--------------------------------------|--------------------------------------+
                                       |
                                       v
+-----------------------------------------------------------------------------+
|                                 2. DRIVER                                   |
|   Logs in -> Sees assigned BUS-101 -> Clicks "START TRIP"                   |
|   Simulation starts -> GPS telematics broadcast along route stops           |
+--------------------------------------|--------------------------------------+
                                       |
                                       v
+-----------------------------------------------------------------------------+
|                        3. UNIFIED TRACKING STATE                            |
|   Calculates Haversine Geodesic Distance to upcoming stop                   |
|   Computes Physics Velocity & Arrival Clock Time dynamically every 2s       |
+-------------------|--------------------------------------|------------------+
                    |                                      |
                    v                                      v
+------------------------------------+   +------------------------------------+
|            4. STUDENT              |   |          5. ADMIN LIVE             |
|   Logs in -> Selects BUS-101       |   |   Opens Live Fleet Monitoring      |
|   Sees live marker moving on map   |   |   Sees 10-column telemetry table   |
|   Observes identical stops & ETA   |   |   Monitors speed, stops & ETA      |
+------------------------------------+   +------------------------------------+
```

---

## Limitations

- **Simulated GPS**: Coordinates are generated via mathematical geodesic interpolation along route checkpoints rather than physical cellular IoT or OBD-II hardware.
- **Client-Side State**: State is managed in-browser via React Context, `localStorage`, and `BroadcastChannel` (multi-tab sync) rather than a persistent cloud backend.
- **Simulated Chimes**: Sound alerts use the browser's native Web Audio API oscillators.

---

## Future Scope

- **Cloud Backend Integration**: Connect Firebase Authentication, Cloud Firestore real-time listeners (`onSnapshot`), and Cloud Storage for driver documents.
- **Physical GPS Tracking**: Integrate hardware GPS devices (GSM/GPRS/GPS modules) via WebSockets / MQTT ingestion.
- **Push Notifications**: Automated arrival alerts, delay warnings, and schedule changes via Firebase Cloud Messaging (FCM).
- **Geofencing & Safety Alerts**: Automated arrival triggers when buses enter a 200m radius around a designated campus stop.
- **Parent & Guardian Portal**: Dedicated tracking portal for parents to monitor daily boarding and drop-off timestamps.
