require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const claimRoutes = require('./routes/claims');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

app.use('/api/auth', authRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'SecureClaim AI API' });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error.' });
});

// Seed admin on startup
require('./db/seed');

app.listen(PORT, () => {
  console.log(`🚀 SecureClaim AI API running on http://localhost:${PORT}`);
});
