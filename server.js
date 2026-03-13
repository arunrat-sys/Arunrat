// ===========================================
// server.js - Express Server สำหรับ Todo List App
// ใช้ PostgreSQL เก็บข้อมูลถาวร (Railway)
// ===========================================

require('dotenv').config(); // โหลดค่าจากไฟล์ .env

const express = require('express');
const path = require('path');
const { Pool } = require('pg');

// สร้าง Express application
const app = express();

// กำหนด port จาก environment variable หรือใช้ 3000 เป็นค่าเริ่มต้น
const PORT = process.env.PORT || 3000;

// ===========================================
// เชื่อมต่อ PostgreSQL (Railway)
// ===========================================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // จำเป็นสำหรับ Railway
});

// สร้างตาราง todos ถ้ายังไม่มี (รันตอน server เริ่มต้น)
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      text VARCHAR(255) NOT NULL,
      done BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log('Database connected & todos table ready');
}

// ===========================================
// Middleware
// ===========================================

// Parse JSON body (รับข้อมูลจาก client)
app.use(express.json());

// Serve static files จากโฟลเดอร์ public
app.use(express.static(path.join(__dirname, 'public')));

// ===========================================
// Helper: parse id จาก params
// ===========================================
function parseId(params) {
  return parseInt(params.id, 10);
}

// ===========================================
// API Routes
// ===========================================

// GET /api/todos - ดึงรายการ todo ทั้งหมด
app.get('/api/todos', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, text, done, created_at AS "createdAt" FROM todos ORDER BY id ASC'
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/todos - เพิ่ม todo ใหม่
// Body: { text: "string" }
app.post('/api/todos', async (req, res, next) => {
  try {
    const { text } = req.body;

    // ตรวจสอบว่า text ต้องเป็น string ที่ไม่ว่างเปล่า
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({
        error: 'Validation failed',
        message: '"text" is required and must be a non-empty string'
      });
    }

    // INSERT ลง database แล้วคืนข้อมูลที่สร้าง
    const result = await pool.query(
      'INSERT INTO todos (text) VALUES ($1) RETURNING id, text, done, created_at AS "createdAt"',
      [text.trim()]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/todos/:id - toggle done/undone
// ใช้ NOT done เพื่อสลับค่าใน database โดยตรง
app.put('/api/todos/:id', async (req, res, next) => {
  try {
    const id = parseId(req.params);

    if (isNaN(id)) {
      return res.status(400).json({
        error: 'Invalid ID',
        message: 'ID must be a valid number'
      });
    }

    // Toggle done ใน SQL โดยตรง (NOT done)
    const result = await pool.query(
      'UPDATE todos SET done = NOT done WHERE id = $1 RETURNING id, text, done, created_at AS "createdAt"',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not found',
        message: `Todo with id ${id} not found`
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/todos/:id - ลบ todo
app.delete('/api/todos/:id', async (req, res, next) => {
  try {
    const id = parseId(req.params);

    if (isNaN(id)) {
      return res.status(400).json({
        error: 'Invalid ID',
        message: 'ID must be a valid number'
      });
    }

    // ลบแล้วคืนข้อมูลที่ถูกลบ
    const result = await pool.query(
      'DELETE FROM todos WHERE id = $1 RETURNING id, text, done, created_at AS "createdAt"',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not found',
        message: `Todo with id ${id} not found`
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// ===========================================
// 404 Handler - สำหรับ API route ที่ไม่มีอยู่
// ===========================================
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.originalUrl} does not exist`
  });
});

// ===========================================
// Global Error Handler
// ===========================================
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Bad request',
      message: 'Invalid JSON in request body'
    });
  }

  console.error('Unexpected error:', err.message);
  res.status(500).json({
    error: 'Internal server error',
    message: 'Something went wrong'
  });
});

// ===========================================
// เริ่มต้น Server - เชื่อม DB ก่อน แล้วค่อยรัน
// ===========================================
initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Todo List server is running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to connect to database:', err.message);
    process.exit(1);
  });
