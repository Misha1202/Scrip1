// Конфигурация
const API_BASE = 'https://your-glitch-project.glitch.me'; // Замените на ваш Glitch URL
const ADMIN_PASSWORD = 'admin123'; // Пароль для админа

// Глобальные переменные
let currentUser = null;
let currentFile = null;

// DOM элементы
const loginScreen = document.getElementById('loginScreen');
const adminPanel = document.getElementById('adminPanel');
const userPanel = document.getElementById('userPanel');
const userTypeSelect = document.getElementById('userType');
const passwordField = document.getElementById('passwordField');
const loginButton = document.getElementById('loginButton');

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    // Обработчики событий
    userTypeSelect.addEventListener('change', togglePasswordField);
    loginButton.addEventListener('click', handleLogin);
    
    // Проверка авторизации при загрузке
    checkAuth();
});

function togglePasswordField() {
    passwordField.classList.toggle('hidden', userTypeSelect.value !== 'admin');
}

async function handleLogin() {
    const userType = userTypeSelect.value;
    const password = document.getElementById('password').value;
    
    if (userType === 'admin' && password !== ADMIN_PASSWORD) {
        alert('Неверный пароль администратора');
        return;
    }
    
    currentUser = userType;
    loginScreen.classList.add('hidden');
    
    if (userType === 'admin') {
        adminPanel.classList.remove('hidden');
        setupAdminPanel();
    } else {
        userPanel.classList.remove('hidden');
        setupUserPanel();
    }
}

function setupAdminPanel() {
    // Инициализация админ панели
    document.querySelectorAll('.logout-btn').forEach(btn => {
        btn.addEventListener('click', logout);
    });
    
    // Табы
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            switchTab(tabId);
        });
    });
    
    // Загрузка файла
    document.getElementById('uploadBtn').addEventListener('click', uploadFile);
    
    // Загрузка отправленных данных
    loadSubmissions();
}

function setupUserPanel() {
    // Инициализация пользовательской панели
    document.querySelectorAll('.logout-btn').forEach(btn => {
        btn.addEventListener('click', logout);
    });
    
    document.getElementById('submitBtn').addEventListener('click', submitData);
    
    // Проверка наличия файла
    checkForFile();
}

function switchTab(tabId) {
    // Переключение между вкладками
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tabId}Tab`);
    });
}

async function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput.files.length === 0) {
        alert('Пожалуйста, выберите файл');
        return;
    }
    
    try {
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        
        const response = await fetch(`${API_BASE}/api/file`, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            alert('Файл успешно загружен');
            const data = await response.json();
            previewFile(data);
        } else {
            alert('Ошибка при загрузке файла');
        }
    } catch (error) {
        console.error('Upload error:', error);
        alert('Ошибка при загрузке файла');
    }
}

function previewFile(fileData) {
    const previewDiv = document.getElementById('filePreview');
    previewDiv.innerHTML = '';
    
    if (!fileData || !fileData.data) return;
    
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');
    
    // Заголовки
    const headerRow = document.createElement('tr');
    fileData.data[0].forEach(cell => {
        const th = document.createElement('th');
        th.textContent = cell;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    
    // Данные
    for (let i = 1; i < fileData.data.length; i++) {
        const row = document.createElement('tr');
        fileData.data[i].forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell;
            row.appendChild(td);
        });
        tbody.appendChild(row);
    }
    
    table.appendChild(thead);
    table.appendChild(tbody);
    previewDiv.appendChild(table);
}

async function loadSubmissions() {
    try {
        const response = await fetch(`${API_BASE}/api/submissions`);
        if (response.ok) {
            const submissions = await response.json();
            displaySubmissions(submissions);
        }
    } catch (error) {
        console.error('Error loading submissions:', error);
    }
}

function displaySubmissions(submissions) {
    const listDiv = document.getElementById('submissionsList');
    listDiv.innerHTML = '';
    
    if (submissions.length === 0) {
        listDiv.innerHTML = '<p>Нет отправленных данных</p>';
        return;
    }
    
    submissions.forEach(sub => {
        const subDiv = document.createElement('div');
        subDiv.className = 'submission';
        subDiv.innerHTML = `
            <h3>${sub.user} - ${new Date(sub.timestamp).toLocaleString()}</h3>
            <button data-id="${sub.id}">Скачать</button>
        `;
        listDiv.appendChild(subDiv);
    });
}

async function checkForFile() {
    try {
        const response = await fetch(`${API_BASE}/api/file`);
        if (response.ok) {
            const fileData = await response.json();
            if (fileData) {
                displayUserFile(fileData);
            } else {
                setTimeout(checkForFile, 5000);
            }
        }
    } catch (error) {
        console.error('Error checking for file:', error);
        setTimeout(checkForFile, 5000);
    }
}

function displayUserFile(fileData) {
    const fileInfo = document.getElementById('userFileInfo');
    const tableDiv = document.getElementById('userTable');
    
    fileInfo.innerHTML = `
        <h2>${fileData.name}</h2>
        <p>Загружен: ${new Date(fileData.timestamp).toLocaleString()}</p>
    `;
    
    tableDiv.innerHTML = '';
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');
    
    // Заголовки
    const headerRow = document.createElement('tr');
    fileData.data[0].forEach(cell => {
        const th = document.createElement('th');
        th.textContent = cell;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    
    // Данные (с возможностью редактирования)
    for (let i = 1; i < fileData.data.length; i++) {
        const row = document.createElement('tr');
        fileData.data[i].forEach((cell, j) => {
            const td = document.createElement('td');
            const input = document.createElement('input');
            input.type = 'text';
            input.value = cell;
            input.dataset.row = i;
            input.dataset.col = j;
            td.appendChild(input);
            row.appendChild(td);
        });
        tbody.appendChild(row);
    }
    
    table.appendChild(thead);
    table.appendChild(tbody);
    tableDiv.appendChild(table);
    
    document.getElementById('submitBtn').classList.remove('hidden');
}

async function submitData() {
    const inputs = document.querySelectorAll('#userTable input');
    const data = currentFile.data.map(row => [...row]);
    
    inputs.forEach(input => {
        const row = parseInt(input.dataset.row);
        const col = parseInt(input.dataset.col);
        data[row][col] = input.value;
    });
    
    try {
        const response = await fetch(`${API_BASE}/api/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data })
        });
        
        if (response.ok) {
            alert('Данные успешно отправлены');
        } else {
            alert('Ошибка при отправке данных');
        }
    } catch (error) {
        console.error('Submit error:', error);
        alert('Ошибка при отправке данных');
    }
}

function logout() {
    currentUser = null;
    loginScreen.classList.remove('hidden');
    adminPanel.classList.add('hidden');
    userPanel.classList.add('hidden');
}

function checkAuth() {
    // Проверка сохраненной авторизации (например, в localStorage)
    // В этом примере просто сбрасываем авторизацию
}
