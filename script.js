// Data Management
const db = {
  threads: [],
  users: {},
  currentUser: null,
  categories: ['ทั่วไป', 'เทคโนโลยี', 'ความบันเทิง', 'กีฬา', 'อื่นๆ']
};

// Initialize DB from localStorage
function initDB() {
  const saved = localStorage.getItem('forumDB');
  if (saved) {
    Object.assign(db, JSON.parse(saved));
  } else {
    // Sample data
    db.threads = [
      {
        id: Date.now() + Math.random(),
        title: 'ยินดีต้อนรับ',
        author: 'ผู้ดูแล',
        category: 'ทั่วไป',
        date: new Date().toLocaleDateString('th-TH'),
        body: 'ยินดีต้อนรับสู่เว็บกระทู้ส่วนตัว! 🎉\n\nคุณสามารถ:\n- สร้างบัญชีผู้ใช้\n- สร้างกระทู้ใหม่ในหมวดหมู่ต่างๆ\n- ตอบความเห็น\n- ค้นหากระทู้\n- แก้ไขและลบกระทู้ของคุณ',
        comments: []
      }
    ];
    saveDB();
  }
}

function saveDB() {
  localStorage.setItem('forumDB', JSON.stringify(db));
}

// DOM Elements
const loginPage = document.getElementById('loginPage');
const homePage = document.getElementById('homePage');
const threadPage = document.getElementById('threadPage');
const threadsList = document.getElementById('threadsList');
const noThreads = document.getElementById('noThreads');
const searchInput = document.getElementById('searchInput');
const newThreadBtn = document.getElementById('newThreadBtn');
const createThreadModal = document.getElementById('createThreadModal');
const currentUserDisplay = document.getElementById('currentUserDisplay');
const logoutBtn = document.getElementById('logoutBtn');
const categoryFilter = document.getElementById('categoryFilter');
const sortSelect = document.getElementById('sortSelect');

// Authentication Functions
function showLoginPage() {
  loginPage.classList.add('active');
  homePage.classList.remove('active');
  threadPage.classList.remove('active');
}

function login() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  if (!username || !password) {
    alert('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
    return;
  }

  if (!db.users[username]) {
    db.users[username] = { password };
  } else if (db.users[username].password !== password) {
    alert('รหัสผ่านไม่ถูกต้อง');
    return;
  }

  db.currentUser = username;
  saveDB();
  document.getElementById('loginUsername').value = '';
  document.getElementById('loginPassword').value = '';
  showHomePage();
}

function logout() {
  if (confirm('แน่ใจว่าต้องการออกจากระบบ?')) {
    db.currentUser = null;
    saveDB();
    showLoginPage();
  }
}

function showHomePage() {
  loginPage.classList.remove('active');
  homePage.classList.add('active');
  threadPage.classList.remove('active');
  currentUserDisplay.textContent = db.currentUser;
  renderThreadsList();
}

// Modal Functions
function openModal(modal) {
  modal.classList.remove('hidden');
}

function closeModal(modal) {
  modal.classList.add('hidden');
}

// Event Listeners
document.getElementById('loginBtn').addEventListener('click', login);
document.getElementById('loginUsername').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') login();
});
document.getElementById('loginPassword').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') login();
});

logoutBtn.addEventListener('click', logout);

// Create Thread
newThreadBtn.addEventListener('click', () => {
  document.getElementById('threadTitleInput').value = '';
  document.getElementById('threadBodyInput').value = '';
  document.getElementById('threadCategoryInput').value = 'ทั่วไป';
  openModal(createThreadModal);
});

document.getElementById('closeCreateModal').addEventListener('click', () => {
  closeModal(createThreadModal);
});

document.getElementById('submitThreadBtn').addEventListener('click', () => {
  const title = document.getElementById('threadTitleInput').value.trim();
  const body = document.getElementById('threadBodyInput').value.trim();
  const category = document.getElementById('threadCategoryInput').value;

  if (!title || !body) {
    alert('กรุณากรอกหัวข้อและเนื้อหา');
    return;
  }

  const thread = {
    id: Date.now() + Math.random(),
    title,
    body,
    category,
    author: db.currentUser,
    date: new Date().toLocaleDateString('th-TH'),
    comments: []
  };

  db.threads.unshift(thread);
  saveDB();
  closeModal(createThreadModal);
  renderThreadsList();
});

// Populate Category Select
function populateCategorySelects() {
  const selects = document.querySelectorAll('[data-category-select]');
  selects.forEach(select => {
    select.innerHTML = db.categories.map(cat => 
      `<option value="${cat}">${cat}</option>`
    ).join('');
  });
}

