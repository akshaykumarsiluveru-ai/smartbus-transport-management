# SmartBus – Intelligent Campus Bus Tracking & Transport Management System
## Final Project Submission Report & Technical Documentation
**Degree / Specialization**: Bachelor of Technology (B.Tech) in Computer Science & Engineering (Artificial Intelligence & Machine Learning)  
**Academic Year**: 2025–2026  
**Project Repository**: [https://github.com/akshaykumarsiluveru-ai/smartbus-transport-management](https://github.com/akshaykumarsiluveru-ai/smartbus-transport-management)  
**Production Web Deployment**: [https://smartbus-transport-management.vercel.app/](https://smartbus-transport-management.vercel.app/)  

---

## Table of Contents
1. [Project Overview & Problem Statement](#1-project-overview--problem-statement)
2. [Objectives & Project Scope](#2-objectives--project-scope)
3. [Technology Stack & Architectural Design](#3-technology-stack--architectural-design)
4. [Functional Modules](#4-functional-modules)
   - 4.1. [Student Transit Portal](#41-student-transit-portal)
   - 4.2. [Driver Operational Console](#42-driver-operational-console)
   - 4.3. [Fleet Administration & Dispatch Dashboard](#43-fleet-administration--dispatch-dashboard)
5. [Database Architecture & Entity Relationships](#5-database-architecture--entity-relationships)
6. [API Architecture, Security & Authentication](#6-api-architecture-security--authentication)
7. [Real-Time Bus Tracking Engine: Mathematical Model, Socket.IO & GPS Hardware Interfacing](#7-real-time-bus-tracking-engine)
8. [Setup, Installation & Cloud Deployment Guide](#8-setup-installation--cloud-deployment-guide)
9. [Verification, Quality Assurance & Test Results](#9-verification-quality-assurance--test-results)
10. [Limitations & Future AI/ML Enhancements](#10-limitations--future-aiml-enhancements)
11. [5–7 Minute Viva / Final Demonstration Script](#11-57-minute-viva--final-demonstration-script)
12. [Screenshot Checklist for College Documentation](#12-screenshot-checklist-for-college-documentation)
13. [Troubleshooting Guide & Known Issues Resolved](#13-troubleshooting-guide--known-issues-resolved)

---

## 1. Project Overview & Problem Statement

### 1.1 Context
Campus transportation systems in educational institutions operate fleets of buses across urban and suburban commuter corridors. Hundreds of students, faculty, and administrative staff rely daily on these transport services. However, conventional campus transit infrastructure suffers from operational opacity, leading to severe commuter friction and administrative overhead.

### 1.2 Problem Statement
1. **Unpredictable Arrival Times & Commuter Anxiety**: Commuters lack visibility into actual vehicle positions and estimated arrival times (ETAs). Incidents such as traffic congestion or weather delays leave students waiting at stops without situational awareness.
2. **Disconnected Operational Dispatch**: Administrative staff manage vehicles, drivers, and routes across manual logs or disjointed spreadsheets, resulting in scheduling conflicts, unassigned buses, or untracked driver shifts.
3. **Absence of Grievance Channels**: Students encounter issues such as route skipping, air-conditioning failure, or aggressive driving without a structured feedback or ticketing mechanism.
4. **Safety & Emergency Blindspots**: Drivers encounter vehicle breakdowns or medical emergencies without instantaneous SOS signaling directly connected to central operations.

### 1.3 The SmartBus Solution
**SmartBus** is a full-stack, real-time campus transit management platform built on modern web standards (React, Vite, Node.js, Express, Socket.IO, and TiDB Cloud / MySQL). It establishes an integrated communication triangle:
- **Students** gain interactive Leaflet map tracking, live stop timelines, dynamic ETAs, digital RFID pass simulation, and grievance tracking.
- **Drivers** receive dedicated operations consoles with stop advancement controls, passenger headcount meters, emergency SOS dispatch, and delay reporting.
- **Administrators** control the entire transit network: fleet asset management, driver roster dispatch, corridor stop sequence configuration, complaint resolution, and live vehicle telematics.

---

## 2. Objectives & Project Scope

### 2.1 Primary Objectives
- **End-to-End Real-Time Telemetry**: Broadcast high-frequency vehicle coordinate updates to commuters with low latency using WebSocket bidirectional streaming (`Socket.IO`).
- **Role-Based Operational Workflows**: Implement strict Role-Based Access Control (RBAC) across three distinct actors: Administrator, Driver, and Student, secured via JSON Web Tokens (JWT) and Bcrypt hashing.
- **Physics-Informed Geodesic Calculations**: Compute dynamic ETAs and travel distances using great-circle Haversine formulas and acceleration curves between consecutive transit stops.
- **Full Operational Lifecycle Management**: Provide complete CRUD and operational dispatch mechanisms for Buses, Drivers, Routes, Stops, Trips, Complaints, and System Notices.
- **High Availability & Fault Tolerance**: Ensure the backend operates seamlessly with cloud-hosted MySQL/TiDB databases while maintaining an active in-memory store fallback.

### 2.2 Project Scope & Boundaries
- **In Scope**:
  - Interactive geospatial mapping using Leaflet and OpenStreetMap tiles.
  - Multi-tier JWT authentication with session restoration and role-based route guards.
  - Bidirectional Socket.IO rooms partitioned by bus (`bus:<bus_id>`).
  - Dual-mode GPS tracking engine: client-side/server-side coordinate simulation engine for testing and REST API telemetry ingestion endpoint (`POST /api/tracking`) for physical GPS hardware.
  - Normalized relational database schema (9 tables) with foreign key constraints.
  - Student grievance desk with administrative response ledger.
- **Out of Scope (Current Release)**:
  - Integration with proprietary physical hardware trackers (simulated ingestion tested; hardware integration documented for future work).
  - Native iOS/Android app store deployment (Capacitor wrapper scaffolded, web responsive SPA primary).
  - Automated payment processing for transit fee collection.

---

## 3. Technology Stack & Architectural Design

### 3.1 Technology Stack Matrix

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React.js | `^18.2.0` | Declarative UI, Component Architecture, State Management |
| **Build Tooling** | Vite | `^5.1.4` | Hot Module Replacement, optimized Rollup bundling |
| **Styling & Design** | Tailwind CSS | `^3.4.1` | Utility-first responsive design system, animations |
| **Geospatial Mapping** | Leaflet / React-Leaflet | `^1.9.4` / `^4.2.1` | Interactive vector maps, marker layers, custom bus icons |
| **Icons & Typography** | Lucide React / Inter Font | `^0.344.0` | UI iconography, typography |
| **Backend Runtime** | Node.js (ES Modules) | `>=18.x` | Asynchronous I/O runtime |
| **Web Framework** | Express.js | `^4.19.2` | RESTful API server, routing, error handling middleware |
| **Real-Time Streaming** | Socket.IO / Socket.IO-Client | `^4.8.4` | WebSocket communication, bus room broadcasting |
| **Database** | TiDB Cloud / MySQL | `8.0+ compat.` | Distributed SQL database with SSL/TLS encryption |
| **Database Driver** | MySQL2 / Promise | `^3.9.7` | Connection pooling, prepared statements |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`) | `^9.0.2` | Stateless identity tokens, bearer auth header verification |
| **Password Hashing** | BcryptJS | `^2.4.3` | Cryptographic salt (10 rounds) password storage |
| **Frontend Hosting** | Vercel | Production | Edge CDN hosting with SPA rewrite rules (`vercel.json`) |
| **Backend Hosting** | Render | Production | Cloud container web service running Node.js runtime |

### 3.2 High-Level System Architecture Diagram

```mermaid
flowchart TD
    subgraph Clients["Client Layer (Browsers & Devices)"]
        StudentUI["Student Portal (React / Leaflet)"]
        DriverUI["Driver Console (React Operations)"]
        AdminUI["Admin Dispatch (React Telematics)"]
        IoTDevice["Physical GPS Tracker / ESP32 (Optional Hardware)"]
    end

    subgraph CDN["Edge & CDN Hosting"]
        VercelEdge["Vercel CDN (Static SPA Assets)"]
    end

    subgraph BackendLayer["Application Server (Node.js & Express on Render)"]
        ExpressApp["Express.js REST API Server"]
        SocketServer["Socket.IO WebSocket Server"]
        AuthMiddleware["JWT Authentication & RBAC Middleware"]
        FallbackStore["In-Memory Store (Resilience Fallback)"]
    end

    subgraph DataLayer["Persistence Layer"]
        TiDBCloud[("TiDB Cloud / MySQL Database (SSL TLS 1.2)")]
    end

    VercelEdge --> StudentUI
    VercelEdge --> DriverUI
    VercelEdge --> AdminUI

    StudentUI -- "HTTPS REST API (JWT)" --> ExpressApp
    DriverUI -- "HTTPS REST API (JWT)" --> ExpressApp
    AdminUI -- "HTTPS REST API (JWT)" --> ExpressApp
    IoTDevice -- "POST /api/tracking" --> ExpressApp

    StudentUI <== "WebSocket WSS (Room: bus:id)" ==> SocketServer
    DriverUI <== "WebSocket WSS (Room: bus:id)" ==> SocketServer
    AdminUI <== "WebSocket WSS (Room: bus:id)" ==> SocketServer

    ExpressApp --> AuthMiddleware
    AuthMiddleware --> TiDBCloud
    AuthMiddleware -. "On Connection Failure" .-> FallbackStore
    ExpressApp -- "Emit Telemetry Broadcast" --> SocketServer
```

---

## 4. Functional Modules

### 4.1 Student Transit Portal
Located in [StudentView.jsx](file:///c:/Users/Akshay%20Kumar/Documents/Bus%20Tracking%20System/src/views/student/StudentView.jsx):
1. **Interactive Real-Time Map**:
   - Renders OpenStreetMap tiles with custom SVG bus markers with heading angles.
   - Marker popups display bus number, driver name, speed, occupancy, and dynamic ETA.
2. **Route Corridor Inspector**:
   - Visualizes sequential route stops with expected arrival timestamps and waypoint sequence orders.
3. **Live Operational Board**:
   - Categorizes vehicles by operational state (`On Time`, `Delayed`, `In Transit`, `At Depot`, `Completed`).
4. **Student Grievance Ticketing Desk**:
   - Form submission across 5 grievance categories (`Bus Delay`, `Driver Behaviour`, `Bus Condition`, `Route Issue`, `Other`).
   - Private ticket history display; enforces data ownership (Student A cannot access Student B's complaints).
5. **Simulated RFID Digital Bus Pass**:
   - Renders unique student transit credentials with barcode graphics and status badges (`Active Commuter Pass`).
6. **Emergency Broadcast Monitor**:
   - Displays real-time SOS alerts and administrative notices.

### 4.2 Driver Operational Console
Located in [DriverView.jsx](file:///c:/Users/Akshay%20Kumar/Documents/Bus%20Tracking%20System/src/views/driver/DriverView.jsx):
1. **Standby Roster Screen**:
   - Renders if no bus or route is assigned by administrative dispatch, explaining operational status without crashing.
2. **Trip Lifecycle Controllers**:
   - **Start Trip**: Validates vehicle assignment, marks bus as `"In Transit"`, driver as `"On Trip"`, and initializes elapsed timer.
   - **End Trip**: Confirms arrival at destination terminal, updates bus to `"At Depot"`, driver to `"Available"`, and archives trip records.
3. **Stop Advancement Checkpoint**:
   - Step-by-step stop progression (`Mark Stop Arrived`), alerting dispatch and commuters upon reaching waypoints.
4. **Passenger Headcount Gauge**:
   - Dynamic counter tracking boarding/alighting passenger count against vehicle seat capacity.
5. **Advisory Incident & Delay Reporting**:
   - Allows drivers to log traffic congestion or maintenance holds, recalculating downstream arrival estimates.
6. **Urgent SOS Signal**:
   - Instant distress trigger broadcasting emergency notice across the transit network.

### 4.3 Fleet Administration & Dispatch Dashboard
Located in [AdminView.jsx](file:///c:/Users/Akshay%20Kumar/Documents/Bus%20Tracking%20System/src/views/admin/AdminView.jsx):
1. **Fleet Analytics & Telematics Ledger**:
   - High-level KPIs: Active Fleet, Deployed Drivers, Transit Corridors, Passenger Volume.
   - 10-column live telematics monitor with pulse indicators and map synchronization.
2. **Three-Way Dispatch Matrix (Assignment Engine)**:
   - Assigns `Bus` $\leftrightarrow$ `Driver` $\leftrightarrow$ `Route` with validation:
     - Automatically clears any previous driver linked to target bus (preventing database `UNIQUE` constraint collisions).
     - Resolves numeric IDs, employee codes (`DRV-101`), bus numbers (`BUS-101`), and prefixed IDs (`drv_1`, `bus_101`).
3. **Asset Inventory Management (CRUD)**:
   - Full lifecycle management for Vehicles (capacity, registration, fuel type, status) and Drivers (license, shift, phone, status).
4. **Route Corridor Architecture**:
   - Create, edit, and reorder transit routes and sequential geographic stops (latitude, longitude, sequence order).
5. **Grievance Triage & Resolution Desk**:
   - Review incoming student tickets, update investigation status (`Pending`, `In Progress`, `Resolved`, `Rejected`), and submit official administrative responses.
6. **Notice Board Publisher**:
   - Broadcast system-wide announcements with target audience segmentation (`All Students`, `Drivers Only`, `Faculty`).

---

## 5. Database Architecture & Entity Relationships

The system uses a normalized relational schema with 9 primary tables. The schema file is maintained in [server/database/schema.sql](file:///c:/Users/Akshay%20Kumar/Documents/Bus%20Tracking%20System/server/database/schema.sql).

### 5.1 Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    USERS ||--o| DRIVERS : "has profile (1:1)"
    USERS ||--o{ COMPLAINTS : "files (1:N)"
    USERS ||--o{ NOTICES : "publishes (1:N)"
    
    BUSES ||--o| DRIVERS : "assigned to (1:1)"
    ROUTES ||--o{ DRIVERS : "assigned to (1:N)"
    ROUTES ||--o{ ROUTE_STOPS : "contains (1:N)"
    
    BUSES ||--o{ TRIPS : "operates (1:N)"
    DRIVERS ||--o{ TRIPS : "drives (1:N)"
    ROUTES ||--o{ TRIPS : "follows (1:N)"
    
    BUSES ||--o{ TRACKING : "reports telemetry (1:N)"
    TRIPS ||--o{ TRACKING : "associated with (1:N)"
    
    BUSES ||--o{ COMPLAINTS : "referenced in (1:N)"
    ROUTES ||--o{ COMPLAINTS : "referenced in (1:N)"
```

### 5.2 Key Tables & Field Specifications

1. **`users`**:
   - `id` (INT PK AI), `student_id` (VARCHAR UNIQUE), `name` (VARCHAR), `email` (VARCHAR UNIQUE), `password_hash` (VARCHAR), `role` (ENUM: `'student'`, `'driver'`, `'admin'`), `phone`, `department`, `year`, `digital_pass_id` (VARCHAR UNIQUE).
2. **`buses`**:
   - `id` (INT PK AI), `bus_number` (VARCHAR UNIQUE), `registration_number` (VARCHAR), `model` (VARCHAR), `capacity` (INT), `current_occupancy` (INT), `fuel_type` (VARCHAR), `status` (ENUM: `'At Depot'`, `'In Transit'`, `'Delayed'`, `'Maintenance'`, `'Completed'`).
3. **`routes`**:
   - `id` (INT PK AI), `route_code` (VARCHAR UNIQUE), `name` (VARCHAR), `start_point` (VARCHAR), `end_point` (VARCHAR), `distance_km` (DECIMAL), `estimated_duration` (VARCHAR), `status` (ENUM).
4. **`drivers`**:
   - `id` (INT PK AI), `user_id` (INT UNIQUE FK $\rightarrow$ `users.id`), `employee_id` (VARCHAR UNIQUE), `license_number` (VARCHAR), `phone` (VARCHAR), `status` (ENUM: `'Available'`, `'On Trip'`, `'On Leave'`, `'Off Duty'`), `assigned_bus_id` (INT UNIQUE FK $\rightarrow$ `buses.id`), `assigned_route_id` (INT FK $\rightarrow$ `routes.id`), `shift` (VARCHAR), `rating` (DECIMAL).
5. **`route_stops`**:
   - `id` (INT PK AI), `route_id` (INT FK $\rightarrow$ `routes.id`), `stop_name` (VARCHAR), `latitude` (DECIMAL 10,8), `longitude` (DECIMAL 11,8), `stop_order` (INT), `scheduled_arrival` (VARCHAR).
6. **`trips`**:
   - `id` (INT PK AI), `trip_code` (VARCHAR UNIQUE), `bus_id` (INT FK), `driver_id` (INT FK), `route_id` (INT FK), `start_time` (VARCHAR), `end_time` (VARCHAR), `status` (ENUM: `'Scheduled'`, `'In Transit'`, `'Completed'`, `'Cancelled'`), `passenger_count` (INT).
7. **`tracking`**:
   - `id` (INT PK AI), `bus_id` (INT FK), `trip_id` (INT FK NULL), `latitude` (DECIMAL 10,8), `longitude` (DECIMAL 11,8), `speed` (DECIMAL 5,2), `current_stop` (VARCHAR), `next_stop` (VARCHAR), `eta_minutes` (INT), `is_live` (TINYINT), `timestamp` (TIMESTAMP).
8. **`complaints`**:
   - `id` (INT PK AI), `user_id` (INT FK), `bus_id` (INT FK NULL), `route_id` (INT FK NULL), `subject` (VARCHAR), `category` (VARCHAR), `description` (TEXT), `status` (ENUM: `'Pending'`, `'In Progress'`, `'Resolved'`, `'Rejected'`), `priority` (ENUM), `admin_response` (TEXT).
9. **`notices`**:
   - `id` (INT PK AI), `title` (VARCHAR), `message` (TEXT), `type` (VARCHAR), `target` (VARCHAR), `created_by` (INT FK NULL $\rightarrow$ `users.id`).

---

## 6. API Architecture, Security & Authentication

### 6.1 Authentication Mechanism
- **Password Security**: Passwords are salted and hashed using `bcryptjs` with 10 rounds prior to database insertion. Raw passwords are never stored or logged.
- **Stateless Tokens**: On successful login (`POST /api/auth/login`), the server issues an industry-standard JWT signed with `HS256`. The payload contains minimal non-sensitive identity claims (`id`, `email`, `role`).
- **Bearer Token Storage**: Tokens are stored in browser `localStorage` via [tokenStorage.js](file:///c:/Users/Akshay%20Kumar/Documents/Bus%20Tracking%20System/src/services/tokenStorage.js) and automatically injected into outbound HTTP request headers as `Authorization: Bearer <token>`.
- **Session Restoration**: Application startup invokes `GET /api/auth/me` to validate token integrity and restore the user's role profile without re-prompting login.

### 6.2 Role-Based Access Control (RBAC) Matrix

| Endpoint | HTTP Method | Student | Driver | Admin | Purpose |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `/api/auth/login` | POST | Permitted | Permitted | Permitted | User authentication & JWT issuance |
| `/api/auth/register` | POST | Permitted | Blocked | Blocked | Student self-registration (locked to student role) |
| `/api/auth/me` | GET | Permitted | Permitted | Permitted | Token identity verification & profile load |
| `/api/buses` | GET | Read-Only | Read-Only | Full Access | Fleet list |
| `/api/buses` | POST / PUT / DELETE | Blocked (403) | Blocked (403) | Permitted | Vehicle fleet asset mutations |
| `/api/drivers/:id/assignment` | PUT | Blocked (403) | Blocked (403) | Permitted | Bind bus, driver, and route |
| `/api/trips/start` | POST | Blocked (403) | Permitted | Blocked (403) | Initialize active bus trip |
| `/api/trips/end` | POST | Blocked (403) | Permitted | Blocked (403) | Terminate active bus trip |
| `/api/tracking` | POST | Blocked (403) | Permitted | Blocked (403) | Ingest GPS telematics |
| `/api/complaints` | POST / GET | Own Only | Read-Only | Full Access | File grievances / Triage resolution |
| `/api/complaints/:id` | PATCH | Blocked (403) | Blocked (403) | Permitted | Update grievance status & response |
| `/api/notices` | POST / PUT / DELETE | Blocked (403) | Blocked (403) | Permitted | Publish campus transit advisories |

---

## 7. Real-Time Bus Tracking Engine

A critical requirement for this academic project is accurately distinguishing between the simulated GPS engine and physical GPS hardware ingestion.

### 7.1 Simulated GPS Engine vs. Physical Hardware Ingestion

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          SMARTBUS TELEMETRY PIPELINE                            │
│                                                                                 │
│   [MODE A: In-Browser GPS Simulator]        [MODE B: Physical IoT GPS Tracker]   │
│   • Physics Acceleration & Deceleration      • Hardware: ESP32 / SIM800L / Neo-6M│
│   • Haversine Geodesic Interpolation        • Satellites: NMEA sentence parsing  │
│   • Sequential Stop-to-Stop Waypoints       • GSM/GPRS Cellular Uplink           │
│                    │                                         │                  │
│                    ▼                                         ▼                  │
│   [Client Simulation Loop in AppContext]   [HTTPS POST /api/tracking Payload]   │
│   --------------------------------------   -----------------------------------  │
│   Latitude, Longitude, Speed, Heading       Latitude, Longitude, Speed, Heading │
│                    │                                         │                  │
│                    └────────────────────┬────────────────────┘                  │
│                                         ▼                                       │
│                    [REST Telemetry Ingestion Endpoint]                          │
│                    POST /api/tracking (JWT Driver Auth)                         │
│                                         │                                       │
│                                         ▼                                       │
│                    [MySQL / TiDB tracking Table Insert]                         │
│                                         │                                       │
│                                         ▼                                       │
│                    [Socket.IO Server Event Emission]                            │
│                    io.to('bus:' + bus_id).emit('bus_location_update')           │
│                                         │                                       │
│                                         ▼                                       │
│                    [Subscribed Clients (Student & Admin UI)]                    │
│                    Marker repositioned on Leaflet Map Canvas                    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

1. **Simulated GPS Engine (Currently Active for Demonstration)**:
   - When an active trip is ongoing, the client-side simulation loop in [AppContext.jsx](file:///c:/Users/Akshay%20Kumar/Documents/Bus%20Tracking%20System/src/context/AppContext.jsx#L488-L640) iterates every 2 seconds.
   - It computes the bus's position along the assigned route's sequential stops using linear geographic interpolation between stops $S_k(\text{lat}_1, \text{lng}_1)$ and $S_{k+1}(\text{lat}_2, \text{lng}_2)$.
   - It introduces realistic acceleration near mid-segments, deceleration upon approaching stop coordinates, and a scheduled dwell time (hold ticks) at passenger pickup points.
   - The computed telemetry is ingested into the backend via `trackingApi.updateTracking()`, storing historical points in the `tracking` table and broadcasting to WebSockets.

2. **Physical GPS Hardware Ingestion (Hardware Integration Specification)**:
   - In production vehicle deployments, an onboard microcontroller (e.g., **ESP32**, **NodeMCU**, or **Raspberry Pi**) interfaced with a **NEO-6M GPS Module** and a **SIM800L 4G/GPRS Modem** captures geographic coordinate strings via NMEA sentences (`$GPRMC` / `$GPGGA`).
   - The microcontroller executes an HTTPS POST request to `/api/tracking` every 3–5 seconds with payload:
     ```json
     {
       "bus_id": 1,
       "latitude": 24.585400,
       "longitude": 73.689800,
       "speed": 34.5,
       "current_stop": "Surajpole Circle",
       "next_stop": "Delhi Gate",
       "eta_minutes": 6
     }
     ```
   - The backend accepts this exact payload, validates coordinate boundaries ($-90 \le \text{lat} \le 90$ and $-180 \le \text{lng} \le 180$), persists the record, and broadcasts the real-time position to the student's map.

### 7.2 Mathematical Formulations: Great-Circle Haversine Formula & Physics ETA
Located in [geoEtaService.js](file:///c:/Users/Akshay%20Kumar/Documents/Bus%20Tracking%20System/src/services/geoEtaService.js):

$$\Delta\sigma = 2 \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$

$$d = R \cdot \Delta\sigma$$

Where:
- $\phi_1, \phi_2$ = Latitudes in radians ($\text{lat} \cdot \frac{\pi}{180}$)
- $\Delta\phi = \phi_2 - \phi_1$, $\Delta\lambda = \lambda_2 - \lambda_1$ (Longitude difference in radians)
- $R$ = Mean radius of the Earth ($6,371.0\text{ km}$)
- $d$ = Spherical surface distance in kilometers

The dynamic arrival time (ETA) is computed using dynamic velocity adjusted for dwell time:

$$\text{ETA (minutes)} = \left(\frac{d}{\max(v_{\text{current}}, 15\text{ km/h})} \times 60\right) + (\text{stopsRemaining} \times t_{\text{dwell}})$$

Where:
- $v_{\text{current}}$ = Current vehicle telemetry speed (clamped at minimum $15\text{ km/h}$ to prevent infinite division during stops).
- $t_{\text{dwell}}$ = Standard station boarding delay ($1.5\text{ minutes}$ per intermediate stop).

### 7.3 Socket.IO Room Partitioning & Reconnection
Located in [server/socket/socketRooms.js](file:///c:/Users/Akshay%20Kumar/Documents/Bus%20Tracking%20System/server/socket/socketRooms.js) and [src/services/socket.js](file:///c:/Users/Akshay%20Kumar/Documents/Bus%20Tracking%20System/src/services/socket.js):
- Sockets subscribe to rooms matching `bus:<bus_id>` (e.g. `bus:1`).
- When a driver posts telemetry for Bus 1, only clients observing Bus 1 receive the `bus_location_update` payload, avoiding unnecessary data transmission to clients tracking Bus 2.
- If connectivity drops, `reconnection: true` attempts 15 reconnect iterations with exponential backoff (`reconnectionDelay: 1000ms`), automatically re-joining `bus:<bus_id>` upon restoration.

---

## 8. Setup, Installation & Cloud Deployment Guide

### 8.1 Local Development Environment Prerequisites
- **Node.js**: Version 18.x or 20.x
- **npm**: Version 9.x or higher
- **MySQL Server** (Optional for local mode; in-memory fallback runs automatically if MySQL is offline).

### 8.2 Local Installation Steps

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/akshaykumarsiluveru-ai/smartbus-transport-management.git
   cd smartbus-transport-management
   ```

2. **Install Frontend & Backend Dependencies**:
   ```bash
   # Install frontend dependencies
   npm install

   # Install backend dependencies
   cd server
   npm install
   cd ..
   ```

3. **Configure Environment Variables**:
   - In root directory, create `.env`:
     ```env
     VITE_API_URL=http://localhost:5000/api
     ```
   - In `server/` directory, create `server/.env`:
     ```env
     PORT=5000
     DB_HOST=localhost
     DB_PORT=3306
     DB_USER=root
     DB_PASSWORD=your_password
     DB_NAME=smartbus
     JWT_SECRET=your_jwt_secret_key_2026
     ```

4. **Initialize Database (Optional)**:
   If using local MySQL:
   ```bash
   mysql -u root -p < server/database/schema.sql
   mysql -u root -p < server/database/seed.sql
   ```
   *(Note: If MySQL is omitted, the backend runs in comprehensive in-memory store mode, seeded with default accounts).*

5. **Start Development Servers**:
   - Terminal 1 (Backend API & Socket.IO):
     ```bash
     cd server
     npm run dev
     ```
   - Terminal 2 (Frontend Vite Development Server):
     ```bash
     npm run dev
     ```
   - Access the application at `http://localhost:5173`.

### 8.3 Cloud Deployment Architecture

#### 1. Database Deployment: TiDB Cloud (Serverless MySQL)
- Create a Serverless cluster on [TiDB Cloud](https://tidbcloud.com/).
- Execute `server/database/schema.sql` and `server/database/seed.sql` inside the TiDB Cloud SQL Editor.
- In **Security / Traffic Filters**, allow inbound connections (`0.0.0.0/0`).
- Ensure SSL is enabled (`minVersion: 'TLSv1.2'`).

#### 2. Backend Deployment: Render
- Create a **Web Service** on [Render](https://render.com/) linked to your GitHub repository.
- **Root Directory**: `server`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment Variables**:
  - `PORT`: `5000`
  - `DB_HOST`: TiDB cluster gateway host
  - `DB_PORT`: `4000`
  - `DB_USER`: TiDB username
  - `DB_PASSWORD`: TiDB password
  - `DB_NAME`: `smartbus`
  - `DB_SSL`: `true`
  - `JWT_SECRET`: Secure cryptographic string
  - `FRONTEND_ORIGIN`: `https://smartbus-transport-management.vercel.app`

#### 3. Frontend Deployment: Vercel
- Create a project on [Vercel](https://vercel.com/) linked to the repository root.
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_URL` = `https://<render-backend-url>/api`
  - `VITE_SOCKET_URL` = `https://<render-backend-url>`
- Click **Deploy**. Vercel uses `vercel.json` to handle client-side routing.

---

## 9. Verification, Quality Assurance & Test Results

The platform incorporates comprehensive test automation suites across backend REST controllers, authentication guards, real-time WebSockets, and frontend state services.

### 9.1 Test Execution Summary (173 / 173 Tests Passed)

```
========================================================================================
🧪 SMARTBUS COMPREHENSIVE TEST EXECUTION MATRIX
========================================================================================
Suite 1:  server/testAssignmentSuite.js          14 / 14 Passed (100%)  [Assignment & Joins]
Suite 2:  server/testAuthSuite.js                12 / 12 Passed (100%)  [JWT & RBAC]
Suite 3:  server/testAdminIntegration.js         19 / 19 Passed (100%)  [Fleet & Route CRUD]
Suite 4:  server/testDriverIntegration.js        13 / 13 Passed (100%)  [Trips & Telematics]
Suite 5:  server/testStudentIntegration.js       17 / 17 Passed (100%)  [Tracking & Grievance]
Suite 6:  server/testCoreApis.js                 18 / 18 Passed (100%)  [REST HTTP Codes]
Suite 7:  server/testOperationalApis.js          15 / 15 Passed (100%)  [Dispatch State Lifecycle]
Suite 8:  server/testSocketInfrastructure.js     14 / 14 Passed (100%)  [WebSocket Handshake & Auth]
Suite 9:  server/testTelemetryBroadcast.js       11 / 11 Passed (100%)  [REST-to-WS Broadcast]
Suite 10: server/testFrontendSocketIntegration.js 13 / 13 Passed (100%)  [Client Room Subscriptions]
Suite 11: server/testPhase5EHardening.js         20 / 20 Passed (100%)  [Boundary & Injection Defense]
Suite 12: src/services/apiTest.js                 6 /  6 Passed (100%)  [Frontend API Layer]
Suite 13: src/services/authMigrationTest.js      11 / 11 Passed (100%)  [Session Storage & Restor.]
────────────────────────────────────────────────────────────────────────────────────────
OVERALL TEST RESULTS:                           173 PASSED, 0 FAILED (100% SUCCESS RATE)
FRONTEND VITE PRODUCTION BUILD:                 ✓ Built in 4.31s (Zero Lint/Type Errors)
========================================================================================
```

---

## 10. Limitations & Future AI/ML Enhancements

### 10.1 Current Limitations
1. **GPS Source**: Primary vehicle movement currently runs via the physics interpolation engine in software; physical tracker integration requires IoT hardware deployment per bus.
2. **Fixed Static Speeds in Fallback**: When traffic speed data is unavailable, the fallback ETA calculator assumes average baseline speed ranges ($15–35\text{ km/h}$).
3. **Database Fallback Mode**: If network connectivity to the cloud database drops, the backend falls back to its in-memory store; while fully functional, state created in in-memory mode does not write back to cold MySQL storage.

### 10.2 Future AI/ML Research Directions (B.Tech CSE - AI & ML Focus)
1. **Deep Learning Dynamic ETA Prediction (LSTM / GRU Neural Networks)**:
   - Train an LSTM recurrent neural network on historical transit coordinates, time of day, weather, day of week, and intersection delay factors to predict arrival times with higher accuracy than static geometric formulas.
2. **Computer Vision Passenger Headcount & Crowd Density Estimation**:
   - Deploy lightweight edge models (e.g. YOLOv8-nano on Raspberry Pi with camera) inside vehicle doorways to automate passenger ingress/egress counting and seat occupancy estimation.
3. **Automated AI Transit Corridor Optimization**:
   - Utilize clustering algorithms (DBSCAN / K-Means) on student residential postal addresses to automatically generate transit route corridors that minimize total commuter transit time and fuel consumption.
4. **Predictive Maintenance Forecasting**:
   - Apply Random Forest classifiers on vehicle telemetry (speed variations, mileage, engine hours) to predict component breakdown risk prior to vehicle failure.

---

## 11. 5–7 Minute Viva / Final Demonstration Script

This structured script is tailored for the final project defense and viva evaluation.

| Time | Stage | Screen / Role | Actions to Perform | What to Explain to Examiners |
| :--- | :--- | :--- | :--- | :--- |
| **0:00 – 1:00** | Introduction & Problem Context | Project Overview & Login Modal | Open `https://smartbus-transport-management.vercel.app/`. Show Login Modal with Brand Icon. | "SmartBus addresses the opacity in campus bus operations through real-time telemetry, role-based workflows, and automated dispatch." |
| **1:00 – 2:30** | Student Portal & Live Map Tracking | Student Demo (`student@smartbus.edu`) | 1. Click **Student Demo** quick-login button.<br>2. Explore interactive Leaflet map.<br>3. Click Bus 101 marker to view dynamic ETA, speed, and occupancy.<br>4. Switch to **Complaints** tab $\rightarrow$ click **Raise Complaint** $\rightarrow$ submit ticket.<br>5. Click **Digital Bus Pass** modal. | "Notice the live vehicle positioning. ETAs are calculated dynamically using the Haversine great-circle formula. The Student portal enforces ownership isolation: students only see their own tickets." |
| **2:30 – 4:00** | Driver Operations & Telemetry Broadcast | Driver Demo (`driver@smartbus.edu`) | 1. Logout $\rightarrow$ Click **Driver Demo** quick-login button.<br>2. Show Assigned Bus (`BUS-101`) & Route (`R-01`).<br>3. Click **Start Trip** button.<br>4. Observe live timer and status change to `'In Transit'`.<br>5. Advance stop sequence (`Mark Stop Arrived`).<br>6. Trigger **Emergency SOS** alert.<br>7. Click **End Trip** $\rightarrow$ confirm completion. | "The Driver Console handles trip operations. Starting a trip transitions the bus status to 'In Transit' and begins broadcasting telemetry over Socket.IO rooms. Ending the trip safely returns the vehicle to 'At Depot'." |
| **4:00 – 5:30** | Admin Dispatch & Assignment Engine | Admin Demo (`admin@smartbus.edu`) | 1. Logout $\rightarrow$ Click **Admin Demo** quick-login button.<br>2. Show Fleet Overview cards and 10-column telematics table.<br>3. Open **Assignments (Dispatch)** tab.<br>4. Reassign a driver to Bus 102 and Route 2.<br>5. Demonstrate that the assignment persists and displays driver names without showing 'Unassigned'.<br>6. Open **Complaints Desk** $\rightarrow$ locate student's ticket $\rightarrow$ mark 'Resolved' with response remark. | "The Admin console provides full network control. We resolved the assignment synchronization issue: our backend query joins drivers, routes, and buses, while resolving both numeric IDs and employee codes." |
| **5:30 – 6:30** | Technical Architecture & Code Highlights | Code Editor / Terminal | 1. Open `server/testAssignmentSuite.js` $\rightarrow$ run in terminal.<br>2. Show all 14 tests passing.<br>3. Show `server/controllers/busController.js` SQL query join.<br>4. Highlight `server/socket/socketServer.js` CORS configuration. | "Our system includes 173 automated unit and integration tests with a 100% pass rate. The build is production-ready, compiling under Vite in 4.3 seconds." |
| **6:30 – 7:00** | Conclusion & Viva Q&A | Summary Slide / Architecture Diagram | Summarize key engineering takeaways: JWT security, Socket.IO room isolation, and AI/ML roadmap. | "Thank you, examiners. We are now open for questions regarding the architecture, algorithms, or implementation." |

---

## 12. Screenshot Checklist for College Documentation

When preparing your final printed report, include these screenshots:

1. [ ] **Figure 1**: Login & Authentication Portal (showing Email/Password inputs and Quick Demo role switcher).
2. [ ] **Figure 2**: Student Portal – Interactive Leaflet Map with Active Bus Marker & Popup Telemetry.
3. [ ] **Figure 3**: Student Portal – Route Stop Timeline with Estimated Arrival Times.
4. [ ] **Figure 4**: Student Portal – Student Grievance Ticket Submission Modal & Status Ledger.
5. [ ] **Figure 5**: Student Portal – Simulated Digital RFID Student Transit Pass.
6. [ ] **Figure 6**: Driver Console – Active Trip Controller, Live Stop Checkpoint, and Headcount Meter.
7. [ ] **Figure 7**: Driver Console – Standby Roster Screen (when vehicle unassigned).
8. [ ] **Figure 8**: Admin Dashboard – Fleet Telemetry Overview & Real-Time Telematics Ledger.
9. [ ] **Figure 9**: Admin Dashboard – Bus, Driver & Route Operational Dispatch Assignment Modal.
10. [ ] **Figure 10**: Admin Dashboard – Complaints Resolution & Response Management Screen.
11. [ ] **Figure 11**: Terminal Execution – Automated Test Suite (173 / 173 tests passing).
12. [ ] **Figure 12**: Cloud Deployment – Live Vercel Frontend and Render Backend Status.

---

## 13. Troubleshooting Guide & Known Issues Resolved

### 13.1 Issue: "Invalid driver format" on Admin Route Assignment
- **Symptom**: When assigning a driver in the Admin UI, the server returned HTTP 400 with message `"Invalid driver format"`.
- **Root Cause**: The backend handler [driverController.js](file:///c:/Users/Akshay%20Kumar/Documents/Bus%20Tracking%20System/server/controllers/driverController.js) strictly called `parseInt(req.params.id, 10)` and checked `isNaN()`. If an alphanumeric ID (e.g. `'drv_1'`), employee ID (e.g. `'DRV-101'`), or undefined parameter was passed, it failed validation immediately.
- **Resolution**: Created `resolveDriverRecord()` to defensively match against numeric IDs, uppercase `employee_id`, and prefixed identifiers in both MySQL and the in-memory fallback store.

### 13.2 Issue: Bus Card Continuously Displayed "Unassigned" Post-Assignment
- **Symptom**: After assigning a driver to a bus and route with HTTP 200, the Admin Dashboard continued showing `"Unassigned"`.
- **Root Cause**: The `buses` table in MySQL stores vehicle attributes only (`bus_number`, `capacity`, etc.); the relational foreign keys reside in the `drivers` table (`assigned_bus_id` and `assigned_route_id`). The controller query executed `SELECT * FROM buses`, returning buses without joined driver details.
- **Resolution**: Updated [busController.js](file:///c:/Users/Akshay%20Kumar/Documents/Bus%20Tracking%20System/server/controllers/busController.js) with `BUS_JOIN_SQL`, joining `buses` with `drivers`, `users`, and `routes`. Also updated [AppContext.jsx](file:///c:/Users/Akshay%20Kumar/Documents/Bus%20Tracking%20System/src/context/AppContext.jsx) with bidirectional mapping so assignment state persists across data refreshes.

### 13.3 Issue: TiDB Cloud Database Connection Requiring SSL
- **Symptom**: Cloud connection to TiDB Cloud on Render failed with `Connections using insecure transport are prohibited`.
- **Root Cause**: Cloud-managed MySQL/TiDB instances require TLS/SSL encryption for network traffic.
- **Resolution**: Configured [server/config/db.js](file:///c:/Users/Akshay%20Kumar/Documents/Bus%20Tracking%20System/server/config/db.js) to enable `ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }` when `DB_SSL === 'true'` or when `DB_HOST` targets TiDB Cloud.

### 13.4 Issue: Socket.IO Cross-Origin Request Blocked on Vercel
- **Symptom**: WebSocket connection failed when accessing the live Vercel deployment.
- **Root Cause**: Socket.IO CORS origin was hardcoded to `http://localhost:5173`.
- **Resolution**: Configured [server/socket/socketServer.js](file:///c:/Users/Akshay%20Kumar/Documents/Bus%20Tracking%20System/server/socket/socketServer.js) to dynamically allow `https://smartbus-transport-management.vercel.app`, `*.vercel.app`, and origin overrides from environment variables.

---

**Report Prepared By**: Akshay Kumar & Team  
**Program**: B.Tech Computer Science & Engineering (Artificial Intelligence & Machine Learning)  
**Academic Submission Status**: Verified, Tested, & Submission-Ready  
