// ===========================================
// app.js - Client-side JavaScript สำหรับ Todo List
// ใช้ fetch() ล้วน ไม่พึ่ง library ใดๆ
// ===========================================

// Base URL ของ REST API
const API_URL = '/api/todos';

// อ้างอิง DOM elements
const todoInput = document.getElementById('todo-input');
const addBtn = document.getElementById('add-btn');
const todoList = document.getElementById('todo-list');
const summary = document.getElementById('summary');

// ===========================================
// loadTodos() - GET /api/todos
// ดึงข้อมูลทั้งหมดจาก server แล้ว render ลงหน้าเว็บ
// ===========================================
async function loadTodos() {
  // เรียก API ดึงรายการ todos
  const res = await fetch(API_URL);
  const todos = await res.json();

  // ล้างรายการเดิมออก
  todoList.innerHTML = '';

  // กรณีไม่มี todo เลย - แสดงข้อความ
  if (todos.length === 0) {
    todoList.innerHTML = '<li class="empty-message">No tasks yet, add one! \u2728</li>';
  } else {
    // วน loop สร้าง <li> สำหรับแต่ละ todo
    todos.forEach(todo => {
      const li = document.createElement('li');
      li.className = 'todo-item' + (todo.done ? ' completed' : '');

      // Checkbox - กดเพื่อ toggle done/undone
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = todo.done;
      checkbox.addEventListener('change', () => toggleTodo(todo.id));

      // ข้อความของ task
      const span = document.createElement('span');
      span.textContent = todo.text;

      // ปุ่มลบ (x)
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn';
      deleteBtn.textContent = '\u2715';
      deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

      // ประกอบ elements เข้าด้วยกัน
      li.appendChild(checkbox);
      li.appendChild(span);
      li.appendChild(deleteBtn);
      todoList.appendChild(li);
    });
  }

  // อัพเดทจำนวน task ที่ยังไม่เสร็จ
  updateSummary(todos);
}

// ===========================================
// updateSummary() - อัพเดทข้อความสรุปด้านล่าง
// นับเฉพาะ task ที่ done === false
// ===========================================
function updateSummary(todos) {
  const remaining = todos.filter(t => !t.done).length;
  summary.textContent = '\u2764 ' + remaining + ' task' + (remaining !== 1 ? 's' : '') + ' remaining';
}

// ===========================================
// addTodo() - POST /api/todos
// เพิ่ม todo ใหม่ แล้ว reload รายการทั้งหมด
// ===========================================
async function addTodo() {
  const text = todoInput.value.trim();

  // ไม่ส่งถ้า input ว่าง
  if (!text) return;

  // ส่งข้อมูลไป server
  await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: text })
  });

  // ล้าง input แล้ว focus กลับ
  todoInput.value = '';
  todoInput.focus();

  // refresh รายการจาก server ใหม่ (พร้อม update จำนวน)
  await loadTodos();
}

// ===========================================
// toggleTodo(id) - PUT /api/todos/:id
// สลับสถานะ done/undone แล้ว reload รายการ
// ===========================================
async function toggleTodo(id) {
  await fetch(API_URL + '/' + id, {
    method: 'PUT'
  });

  // refresh รายการจาก server ใหม่ (พร้อม update จำนวน)
  await loadTodos();
}

// ===========================================
// deleteTodo(id) - DELETE /api/todos/:id
// ลบ todo แล้ว reload รายการ
// ===========================================
async function deleteTodo(id) {
  await fetch(API_URL + '/' + id, {
    method: 'DELETE'
  });

  // refresh รายการจาก server ใหม่ (พร้อม update จำนวน)
  await loadTodos();
}

// ===========================================
// Event Listeners
// ===========================================

// กดปุ่ม Add
addBtn.addEventListener('click', addTodo);

// กด Enter ใน input
todoInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') addTodo();
});

// ===========================================
// เริ่มต้น - โหลดรายการ todo ตอนเปิดหน้าเว็บ
// ===========================================
loadTodos();
