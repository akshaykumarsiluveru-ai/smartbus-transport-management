import pool from '../config/db.js';
import { inMemoryNotices } from '../config/inMemoryStore.js';

let nextNoticeId = 10;

const NOTICE_JOIN_SQL = `
  SELECT 
    n.id, n.title, n.message, n.type, n.target, n.created_by, n.created_at, n.updated_at,
    u.name AS creator_name, u.email AS creator_email
  FROM notices n
  LEFT JOIN users u ON n.created_by = u.id
`;

/**
 * @route   GET /api/notices
 * @desc    Get broadcast notices list
 * @access  Private (Authenticated users)
 */
export const getAllNotices = async (req, res, next) => {
  try {
    try {
      const [rows] = await pool.query(`${NOTICE_JOIN_SQL} ORDER BY n.id DESC`);
      return res.status(200).json({
        success: true,
        data: rows,
      });
    } catch (dbErr) {
      return res.status(200).json({
        success: true,
        data: inMemoryNotices,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/notices/:id
 * @desc    Get single notice by ID
 * @access  Private (Authenticated users)
 */
export const getNoticeById = async (req, res, next) => {
  try {
    const noticeId = parseInt(req.params.id, 10);
    if (isNaN(noticeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notice ID format.',
      });
    }

    try {
      const [rows] = await pool.query(`${NOTICE_JOIN_SQL} WHERE n.id = ?`, [noticeId]);
      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Notice with ID ${noticeId} not found.`,
        });
      }
      return res.status(200).json({
        success: true,
        data: rows[0],
      });
    } catch (dbErr) {
      const notice = inMemoryNotices.find((n) => n.id === noticeId);
      if (!notice) {
        return res.status(404).json({
          success: false,
          message: `Notice with ID ${noticeId} not found.`,
        });
      }
      return res.status(200).json({
        success: true,
        data: notice,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/notices
 * @desc    Create a new campus notice (Admin only)
 * @access  Private (Admin only)
 */
export const createNotice = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { title, message, type, target } = req.body;

    if (!title || !title.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: 'Notice creation failed. title is required.',
      });
    }

    if (!message || !message.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: 'Notice creation failed. message is required.',
      });
    }

    const trimmedTitle = title.toString().trim();
    const trimmedMessage = message.toString().trim();
    const noticeType = type ? type.toString().trim() : 'General Announcement';
    const noticeTarget = target ? target.toString().trim() : 'All Students';

    let usedDb = false;

    try {
      const [insertResult] = await pool.query(
        `INSERT INTO notices (title, message, type, target, created_by)
         VALUES (?, ?, ?, ?, ?)`,
        [trimmedTitle, trimmedMessage, noticeType, noticeTarget, userId]
      );
      const newNoticeId = insertResult.insertId;
      usedDb = true;

      const [newRows] = await pool.query(`${NOTICE_JOIN_SQL} WHERE n.id = ?`, [newNoticeId]);
      return res.status(201).json({
        success: true,
        message: 'Notice broadcasted successfully.',
        data: newRows[0],
      });
    } catch (dbErr) {
      if (usedDb) throw dbErr;

      const newNoticeObj = {
        id: nextNoticeId++,
        title: trimmedTitle,
        message: trimmedMessage,
        type: noticeType,
        target: noticeTarget,
        created_by: userId,
        creator_name: req.user.name || 'Admin',
        created_at: new Date().toISOString(),
      };
      inMemoryNotices.push(newNoticeObj);

      return res.status(201).json({
        success: true,
        message: 'Notice broadcasted successfully.',
        data: newNoticeObj,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/notices/:id
 * @desc    Update an existing notice (Admin only)
 * @access  Private (Admin only)
 */
export const updateNotice = async (req, res, next) => {
  try {
    const noticeId = parseInt(req.params.id, 10);
    if (isNaN(noticeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notice ID format.',
      });
    }

    const { title, message, type, target } = req.body;

    let existing = null;
    let usedDb = false;

    try {
      const [rows] = await pool.query('SELECT * FROM notices WHERE id = ?', [noticeId]);
      if (rows.length > 0) {
        existing = rows[0];
        usedDb = true;
      }
    } catch (dbErr) {
      existing = inMemoryNotices.find((n) => n.id === noticeId) || null;
    }

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Notice with ID ${noticeId} not found.`,
      });
    }

    const updatedTitle = title !== undefined ? title.toString().trim() : existing.title;
    const updatedMsg = message !== undefined ? message.toString().trim() : existing.message;
    const updatedType = type !== undefined ? type.toString().trim() : existing.type;
    const updatedTarget = target !== undefined ? target.toString().trim() : existing.target;

    if (usedDb) {
      await pool.query(
        `UPDATE notices
         SET title = ?, message = ?, type = ?, target = ?
         WHERE id = ?`,
        [updatedTitle, updatedMsg, updatedType, updatedTarget, noticeId]
      );

      const [updatedRows] = await pool.query(`${NOTICE_JOIN_SQL} WHERE n.id = ?`, [noticeId]);
      return res.status(200).json({
        success: true,
        message: 'Notice updated successfully.',
        data: updatedRows[0],
      });
    } else {
      existing.title = updatedTitle;
      existing.message = updatedMsg;
      existing.type = updatedType;
      existing.target = updatedTarget;

      return res.status(200).json({
        success: true,
        message: 'Notice updated successfully.',
        data: existing,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/notices/:id
 * @desc    Delete a notice (Admin only)
 * @access  Private (Admin only)
 */
export const deleteNotice = async (req, res, next) => {
  try {
    const noticeId = parseInt(req.params.id, 10);
    if (isNaN(noticeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notice ID format.',
      });
    }

    let noticeExists = false;
    let usedDb = false;

    try {
      const [rows] = await pool.query('SELECT id FROM notices WHERE id = ?', [noticeId]);
      noticeExists = rows.length > 0;
      usedDb = true;
    } catch (dbErr) {
      noticeExists = inMemoryNotices.some((n) => n.id === noticeId);
    }

    if (!noticeExists) {
      return res.status(404).json({
        success: false,
        message: `Notice with ID ${noticeId} not found.`,
      });
    }

    if (usedDb) {
      await pool.query('DELETE FROM notices WHERE id = ?', [noticeId]);
    } else {
      const idx = inMemoryNotices.findIndex((n) => n.id === noticeId);
      if (idx !== -1) inMemoryNotices.splice(idx, 1);
    }

    return res.status(200).json({
      success: true,
      message: `Notice with ID ${noticeId} deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
};
