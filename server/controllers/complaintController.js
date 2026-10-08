import pool from '../config/db.js';
import { inMemoryComplaints } from '../config/inMemoryStore.js';

let nextComplaintId = 10;
const VALID_COMPLAINT_STATUSES = ['Pending', 'In Progress', 'Resolved', 'Rejected'];
const VALID_PRIORITIES = ['Low', 'Medium', 'High'];

const COMPLAINT_JOIN_SQL = `
  SELECT 
    c.id, c.user_id, c.bus_id, c.route_id, c.subject, c.category, c.description, 
    c.status, c.priority, c.admin_response, c.created_at, c.updated_at,
    u.name AS student_name, u.email AS student_email, u.student_id,
    b.bus_number, r.route_code, r.name AS route_name
  FROM complaints c
  JOIN users u ON c.user_id = u.id
  LEFT JOIN buses b ON c.bus_id = b.id
  LEFT JOIN routes r ON c.route_id = r.id
`;

/**
 * @route   POST /api/complaints
 * @desc    File a student complaint/grievance ticket
 * @access  Private (Authenticated users)
 */
export const createComplaint = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { bus_id, route_id, subject, category, description, priority } = req.body;

    if (!subject || !subject.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: 'Complaint creation failed. subject is required.',
      });
    }

    if (!description || !description.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: 'Complaint creation failed. description is required.',
      });
    }

    const trimmedSubject = subject.toString().trim();
    const trimmedDesc = description.toString().trim();
    const complaintCategory = category ? category.toString().trim() : 'General';
    const complaintPriority = priority && VALID_PRIORITIES.includes(priority.trim()) ? priority.trim() : 'Medium';

    const targetBusId = bus_id !== undefined && bus_id !== null ? parseInt(bus_id, 10) : null;
    const targetRouteId = route_id !== undefined && route_id !== null ? parseInt(route_id, 10) : null;

    let usedDb = false;

    try {
      if (targetBusId) {
        const [busRows] = await pool.query('SELECT id FROM buses WHERE id = ?', [targetBusId]);
        if (busRows.length === 0) {
          return res.status(400).json({
            success: false,
            message: `Bus ID ${targetBusId} not found.`,
          });
        }
      }

      if (targetRouteId) {
        const [routeRows] = await pool.query('SELECT id FROM routes WHERE id = ?', [targetRouteId]);
        if (routeRows.length === 0) {
          return res.status(400).json({
            success: false,
            message: `Route ID ${targetRouteId} not found.`,
          });
        }
      }

      const [insertResult] = await pool.query(
        `INSERT INTO complaints (user_id, bus_id, route_id, subject, category, description, status, priority)
         VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?)`,
        [userId, targetBusId, targetRouteId, trimmedSubject, complaintCategory, trimmedDesc, complaintPriority]
      );

      const newId = insertResult.insertId;
      usedDb = true;

      const [newComplaintRows] = await pool.query(`${COMPLAINT_JOIN_SQL} WHERE c.id = ?`, [newId]);
      return res.status(201).json({
        success: true,
        message: 'Complaint submitted successfully.',
        data: newComplaintRows[0],
      });
    } catch (dbErr) {
      if (usedDb) throw dbErr;

      const newObj = {
        id: nextComplaintId++,
        user_id: userId,
        bus_id: targetBusId,
        route_id: targetRouteId,
        subject: trimmedSubject,
        category: complaintCategory,
        description: trimmedDesc,
        status: 'Pending',
        priority: complaintPriority,
        admin_response: null,
        student_name: req.user.name || 'Student User',
        student_email: req.user.email || 'student@smartbus.edu',
        bus_number: targetBusId ? `BUS-${targetBusId}` : null,
        route_code: targetRouteId ? `R-0${targetRouteId}` : null,
      };
      inMemoryComplaints.push(newObj);

      return res.status(201).json({
        success: true,
        message: 'Complaint submitted successfully.',
        data: newObj,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/complaints
 * @desc    Get complaints list with role isolation
 * @access  Private (Authenticated users)
 */
export const getAllComplaints = async (req, res, next) => {
  try {
    const { user } = req;

    try {
      let querySql = `${COMPLAINT_JOIN_SQL}`;
      let params = [];

      if (user.role === 'student') {
        querySql += ' WHERE c.user_id = ?';
        params.push(user.id);
      }

      querySql += ' ORDER BY c.id DESC';

      const [rows] = await pool.query(querySql, params);
      return res.status(200).json({
        success: true,
        data: rows,
      });
    } catch (dbErr) {
      let filtered = [...inMemoryComplaints];
      if (user.role === 'student') {
        filtered = filtered.filter((c) => c.user_id === user.id);
      }
      return res.status(200).json({
        success: true,
        data: filtered,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/complaints/:id
 * @desc    Get single complaint details
 * @access  Private (Authenticated users with ownership check)
 */
export const getComplaintById = async (req, res, next) => {
  try {
    const complaintId = parseInt(req.params.id, 10);
    if (isNaN(complaintId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid complaint ID format.',
      });
    }

    const { user } = req;

    try {
      const [rows] = await pool.query(`${COMPLAINT_JOIN_SQL} WHERE c.id = ?`, [complaintId]);
      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Complaint with ID ${complaintId} not found.`,
        });
      }

      const complaint = rows[0];

      if (user.role === 'student' && complaint.user_id !== user.id) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden. You do not have permission to view this complaint.',
        });
      }

      return res.status(200).json({
        success: true,
        data: complaint,
      });
    } catch (dbErr) {
      const complaint = inMemoryComplaints.find((c) => c.id === complaintId);
      if (!complaint) {
        return res.status(404).json({
          success: false,
          message: `Complaint with ID ${complaintId} not found.`,
        });
      }

      if (user.role === 'student' && complaint.user_id !== user.id) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden. You do not have permission to view this complaint.',
        });
      }

      return res.status(200).json({
        success: true,
        data: complaint,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/complaints/:id
 * @desc    Update complaint status/priority/response
 * @access  Private (Admin only)
 */
export const updateComplaint = async (req, res, next) => {
  try {
    const complaintId = parseInt(req.params.id, 10);
    if (isNaN(complaintId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid complaint ID format.',
      });
    }

    const { status, priority, admin_response } = req.body;

    let existing = null;
    let usedDb = false;

    try {
      const [rows] = await pool.query('SELECT * FROM complaints WHERE id = ?', [complaintId]);
      if (rows.length > 0) {
        existing = rows[0];
        usedDb = true;
      }
    } catch (dbErr) {
      existing = inMemoryComplaints.find((c) => c.id === complaintId) || null;
    }

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Complaint with ID ${complaintId} not found.`,
      });
    }

    const updatedStatus = status !== undefined ? status.toString().trim() : existing.status;
    const updatedPriority = priority !== undefined ? priority.toString().trim() : existing.priority;
    const updatedResponse = admin_response !== undefined ? (admin_response ? admin_response.toString().trim() : null) : existing.admin_response;

    if (updatedStatus && !VALID_COMPLAINT_STATUSES.includes(updatedStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${VALID_COMPLAINT_STATUSES.join(', ')}`,
      });
    }

    if (updatedPriority && !VALID_PRIORITIES.includes(updatedPriority)) {
      return res.status(400).json({
        success: false,
        message: `Invalid priority. Allowed: ${VALID_PRIORITIES.join(', ')}`,
      });
    }

    if (usedDb) {
      await pool.query(
        `UPDATE complaints
         SET status = ?, priority = ?, admin_response = ?
         WHERE id = ?`,
        [updatedStatus, updatedPriority, updatedResponse, complaintId]
      );
      const [updatedRows] = await pool.query(`${COMPLAINT_JOIN_SQL} WHERE c.id = ?`, [complaintId]);

      return res.status(200).json({
        success: true,
        message: 'Complaint updated successfully.',
        data: updatedRows[0],
      });
    } else {
      existing.status = updatedStatus;
      existing.priority = updatedPriority;
      existing.admin_response = updatedResponse;

      return res.status(200).json({
        success: true,
        message: 'Complaint updated successfully.',
        data: existing,
      });
    }
  } catch (error) {
    next(error);
  }
};
