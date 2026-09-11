const express = require('express');
const db = require('../db/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

function parseClaim(row) {
  if (!row) return null;
  return {
    ...row,
    ai_analysis: row.ai_analysis ? JSON.parse(row.ai_analysis) : null,
    cross_check: row.cross_check ? JSON.parse(row.cross_check) : null,
  };
}

router.use(authenticate, authorize('admin'));

// Admin dashboard stats
router.get('/dashboard', (req, res) => {
  const stats = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'under_review' THEN 1 ELSE 0 END) as under_review,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
      SUM(CASE WHEN json_extract(cross_check, '$.status') = 'Discrepancy Detected' THEN 1 ELSE 0 END) as discrepancy
    FROM claims
  `).get();

  const recent = db.prepare(`
    SELECT c.id, c.vehicle_number, c.status, c.created_at, u.name as user_name,
      json_extract(c.cross_check, '$.status') as cross_check_status
    FROM claims c JOIN users u ON c.user_id = u.id
    ORDER BY c.created_at DESC LIMIT 10
  `).all();

  const monthly = db.prepare(`
    SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
    FROM claims GROUP BY month ORDER BY month DESC LIMIT 6
  `).all();

  res.json({ stats, recentClaims: recent, monthlyTrend: monthly.reverse() });
});

// All claims with filters
router.get('/claims', (req, res) => {
  const { status, date_from, date_to, search } = req.query;
  let query = `
    SELECT c.*, u.name as user_name, u.email as user_email
    FROM claims c JOIN users u ON c.user_id = u.id WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ' AND c.status = ?';
    params.push(status);
  }
  if (date_from) {
    query += ' AND date(c.created_at) >= date(?)';
    params.push(date_from);
  }
  if (date_to) {
    query += ' AND date(c.created_at) <= date(?)';
    params.push(date_to);
  }
  if (search) {
    query += ' AND (c.vehicle_number LIKE ? OR u.name LIKE ? OR u.email LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  query += ' ORDER BY c.created_at DESC';

  const rows = db.prepare(query).all(...params);
  const claims = rows.map((row) => {
    const claim = parseClaim(row);
    return {
      id: claim.id,
      vehicle_number: claim.vehicle_number,
      claimed_damage: claim.claimed_damage,
      status: claim.status,
      created_at: claim.created_at,
      updated_at: claim.updated_at,
      user_name: row.user_name,
      user_email: row.user_email,
      repair_cost: claim.ai_analysis?.estimatedRepairCost || null,
      cross_check_status: claim.cross_check?.status || null,
    };
  });

  res.json({ claims });
});

// Update claim status and remarks
router.patch('/claims/:id', (req, res) => {
  const { status, admin_remarks } = req.body;
  const validStatuses = ['pending', 'under_review', 'approved', 'rejected'];

  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value.' });
  }

  const existing = db.prepare('SELECT id FROM claims WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Claim not found.' });

  const updates = [];
  const params = [];

  if (status) {
    updates.push('status = ?');
    params.push(status);
  }
  if (admin_remarks !== undefined) {
    updates.push('admin_remarks = ?');
    params.push(admin_remarks);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update.' });
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(req.params.id);

  db.prepare(`UPDATE claims SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  const claim = parseClaim(db.prepare(`
    SELECT c.*, u.name as user_name, u.email as user_email
    FROM claims c JOIN users u ON c.user_id = u.id WHERE c.id = ?
  `).get(req.params.id));

  const photos = db.prepare('SELECT * FROM claim_photos WHERE claim_id = ?').all(claim.id);
  claim.photos = photos;
  claim.policyholder = { name: claim.user_name, email: claim.user_email };

  res.json({ message: 'Claim updated successfully.', claim });
});

module.exports = router;
