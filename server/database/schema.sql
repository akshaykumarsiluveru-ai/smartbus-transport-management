-- SmartBus Relational Database Schema
-- Database Name: smartbus

CREATE DATABASE IF NOT EXISTS `smartbus` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `smartbus`;

-- --------------------------------------------------------
-- 1. Users Table
-- Supports Students, Drivers, and Admins
-- --------------------------------------------------------
DROP TABLE IF EXISTS `maintenance_logs`;
DROP TABLE IF EXISTS `notices`;
DROP TABLE IF EXISTS `complaints`;
DROP TABLE IF EXISTS `tracking`;
DROP TABLE IF EXISTS `trips`;
DROP TABLE IF EXISTS `route_stops`;
DROP TABLE IF EXISTS `drivers`;
DROP TABLE IF EXISTS `routes`;
DROP TABLE IF EXISTS `buses`;
DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` VARCHAR(50) NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('student', 'driver', 'admin') NOT NULL DEFAULT 'student',
  `phone` VARCHAR(20) NULL,
  `department` VARCHAR(100) NULL,
  `year` VARCHAR(50) NULL,
  `digital_pass_id` VARCHAR(50) NULL UNIQUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 2. Buses Table
-- --------------------------------------------------------
CREATE TABLE `buses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `bus_number` VARCHAR(50) NOT NULL UNIQUE,
  `registration_number` VARCHAR(50) NULL,
  `model` VARCHAR(100) NULL,
  `capacity` INT NOT NULL DEFAULT 50,
  `current_occupancy` INT NOT NULL DEFAULT 0,
  `fuel_type` VARCHAR(30) DEFAULT 'Diesel',
  `status` ENUM('At Depot', 'In Transit', 'Delayed', 'Maintenance', 'Completed') NOT NULL DEFAULT 'At Depot',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 3. Routes Table
-- --------------------------------------------------------
CREATE TABLE `routes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `route_code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `start_point` VARCHAR(150) NOT NULL,
  `end_point` VARCHAR(150) NOT NULL,
  `distance_km` DECIMAL(5, 2) NULL,
  `estimated_duration` VARCHAR(50) NULL,
  `status` ENUM('Active', 'Inactive', 'Suspended') NOT NULL DEFAULT 'Active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 4. Drivers Table
-- Linked to Users, Buses, and Routes
-- --------------------------------------------------------
CREATE TABLE `drivers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE,
  `employee_id` VARCHAR(50) NOT NULL UNIQUE,
  `license_number` VARCHAR(50) NULL,
  `phone` VARCHAR(20) NULL,
  `status` ENUM('Available', 'On Trip', 'On Leave', 'Off Duty') NOT NULL DEFAULT 'Available',
  `assigned_bus_id` INT NULL UNIQUE,
  `assigned_route_id` INT NULL,
  `shift` VARCHAR(50) DEFAULT 'Morning',
  `rating` DECIMAL(3, 1) DEFAULT 5.0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_drivers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_drivers_bus` FOREIGN KEY (`assigned_bus_id`) REFERENCES `buses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_drivers_route` FOREIGN KEY (`assigned_route_id`) REFERENCES `routes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 5. Route Stops Table
-- Normalized stop details linked to Routes
-- --------------------------------------------------------
CREATE TABLE `route_stops` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `route_id` INT NOT NULL,
  `stop_name` VARCHAR(150) NOT NULL,
  `latitude` DECIMAL(10, 8) NOT NULL,
  `longitude` DECIMAL(11, 8) NOT NULL,
  `stop_order` INT NOT NULL,
  `scheduled_arrival` VARCHAR(20) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_route_stops_route` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 6. Trips Table
-- --------------------------------------------------------
CREATE TABLE `trips` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `trip_code` VARCHAR(50) NOT NULL UNIQUE,
  `bus_id` INT NOT NULL,
  `driver_id` INT NOT NULL,
  `route_id` INT NOT NULL,
  `start_time` VARCHAR(50) NULL,
  `end_time` VARCHAR(50) NULL,
  `status` ENUM('Scheduled', 'In Transit', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Scheduled',
  `passenger_count` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_trips_bus` FOREIGN KEY (`bus_id`) REFERENCES `buses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_trips_driver` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_trips_route` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 7. Tracking Table
-- Dynamic real-time bus coordinates and telemetry
-- --------------------------------------------------------
CREATE TABLE `tracking` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `bus_id` INT NOT NULL,
  `trip_id` INT NULL,
  `latitude` DECIMAL(10, 8) NOT NULL,
  `longitude` DECIMAL(11, 8) NOT NULL,
  `speed` DECIMAL(5, 2) DEFAULT 0.00,
  `current_stop` VARCHAR(150) NULL,
  `next_stop` VARCHAR(150) NULL,
  `eta_minutes` INT NULL,
  `is_live` TINYINT(1) DEFAULT 1,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_tracking_bus` FOREIGN KEY (`bus_id`) REFERENCES `buses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_tracking_trip` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 8. Complaints Table
-- --------------------------------------------------------
CREATE TABLE `complaints` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `bus_id` INT NULL,
  `route_id` INT NULL,
  `subject` VARCHAR(200) NOT NULL,
  `category` VARCHAR(100) NOT NULL DEFAULT 'General',
  `description` TEXT NOT NULL,
  `status` ENUM('Pending', 'In Progress', 'Resolved', 'Rejected') NOT NULL DEFAULT 'Pending',
  `priority` ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
  `admin_response` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_complaints_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_complaints_bus` FOREIGN KEY (`bus_id`) REFERENCES `buses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_complaints_route` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 9. Notices Table
-- Broadcast announcements
-- --------------------------------------------------------
CREATE TABLE `notices` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL,
  `message` TEXT NOT NULL,
  `type` VARCHAR(50) DEFAULT 'General Announcement',
  `target` VARCHAR(50) DEFAULT 'All Students',
  `created_by` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_notices_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 10. Maintenance Logs Table
-- Workshop maintenance tracking
-- --------------------------------------------------------
CREATE TABLE `maintenance_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `bus_id` INT NOT NULL,
  `issue_description` TEXT NOT NULL,
  `mechanic_notes` TEXT NULL,
  `mechanic` VARCHAR(100) DEFAULT 'Senior Technician',
  `estimated_cost` DECIMAL(10, 2) DEFAULT 0.00,
  `status` ENUM('In Maintenance', 'Resolved', 'Scheduled') NOT NULL DEFAULT 'In Maintenance',
  `sent_at` DATE NULL,
  `released_at` DATE NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_maint_bus` FOREIGN KEY (`bus_id`) REFERENCES `buses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
