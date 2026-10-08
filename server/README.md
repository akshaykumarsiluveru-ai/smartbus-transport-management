# SmartBus – Backend API Server & Database Foundation

This is the backend server for the **SmartBus – Bus Tracking & Transport Management System**, built with **Node.js**, **Express**, and **MySQL**.

---

## 1. System Requirements

- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **MySQL Server**: v8.0 or higher (or MariaDB 10.4+)

---

## 2. Backend Directory Structure

```
/server
├── /config           # Database connection & environment setup
├── /controllers      # Route controllers (health, auth, buses, etc.)
├── /database         # MySQL Schema and Seed SQL scripts
├── /middleware       # Centralized error handling & middleware
├── /routes           # Express route definitions
├── /services         # Business logic services
├── /utils            # Utility functions
├── .env.example      # Environment variables template
├── .gitignore        # Server git ignore configuration
├── package.json      # Node.js dependencies
├── README.md         # Documentation
└── server.js         # Express server entry point
```

---

## 3. Installation & Setup Instructions

### Step 1: Install Dependencies
Open a terminal in the `/server` directory and run:
```bash
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env` in the `/server` directory:
```bash
cp .env.example .env
```
Update your `.env` configuration file with your MySQL credentials:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=smartbus
JWT_SECRET=your_jwt_secret_key
```

---

## 4. Database Initialization (MySQL)

### Step 1: Create Database & Tables (`schema.sql`)
Run the schema creation script using MySQL Command Line Client, MySQL Workbench, or phpMyAdmin:

Using MySQL CLI:
```bash
mysql -u root -p < database/schema.sql
```

This creates the normalized `smartbus` database with the following 10 relational tables:
1. `users`
2. `buses`
3. `routes`
4. `drivers`
5. `route_stops`
6. `trips`
7. `tracking`
8. `complaints`
9. `notices`
10. `maintenance_logs`

### Step 2: Seed Demo Data (`seed.sql`)
Populate the database with realistic Udaipur campus demo data:
```bash
mysql -u root -p smartbus < database/seed.sql
```

#### Seeded Demo Accounts:
- **Admin**: Email: `admin@smartbus.edu` | Password: `admin123`
- **Driver 1**: Email: `driver@smartbus.edu` | Password: `driver123`
- **Driver 2**: Email: `sunil@smartbus.edu` | Password: `driver123`
- **Student 1**: Email: `student@smartbus.edu` | Password: `student123`
- **Student 2**: Email: `priya@smartbus.edu` | Password: `student123`

---

## 5. Starting the Server

### Development Mode (with Nodemon auto-reload):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

---

## 6. Testing the Health Check Endpoint

Open your browser or use `curl`:
```bash
curl http://localhost:5000/api/health
```

### Expected Response:
```json
{
  "success": true,
  "message": "SmartBus backend is running",
  "timestamp": "2026-10-05T22:41:00.000Z",
  "environment": "development"
}
```
