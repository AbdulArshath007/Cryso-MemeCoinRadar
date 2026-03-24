process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection (ignored to prevent crash):', reason);
});

require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const telegramService = require('./telegramService');
const redditService = require('./redditService');
const socialAggregator = require('./socialAggregator');
const dbStorage = require('./dbStorage');

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const JWT_SECRET = process.env.JWT_SECRET || 'cryso-secret-key-2024';

// Initialize Database
async function initDB() {
  try {
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      )
    `);

    // Social Stats table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS social_stats (
        id SERIAL PRIMARY KEY,
        coin_ticker VARCHAR(10) NOT NULL,
        score INTEGER NOT NULL,
        mentions INTEGER NOT NULL,
        phase VARCHAR(50) NOT NULL,
        sentiment INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const result = await pool.query('SELECT * FROM users WHERE username = $1', ['arshawww']);
    if (result.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('123456', 10);
      await pool.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)',
        ['arshawww', 'arshawww@cryso.io', hashedPassword]
      );
      console.log('✅ Demo user created');
    }

    console.log('✅ Database initialized with all tables');
  } catch (error) {
    console.error('❌ DB init error:', error.message);
  }
}

initDB();

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const existing = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, hashedPassword]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Verify Token
app.post('/api/auth/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await pool.query(
      'SELECT id, username, email FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({ valid: true, user: result.rows[0] });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date(), telegram: telegramService.isConnected(), reddit: redditService.getStats().connected });
});

// ── Social Live Data Endpoints (Telegram + Reddit) ────────────────────────────────

// Live coin stats: scores, mentions, phases, ppm, sentiment
app.get('/api/social/stats', (req, res) => {
  res.json(socialAggregator.getStats());
});

// Recent spike/alert triggers (Telegram only for now, Reddit optional later)
app.get('/api/social/alerts', (req, res) => {
  res.json(telegramService.getAlerts());
});

// Connection status
app.get('/api/social/status', (req, res) => {
  res.json({
    telegramConnected: telegramService.isConnected(),
    redditConnected: redditService.getStats().connected,
    message: telegramService.isConnected() || redditService.getStats().connected
      ? '✅ Live social data streaming'
      : '⚠️ Connect a service to activate live data',
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  // Connect both platforms after server starts
  await telegramService.connect();
  await redditService.connect();
  
  // Start the NeonDB persistence loop (every 1 minute)
  dbStorage.start(pool, 60000);
});