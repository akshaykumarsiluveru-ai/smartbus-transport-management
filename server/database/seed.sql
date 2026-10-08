-- SmartBus Initial Database Seed File
-- Contains default demo accounts matching frontend mock data environment.
--
-- DEMO ACCOUNTS & CREDENTIALS:
-- 1. Admin:    Email: admin@smartbus.edu    | Password: admin123
-- 2. Driver 1: Email: driver@smartbus.edu   | Password: driver123
-- 3. Driver 2: Email: sunil@smartbus.edu    | Password: driver123
-- 4. Student 1: Email: student@smartbus.edu | Password: student123
-- 5. Student 2: Email: priya@smartbus.edu   | Password: student123

USE `smartbus`;

-- Clean up existing data before seeding
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE `maintenance_logs`;
TRUNCATE TABLE `notices`;
TRUNCATE TABLE `complaints`;
TRUNCATE TABLE `tracking`;
TRUNCATE TABLE `trips`;
TRUNCATE TABLE `route_stops`;
TRUNCATE TABLE `drivers`;
TRUNCATE TABLE `routes`;
TRUNCATE TABLE `buses`;
TRUNCATE TABLE `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- --------------------------------------------------------
-- 1. Seed Users
-- --------------------------------------------------------
INSERT INTO `users` (`id`, `student_id`, `name`, `email`, `password_hash`, `role`, `phone`, `department`, `year`, `digital_pass_id`) VALUES
(1, NULL, 'Dr. Arthur Vance (Fleet Director)', 'admin@smartbus.edu', '$2a$10$7edE.6ulT02IgyLrzC.mQe9pu2ThuQP3nZYQUpD4KBvk4FCgOm1TK', 'admin', '+91 94141 00000', 'Transport Operations Control', 'N/A', NULL),
(2, NULL, 'Ramesh Sharma', 'driver@smartbus.edu', '$2a$10$.Cfm1BHiu8OWIPVRcT1vpee8fCeJ7folIzElVw0RuG4naWpNHgg5e', 'driver', '+91 94140 67890', 'Fleet Driving Operations', 'N/A', NULL),
(3, NULL, 'Sunil Verma', 'sunil@smartbus.edu', '$2a$10$.Cfm1BHiu8OWIPVRcT1vpee8fCeJ7folIzElVw0RuG4naWpNHgg5e', 'driver', '+91 98281 44321', 'Fleet Driving Operations', 'N/A', NULL),
(4, 'STU-2026-001', 'Alex Johnson', 'student@smartbus.edu', '$2a$10$AcX74WTxMMqD1YYsNSKcNeYn/DWjdQ9Y0E54qZl0NRa.NhpneWBiu', 'student', '+91 98290 12345', 'Computer Science & Engineering', '3rd Year', 'SB-STU-2026-001'),
(5, 'STU-2026-002', 'Priya Sharma', 'priya@smartbus.edu', '$2a$10$AcX74WTxMMqD1YYsNSKcNeYn/DWjdQ9Y0E54qZl0NRa.NhpneWBiu', 'student', '+91 98291 99887', 'Electrical Engineering', '2nd Year', 'SB-STU-2026-002');

-- --------------------------------------------------------
-- 2. Seed Buses
-- --------------------------------------------------------
INSERT INTO `buses` (`id`, `bus_number`, `registration_number`, `model`, `capacity`, `current_occupancy`, `fuel_type`, `status`) VALUES
(1, 'BUS-101', 'RJ-27-PA-1001', 'Volvo 9400 AC Express', 52, 28, 'Diesel', 'In Transit'),
(2, 'BUS-102', 'RJ-27-PA-1002', 'Tata Starbus Urban 40', 48, 19, 'CNG', 'In Transit'),
(3, 'BUS-103', 'RJ-27-PA-1003', 'Ashok Leyland Lynx', 50, 0, 'Diesel', 'At Depot'),
(4, 'BUS-104', 'RJ-27-PA-1004', 'Eicher Skyline Pro', 45, 0, 'Diesel', 'Maintenance');

-- --------------------------------------------------------
-- 3. Seed Routes
-- --------------------------------------------------------
INSERT INTO `routes` (`id`, `route_code`, `name`, `start_point`, `end_point`, `distance_km`, `estimated_duration`, `status`) VALUES
(1, 'R-01', 'Udaipur City Station Express', 'City Railway Station', 'Central Campus Terminal', 14.50, '35 mins', 'Active'),
(2, 'R-02', 'Fateh Sagar & MLSU Corridor', 'Fateh Sagar Circle', 'North Campus Gate 2', 11.20, '28 mins', 'Active');

-- --------------------------------------------------------
-- 4. Seed Drivers
-- --------------------------------------------------------
INSERT INTO `drivers` (`id`, `user_id`, `employee_id`, `license_number`, `phone`, `status`, `assigned_bus_id`, `assigned_route_id`, `shift`, `rating`) VALUES
(1, 2, 'DRV-101', 'RJ-27-2018-00912', '+91 94140 67890', 'On Trip', 1, 1, 'Morning', 4.9),
(2, 3, 'DRV-102', 'RJ-27-2019-01124', '+91 98281 44321', 'On Trip', 2, 2, 'Morning', 4.8);

-- --------------------------------------------------------
-- 5. Seed Route Stops
-- --------------------------------------------------------
INSERT INTO `route_stops` (`id`, `route_id`, `stop_name`, `latitude`, `longitude`, `stop_order`, `scheduled_arrival`) VALUES
-- Route 1 Stops
(1, 1, 'City Railway Station Terminal', 24.57140000, 73.69740000, 1, '08:00 AM'),
(2, 1, 'Surajpole Circle', 24.57800000, 73.69900000, 2, '08:12 AM'),
(3, 1, 'Delhi Gate Junction', 24.58500000, 73.69000000, 3, '08:22 AM'),
(4, 1, 'Court Circle', 24.59100000, 73.68500000, 4, '08:29 AM'),
(5, 1, 'Central Campus Terminal', 24.59800000, 73.68000000, 5, '08:35 AM'),
-- Route 2 Stops
(6, 2, 'Fateh Sagar Circle', 24.59900000, 73.67500000, 1, '08:15 AM'),
(7, 2, 'Dewali Circle', 24.60500000, 73.68200000, 2, '08:23 AM'),
(8, 2, 'MLSU Main Gate', 24.61100000, 73.69000000, 3, '08:33 AM'),
(9, 2, 'North Campus Gate 2', 24.61800000, 73.69600000, 4, '08:43 AM');

-- --------------------------------------------------------
-- 6. Seed Trips
-- --------------------------------------------------------
INSERT INTO `trips` (`id`, `trip_code`, `bus_id`, `driver_id`, `route_id`, `start_time`, `end_time`, `status`, `passenger_count`) VALUES
(1, 'TRP-1001', 1, 1, 1, '08:00 AM', NULL, 'In Transit', 28),
(2, 'TRP-1002', 2, 2, 2, '08:15 AM', NULL, 'In Transit', 19);

-- --------------------------------------------------------
-- 7. Seed Live Tracking
-- --------------------------------------------------------
INSERT INTO `tracking` (`id`, `bus_id`, `trip_id`, `latitude`, `longitude`, `speed`, `current_stop`, `next_stop`, `eta_minutes`, `is_live`) VALUES
(1, 1, 1, 24.58500000, 73.69000000, 34.50, 'Delhi Gate Junction', 'Court Circle', 7, 1),
(2, 2, 2, 24.60500000, 73.68200000, 28.00, 'Dewali Circle', 'MLSU Main Gate', 10, 1);

-- --------------------------------------------------------
-- 8. Seed Complaints
-- --------------------------------------------------------
INSERT INTO `complaints` (`id`, `user_id`, `bus_id`, `route_id`, `subject`, `category`, `description`, `status`, `priority`, `admin_response`) VALUES
(1, 4, 1, 1, 'Morning Bus Delay at Surajpole', 'Bus Delay', 'Bus 101 arrived 12 minutes later than the scheduled 08:12 AM arrival time.', 'In Progress', 'Medium', 'Driver reported unexpected road maintenance at Surajpole. Route timing updated.'),
(2, 5, 2, 2, 'AC Temperature High in Afternoon', 'Comfort & Maintenance', 'Air conditioning in BUS-102 was inadequate during the afternoon return trip.', 'Resolved', 'Low', 'Technician inspected AC compressor and refilled refrigerant.');

-- --------------------------------------------------------
-- 9. Seed Notices
-- --------------------------------------------------------
INSERT INTO `notices` (`id`, `title`, `message`, `type`, `target`, `created_by`) VALUES
(1, 'Route R-01 Morning Timing Adjustment', 'Please note that Route 1 will run 5 minutes earlier starting next Monday due to road work near Surajpole.', 'Schedule Notice', 'All Students', 1),
(2, 'Digital Campus Transit Pass Requirement', 'All students are requested to keep their SmartBus Digital Pass open on their phones when boarding campus buses.', 'General Announcement', 'All Students', 1);

-- --------------------------------------------------------
-- 10. Seed Maintenance Logs
-- --------------------------------------------------------
INSERT INTO `maintenance_logs` (`id`, `bus_id`, `issue_description`, `mechanic_notes`, `mechanic`, `estimated_cost`, `status`, `sent_at`, `released_at`) VALUES
(1, 4, 'Brake pad replacement and oil filter service', 'Inspected disc brakes and replaced worn front pads. Performed engine flush.', 'Senior Technician Verma', 12500.00, 'In Maintenance', '2026-10-01', NULL);
