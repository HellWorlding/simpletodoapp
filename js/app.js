// 데이터 구조
let todos = [];
let currentFilter = 'all';

// LocalStorage 함수
function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

function loadTodos() {
    const stored = localStorage.getItem('todos');
    todos = stored ? JSON.parse(stored) : [];
}

// 필터 함수
function setFilter(category) {
    currentFilter = category;

    // 활성 버튼 토글
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === category) {
            btn.classList.add('active');
        }
    });

    renderTodos();
}

function getFilteredTodos() {
    if (currentFilter === 'all') {
        return todos;
    }
    return todos.filter(todo => todo.category === currentFilter);
}

// CRUD 함수
function addTodo(title, category) {
    const todo = {
        id: Date.now(),
        title: title,
        category: category,
        completed: false,
        createdAt: new Date().toISOString()
    };
    todos.push(todo);
    saveTodos();
    renderTodos();
}

function deleteTodo(id) {
    todos = todos.filter(todo => todo.id !== id);
    saveTodos();
    renderTodos();
}

function toggleTodo(id) {
    const todo = todos.find(todo => todo.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveTodos();
        renderTodos();
    }
}

// 렌더링
function renderTodos() {
    const todoList = document.getElementById('todo-list');
    const filteredTodos = getFilteredTodos();
    todoList.innerHTML = '';

    if (filteredTodos.length === 0) {
        todoList.innerHTML = '<li class="empty-message">할 일이 없습니다. 새로운 할 일을 추가해보세요!</li>';
        return;
    }

    filteredTodos.forEach(todo => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        li.innerHTML = `
            <input type="checkbox" ${todo.completed ? 'checked' : ''} data-id="${todo.id}">
            <span class="category-label">${todo.category || '일반'}</span>
            <span>${todo.title}</span>
            <button class="delete-btn" data-id="${todo.id}">삭제</button>
        `;
        todoList.appendChild(li);
    });
}

// 이벤트
document.addEventListener('DOMContentLoaded', () => {
    const todoForm = document.getElementById('todo-form');
    const todoInput = document.getElementById('todo-input');
    const categorySelect = document.getElementById('category-select');
    const todoList = document.getElementById('todo-list');
    const filterSection = document.querySelector('.filter-section');

    // 초기 로드
    loadTodos();
    renderTodos();

    // 폼 submit으로 추가
    todoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = todoInput.value.trim();
        const category = categorySelect.value;
        if (title) {
            addTodo(title, category);
            todoInput.value = '';
        }
    });

    // 필터 버튼 이벤트
    filterSection.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-btn')) {
            setFilter(e.target.dataset.filter);
        }
    });

    // 체크박스 토글 및 삭제
    todoList.addEventListener('click', (e) => {
        const id = parseInt(e.target.dataset.id);

        if (e.target.type === 'checkbox') {
            toggleTodo(id);
        }

        if (e.target.classList.contains('delete-btn')) {
            deleteTodo(id);
        }
    });
});
