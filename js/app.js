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
    let filtered = currentFilter === 'all'
        ? [...todos]
        : todos.filter(todo => todo.category === currentFilter);

    // 정렬: 미완료 먼저, 같은 상태 내에서는 최신순
    filtered.sort((a, b) => {
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return filtered;
}

// 대시보드 업데이트
function updateDashboard() {
    const progressText = document.getElementById('progress-text');
    const progressFill = document.getElementById('progress-fill');
    const categoryStats = document.getElementById('category-stats');

    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    // 특수 상태 처리
    if (total === 0) {
        progressText.textContent = '할 일을 추가해보세요 ✏️';
        progressFill.style.width = '0%';
        progressFill.classList.remove('complete');
    } else if (completed === total) {
        progressText.textContent = '🎉 오늘 할 일 완료!';
        progressFill.style.width = '100%';
        progressFill.classList.add('complete');
    } else {
        progressText.textContent = `${completed}/${total} 완료 (${percentage}%)`;
        progressFill.style.width = `${percentage}%`;
        progressFill.classList.remove('complete');
    }

    // 카테고리별 통계
    const categories = ['일반', '업무', '개인', '쇼핑'];
    const statsHtml = categories.map(cat => {
        const catTodos = todos.filter(t => t.category === cat);
        const catCompleted = catTodos.filter(t => t.completed).length;
        const catTotal = catTodos.length;
        if (catTotal === 0) return '';
        return `<span class="stat-item">${cat}: ${catCompleted}/${catTotal}</span>`;
    }).filter(s => s).join('');

    categoryStats.innerHTML = statsHtml;
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
    } else {
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

    // 대시보드 업데이트
    updateDashboard();
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
