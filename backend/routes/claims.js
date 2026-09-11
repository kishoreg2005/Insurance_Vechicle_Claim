const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db/database');
const { authenticate, authorize } = require('../middleware/auth');
const { analyzeVehicleDamage } = require('../services/aiAnalysis');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    cb(ext && mime ? null : new Error('Only image files are allowed.'), ext && mime);
  },
});

function parseClaim(row) {
  if (!row) return null;
  return {
    ...row,
    ai_analysis: row.ai_analysis ? JSON.parse(row.ai_analysis) : null,
    cross_check: row.cross_check ? JSON.parse(row.cross_check) : null,
  };
}

function getPhotos(claimId) {
  return db.prepare('SELECT * FROM claim_photos WHERE claim_id = ?').all(claimId);
}

// User dashboard stats
router.get('/dashboard', authenticate, authorize('user'), (req, res) => {
  const stats = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'under_review' THEN 1 ELSE 0 END) as under_review,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
    FROM claims WHERE user_id = ?
  `).get(req.user.id);

  const recent = db.prepare(`
    SELECT id, vehicle_number, status, created_at,
      json_extract(ai_analysis, '$.estimatedRepairCost') as repair_cost
    FROM claims WHERE user_id = ? ORDER BY created_at DESC LIMIT 5
  `).all(req.user.id);

  res.json({ stats, recentClaims: recent });
});

// Submit new claim
router.post('/', authenticate, authorize('user'), upload.array('photos', 10), async (req, res) => {
  try {
    const { vehicle_number, claimed_damage } = req.body;

    if (!vehicle_number || !claimed_damage) {
      return res.status(400).json({ error: 'Vehicle number and damage details are required.' });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'At least one photo is required.' });
    }

    const insertClaim = db.prepare(`
      INSERT INTO claims (user_id, vehicle_number, claimed_damage, status)
      VALUES (?, ?, ?, 'pending')
    `);
    const result = insertClaim.run(req.user.id, vehicle_number.toUpperCase(), claimed_damage);

    const insertPhoto = db.prepare(
      'INSERT INTO claim_photos (claim_id, filename, original_name) VALUES (?, ?, ?)'
    );
    for (const file of req.files) {
      insertPhoto.run(result.lastInsertRowid, file.filename, file.originalname);
    }

    const aiResult = await analyzeVehicleDamage(claimed_damage, req.files.length);

    db.prepare(`
      UPDATE claims SET ai_analysis = ?, cross_check = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(JSON.stringify(aiResult), JSON.stringify(aiResult.crossCheck), result.lastInsertRowid);

    const claim = parseClaim(db.prepare('SELECT * FROM claims WHERE id = ?').get(result.lastInsertRowid));
    claim.photos = getPhotos(claim.id);

    res.status(201).json({ message: 'Claim submitted and AI analysis complete.', claim });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process claim.' });
  }
});

// User claim history
router.get('/', authenticate, authorize('user'), (req, res) => {
  const claims = db.prepare(`
    SELECT id, vehicle_number, claimed_damage, status, created_at, updated_at,
      json_extract(ai_analysis, '$.estimatedRepairCost') as repair_cost,
      json_extract(cross_check, '$.status') as cross_check_status
    FROM claims WHERE user_id = ? ORDER BY created_at DESC
  `).all(req.user.id);

  res.json({ claims });
});

// Single claim detail
router.get('/:id', authenticate, (req, res) => {
  const claim = parseClaim(db.prepare('SELECT * FROM claims WHERE id = ?').get(req.params.id));
  if (!claim) return res.status(404).json({ error: 'Claim not found.' });

  if (req.user.role === 'user' && claim.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  claim.photos = getPhotos(claim.id);

  if (req.user.role === 'admin') {
    const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(claim.user_id);
    claim.policyholder = user;
  }

  res.json({ claim });
});

// Download report data
router.get('/:id/report', authenticate, (req, res) => {
  const claim = parseClaim(db.prepare('SELECT * FROM claims WHERE id = ?').get(req.params.id));
  if (!claim) return res.status(404).json({ error: 'Claim not found.' });

  if (req.user.role === 'user' && claim.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const user = db.prepare('SELECT name, email FROM users WHERE id = ?').get(claim.user_id);
  claim.photos = getPhotos(claim.id);

  res.json({
    report: {
      reportId: `SCR-${claim.id.toString().padStart(6, '0')}`,
      generatedAt: new Date().toISOString(),
      policyholder: user,
      claim,
    },
  });
});

module.exports = router;
