document.addEventListener('DOMContentLoaded', () => {
    const todoInput = document.getElementById('todo-input');
    const addBtn = document.getElementById('add-btn');
    const todoList = document.getElementById('todo-list');

    // 로컬 스토리지에서 할 일 목록 불러오기
    let todos = JSON.parse(localStorage.getItem('todos')) || [];

    // 할 일 목록 렌더링
    function renderTodos() {
        todoList.innerHTML = '';
        todos.forEach((todo, index) => {
            const li = document.createElement('li');
            li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            li.innerHTML = `
                <input type="checkbox" ${todo.completed ? 'checked' : ''} data-index="${index}">
                <span>${todo.text}</span>
                <button class="delete-btn" data-index="${index}">삭제</button>
            `;
            todoList.appendChild(li);
        });
    }

    // 로컬 스토리지에 저장
    function saveTodos() {
        localStorage.setItem('todos', JSON.stringify(todos));
    }

    // 할 일 추가
    function addTodo() {
        const text = todoInput.value.trim();
        if (text) {
            todos.push({ text, completed: false });
            saveTodos();
            renderTodos();
            todoInput.value = '';
        }
    }

    // 이벤트 리스너
    addBtn.addEventListener('click', addTodo);

    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTodo();
        }
    });

    todoList.addEventListener('click', (e) => {
        const index = e.target.dataset.index;

        if (e.target.type === 'checkbox') {
            todos[index].completed = e.target.checked;
            saveTodos();
            renderTodos();
        }

        if (e.target.classList.contains('delete-btn')) {
            todos.splice(index, 1);
            saveTodos();
            renderTodos();
        }
    });

    // 초기 렌더링
    renderTodos();
});
