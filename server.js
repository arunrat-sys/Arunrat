// ===========================================
// server.js - Express Server สำหรับ Todo List App
// REST API พร้อม error handling
// ===========================================

const express = require('express');
const path = require('path');

// สร้าง Express application
const app = express();

// กำหนด port จาก environment variable หรือใช้ 3000 เป็นค่าเริ่มต้น
const PORT = process.env.PORT || 3000;

// ===========================================
// Middleware
// ===========================================

// Parse JSON body (รับข้อมูลจาก client)
app.use(express.json());

// Serve static files จากโฟลเดอร์ public
app.use(express.static(path.join(__dirname, 'public')));

// ===========================================
// In-memory storage สำหรับเก็บ todos
// (ในโปรเจกต์จริงควรใช้ database)
// ===========================================
let todos = [];
let nextId = 1; // ตัวนับ ID อัตโนมัติ

// ===========================================
// Helper: ค้นหา todo ด้วย id
// คืน { todo, index } หรือ null ถ้าไม่พบ
// ===========================================
function findTodoById(id) {
  const index = todos.findIndex(t => t.id === id);
  if (index === -1) return null;
  return { todo: todos[index], index };
}

// ===========================================
// Helper: parse id จาก params
// คืนตัวเลข หรือ NaN ถ้า format ไม่ถูก
// ===========================================
function parseId(params) {
  return parseInt(params.id, 10);
}

// ===========================================
// API Routes
// ===========================================

// GET /api/todos - ดึงรายการ todo ทั้งหมด
// Response: [{ id, text, done, createdAt }, ...]
app.get('/api/todos', (req, res) => {
  res.json(todos);
});

// POST /api/todos - เพิ่ม todo ใหม่
// Body: { text: "string" }
// Response: { id, text, done, createdAt }
app.post('/api/todos', (req, res) => {
  const { text } = req.body;

  // ตรวจสอบว่า text ต้องเป็น string ที่ไม่ว่างเปล่า
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return res.status(400).json({
      error: 'Validation failed',
      message: '"text" is required and must be a non-empty string'
    });
  }

  // สร้าง todo object ใหม่
  const todo = {
    id: nextId++,
    text: text.trim(),
    done: false,
    createdAt: new Date().toISOString()
  };

  todos.push(todo);

  // 201 Created - สร้างสำเร็จ
  res.status(201).json(todo);
});

// PUT /api/todos/:id - toggle done/undone
// ไม่ต้องส่ง body (server จะ toggle ค่า done ให้อัตโนมัติ)
// Response: { id, text, done, createdAt }
app.put('/api/todos/:id', (req, res) => {
  const id = parseId(req.params);

  // ตรวจสอบว่า id เป็นตัวเลขที่ถูกต้อง
  if (isNaN(id)) {
    return res.status(400).json({
      error: 'Invalid ID',
      message: 'ID must be a valid number'
    });
  }

  const found = findTodoById(id);

  // ถ้าไม่พบ todo
  if (!found) {
    return res.status(404).json({
      error: 'Not found',
      message: `Todo with id ${id} not found`
    });
  }

  // Toggle สถานะ done (สลับ true <-> false)
  found.todo.done = !found.todo.done;

  res.json(found.todo);
});

// DELETE /api/todos/:id - ลบ todo
// Response: { id, text, done, createdAt } (ข้อมูลที่ถูกลบ)
app.delete('/api/todos/:id', (req, res) => {
  const id = parseId(req.params);

  // ตรวจสอบว่า id เป็นตัวเลขที่ถูกต้อง
  if (isNaN(id)) {
    return res.status(400).json({
      error: 'Invalid ID',
      message: 'ID must be a valid number'
    });
  }

  const found = findTodoById(id);

  // ถ้าไม่พบ todo
  if (!found) {
    return res.status(404).json({
      error: 'Not found',
      message: `Todo with id ${id} not found`
    });
  }

  // ลบ todo ออกจาก array
  const deleted = todos.splice(found.index, 1)[0];
  res.json(deleted);
});

// ===========================================
// 404 Handler - สำหรับ route ที่ไม่มีอยู่
// ===========================================
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.originalUrl} does not exist`
  });
});

// ===========================================
// Global Error Handler - จัดการ error ทั้งหมด
// เช่น JSON parse error, unexpected errors
// ===========================================
app.use((err, req, res, next) => {
  // กรณี JSON body ผิด format
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Bad request',
      message: 'Invalid JSON in request body'
    });
  }

  // Error อื่นๆ ที่ไม่คาดคิด
  console.error('Unexpected error:', err.message);
  res.status(500).json({
    error: 'Internal server error',
    message: 'Something went wrong'
  });
});

// ===========================================
// เริ่มต้น Server
// ===========================================
app.listen(PORT, () => {
  console.log(`Todo List server is running on http://localhost:${PORT}`);
});
