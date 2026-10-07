const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

const db = require('./config/db');
const issuesRouter = require('./routes/issues');
const aiRouter = require('./routes/ai');
const authRouter = require('./routes/auth');
const statsRouter = require('./routes/stats');

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Civic Lens Node.js Express REST API',
    db_type: db.getDbType(),
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Civic Lens Node.js Express REST API',
    db_type: db.getDbType(),
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/issues', issuesRouter);
app.use('/api/v1/complaints', issuesRouter);

app.use('/api/ai', aiRouter);
app.use('/api/v1/ai', aiRouter);

app.use('/api/auth', authRouter);
app.use('/api/v1/auth', authRouter);

app.use('/api/stats', statsRouter);
app.use('/api/v1/stats', statsRouter);

// Serve Static Frontend Files from Root Directory
const frontendRoot = path.resolve(__dirname, '../');
app.use('/css', express.static(path.join(frontendRoot, 'css')));
app.use('/js', express.static(path.join(frontendRoot, 'js')));
if (require('fs').existsSync(path.join(frontendRoot, 'assets'))) {
  app.use('/assets', express.static(path.join(frontendRoot, 'assets')));
}

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendRoot, 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Express Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 Civic Lens Node.js Express Backend running at http://localhost:${PORT}`);
  console.log(`📡 REST API active on http://localhost:${PORT}/api/issues`);
});
