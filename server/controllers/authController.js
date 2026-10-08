import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

// In-memory fallback dataset matching seed.sql
const FALLBACK_SEED_USERS = [
  {
    id: 1,
    student_id: null,
    name: 'Dr. Arthur Vance (Fleet Director)',
    email: 'admin@smartbus.edu',
    password_hash: '$2a$10$7edE.6ulT02IgyLrzC.mQe9pu2ThuQP3nZYQUpD4KBvk4FCgOm1TK', // admin123
    role: 'admin',
    phone: '+91 94141 00000',
    department: 'Transport Operations Control',
    year: 'N/A',
    digital_pass_id: null,
  },
  {
    id: 2,
    student_id: null,
    name: 'Ramesh Sharma',
    email: 'driver@smartbus.edu',
    password_hash: '$2a$10$.Cfm1BHiu8OWIPVRcT1vpee8fCeJ7folIzElVw0RuG4naWpNHgg5e', // driver123
    role: 'driver',
    phone: '+91 94140 67890',
    department: 'Fleet Driving Operations',
    year: 'N/A',
    digital_pass_id: null,
  },
  {
    id: 3,
    student_id: null,
    name: 'Sunil Verma',
    email: 'sunil@smartbus.edu',
    password_hash: '$2a$10$.Cfm1BHiu8OWIPVRcT1vpee8fCeJ7folIzElVw0RuG4naWpNHgg5e', // driver123
    role: 'driver',
    phone: '+91 98281 44321',
    department: 'Fleet Driving Operations',
    year: 'N/A',
    digital_pass_id: null,
  },
  {
    id: 4,
    student_id: 'STU-2026-001',
    name: 'Alex Johnson',
    email: 'student@smartbus.edu',
    password_hash: '$2a$10$AcX74WTxMMqD1YYsNSKcNeYn/DWjdQ9Y0E54qZl0NRa.NhpneWBiu', // student123
    role: 'student',
    phone: '+91 98290 12345',
    department: 'Computer Science & Engineering',
    year: '3rd Year',
    digital_pass_id: 'SB-STU-2026-001',
  },
  {
    id: 5,
    student_id: 'STU-2026-002',
    name: 'Priya Sharma',
    email: 'priya@smartbus.edu',
    password_hash: '$2a$10$AcX74WTxMMqD1YYsNSKcNeYn/DWjdQ9Y0E54qZl0NRa.NhpneWBiu', // student123
    role: 'student',
    phone: '+91 98291 99887',
    department: 'Electrical Engineering',
    year: '2nd Year',
    digital_pass_id: 'SB-STU-2026-002',
  },
];

let inMemoryUsers = [...FALLBACK_SEED_USERS];

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const generateDigitalPassId = (yearStr = '') => {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  return `SB-STU-${year}-${randomSuffix}`;
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new student account
 * @access  Public (Role is strictly locked to 'student')
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, student_id, phone, department, year } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Registration failed. Full name is required.',
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Registration failed. Email address is required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Registration failed. Please enter a valid email address format.',
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Registration failed. Password must be at least 6 characters in length.',
      });
    }

    const normalizedStudentId = student_id ? student_id.trim().toUpperCase() : null;

    let emailExists = false;
    let idExists = false;
    let usedDatabase = false;
    let newUserId = null;

    try {
      // 1. Try MySQL Database query
      const [existingEmailRows] = await pool.query(
        'SELECT id FROM users WHERE LOWER(email) = ?',
        [normalizedEmail]
      );
      emailExists = existingEmailRows.length > 0;

      if (!emailExists && normalizedStudentId) {
        const [existingIdRows] = await pool.query(
          'SELECT id FROM users WHERE UPPER(student_id) = ?',
          [normalizedStudentId]
        );
        idExists = existingIdRows.length > 0;
      }

      usedDatabase = true;
    } catch (dbErr) {
      // Fallback to in-memory store if DB is offline
      emailExists = inMemoryUsers.some((u) => u.email.toLowerCase() === normalizedEmail);
      if (!emailExists && normalizedStudentId) {
        idExists = inMemoryUsers.some((u) => u.student_id && u.student_id.toUpperCase() === normalizedStudentId);
      }
    }

    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists. Please sign in.',
      });
    }

    if (idExists) {
      return res.status(409).json({
        success: false,
        message: 'This Student ID is already registered in the system.',
      });
    }

    // Hash password with bcrypt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const digitalPassId = generateDigitalPassId(year);

    if (usedDatabase) {
      const [result] = await pool.query(
        `INSERT INTO users (name, email, password_hash, role, student_id, phone, department, year, digital_pass_id)
         VALUES (?, ?, ?, 'student', ?, ?, ?, ?, ?)`,
        [
          name.trim(),
          normalizedEmail,
          passwordHash,
          normalizedStudentId,
          phone ? phone.trim() : null,
          department ? department.trim() : null,
          year ? year.trim() : null,
          digitalPassId,
        ]
      );
      newUserId = result.insertId;
    } else {
      newUserId = inMemoryUsers.length + 100;
      const newUserObj = {
        id: newUserId,
        student_id: normalizedStudentId,
        name: name.trim(),
        email: normalizedEmail,
        password_hash: passwordHash,
        role: 'student',
        phone: phone ? phone.trim() : null,
        department: department ? department.trim() : null,
        year: year ? year.trim() : null,
        digital_pass_id: digitalPassId,
      };
      inMemoryUsers.push(newUserObj);
    }

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Student account created.',
      user: {
        id: newUserId,
        name: name.trim(),
        email: normalizedEmail,
        role: 'student',
        student_id: normalizedStudentId,
        phone: phone ? phone.trim() : null,
        department: department ? department.trim() : null,
        year: year ? year.trim() : null,
        digital_pass_id: digitalPassId,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & return JWT token
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !email.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: 'Login failed. Both email and password are required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let user = null;

    try {
      const [rows] = await pool.query(
        'SELECT id, name, email, password_hash, role, student_id, phone, department, year, digital_pass_id FROM users WHERE LOWER(email) = ?',
        [normalizedEmail]
      );
      if (rows.length > 0) {
        user = rows[0];
      }
    } catch (dbErr) {
      user = inMemoryUsers.find((u) => u.email.toLowerCase() === normalizedEmail) || null;
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your email and password.',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your email and password.',
      });
    }

    const jwtSecret = process.env.JWT_SECRET || 'smartbus_development_jwt_secret_key_2026';
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const token = jwt.sign(payload, jwtSecret, { expiresIn: '24h' });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        student_id: user.student_id,
        phone: user.phone,
        department: user.department,
        year: user.year,
        digital_pass_id: user.digital_pass_id,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user profile
 * @access  Private (JWT protected)
 */
export const getMe = async (req, res, next) => {
  try {
    const userId = req.user.id;
    let userRecord = null;

    try {
      const [rows] = await pool.query(
        'SELECT id, student_id, name, email, role, phone, department, year, digital_pass_id, created_at, updated_at FROM users WHERE id = ?',
        [userId]
      );
      if (rows.length > 0) {
        userRecord = rows[0];
      }
    } catch (dbErr) {
      const found = inMemoryUsers.find((u) => u.id === userId);
      if (found) {
        const { password_hash, ...safeUser } = found;
        userRecord = safeUser;
      }
    }

    if (!userRecord) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
      });
    }

    return res.status(200).json({
      success: true,
      user: userRecord,
    });
  } catch (error) {
    next(error);
  }
};