// Render Threads List
function renderThreadsList(filter = '') {
  const selectedCategory = categoryFilter.value;
  const sortBy = sortSelect.value;

  let filtered = db.threads.filter(t => {
    const matchesSearch = t.title.includes(filter) || t.body.includes(filter);
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Sort threads
  if (sortBy === 'newest') {
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  } else if (sortBy === 'oldest') {
    filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
  } else if (sortBy === 'mostComments') {
    filtered.sort((a, b) => b.comments.length - a.comments.length);
  } else if (sortBy === 'leastComments') {
    filtered.sort((a, b) => a.comments.length - b.comments.length);
  }

  threadsList.innerHTML = '';

  if (filtered.length === 0) {
    noThreads.style.display = 'block';
    return;
  }

  noThreads.style.display = 'none';

  filtered.forEach(thread => {
    const preview = thread.body.substring(0, 100) + (thread.body.length > 100 ? '...' : '');
    const html = `
      <div class="thread-card" onclick="viewThread('${thread.id}')">
        <div class="thread-category-badge">${escapeHtml(thread.category)}</div>
        <h3>${escapeHtml(thread.title)}</h3>
        <p class="thread-meta">
          โดย ${escapeHtml(thread.author)} · ${thread.date} · ${thread.comments.length} ความเห็น
        </p>
        <p class="thread-preview">${escapeHtml(preview)}</p>
      </div>
    `;
    threadsList.innerHTML += html;
  });
}

// View Thread Detail
function viewThread(threadId) {
  const parsedId = parseFloat(threadId);
  const thread = db.threads.find(t => t.id === parsedId);
  if (!thread) return;

  homePage.classList.remove('active');
  threadPage.classList.add('active');

  document.getElementById('detailTitle').textContent = thread.title;
  document.getElementById('detailCategory').textContent = thread.category;
  document.getElementById('detailMeta').textContent = `โดย ${escapeHtml(thread.author)} · ${thread.date}`;
  document.getElementById('detailBody').textContent = thread.body;
  document.getElementById('commentCount').textContent = thread.comments.length;

  // Show/Hide edit/delete buttons
  const editDeleteDiv = document.getElementById('editDeleteDiv');
  if (thread.author === db.currentUser) {
    editDeleteDiv.style.display = 'flex';
  } else {
    editDeleteDiv.style.display = 'none';
  }

  // Render Comments
  const commentsList = document.getElementById('commentsList');
  commentsList.innerHTML = '';
  thread.comments.forEach((comment, index) => {
    const canDelete = comment.author === db.currentUser;
    const html = `
      <div class="comment">
        <div class="comment-header">
          <div class="comment-author">${escapeHtml(comment.author)}</div>
          <div class="comment-time">${comment.date}</div>
          ${canDelete ? `<button class="btn-delete-comment" onclick="deleteComment('${threadId}', ${index})">ลบ</button>` : ''}
        </div>
        <div class="comment-text">${escapeHtml(comment.text)}</div>
      </div>
    `;
    commentsList.innerHTML += html;
  });

  // Edit/Delete Buttons
  document.getElementById('editThreadBtn').onclick = () => {
    const newTitle = prompt('แก้ไขหัวข้อ:', thread.title);
    if (newTitle !== null) {
      const newBody = prompt('แก้ไขเนื้อหา:', thread.body);
      if (newBody !== null) {
        thread.title = newTitle;
        thread.body = newBody;
        saveDB();
        viewThread(threadId);
      }
    }
  };

  document.getElementById('deleteThreadBtn').onclick = () => {
    if (confirm('แน่ใจว่าต้องการลบกระทู้นี้?')) {
      db.threads = db.threads.filter(t => t.id !== parsedId);
      saveDB();
      goHome();
    }
  };

  // Comment Submit
  document.getElementById('submitCommentBtn').onclick = () => {
    const text = document.getElementById('commentInput').value.trim();
    if (!text) {
      alert('กรุณาเขียนความเห็น');
      return;
    }

    thread.comments.push({
      author: db.currentUser,
      date: new Date().toLocaleDateString('th-TH'),
      text
    });

    saveDB();
    document.getElementById('commentInput').value = '';
    viewThread(threadId);
  };
}

// Delete Comment
function deleteComment(threadId, commentIndex) {
  if (confirm('แน่ใจว่าต้องการลบความเห็นนี้?')) {
    const parsedId = parseFloat(threadId);
    const thread = db.threads.find(t => t.id === parsedId);
    if (thread) {
      thread.comments.splice(commentIndex, 1);
      saveDB();
      viewThread(threadId);
    }
  }
}

// Go Back Home
function goHome() {
  homePage.classList.add('active');
  threadPage.classList.remove('active');
  renderThreadsList();
}

document.getElementById('backBtn').addEventListener('click', goHome);

// Search and Filter
searchInput.addEventListener('input', (e) => {
  renderThreadsList(e.target.value);
});

categoryFilter.addEventListener('change', () => {
  renderThreadsList(searchInput.value);
});

sortSelect.addEventListener('change', () => {
  renderThreadsList(searchInput.value);
});

// Helper Functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize
initDB();

// Check if user is logged in
if (db.currentUser) {
  showHomePage();
  populateCategorySelects();
} else {
  showLoginPage();
}

// Populate categories on load
populateCategorySelects();
