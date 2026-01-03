/**
 * Daily Todo Manager - 메인 애플리케이션
 * Created: 2026-01-04
 * Description: 할 일 관리 앱의 핵심 로직
 */

'use strict';

// ===== 상수 정의 =====
const STORAGE_KEYS = {
    TODOS: 'todos',
    THEME: 'theme',
    SORT: 'sortOption',
    DELETED: 'deletedTodo'
};

const CATEGORIES = ['일반', '업무', '개인', '쇼핑'];

// 오늘의 격언 목록
const QUOTES = [
    "오늘 할 일을 내일로 미루지 마라. - 벤자민 프랭클린",
    "시작이 반이다. - 아리스토텔레스",
    "작은 일에도 최선을 다하라. - 나폴레온",
    "꿈을 이루고 싶다면 일단 일어나라. - 무명",
    "성공은 준비된 자에게 찾아온다. - 파스퇴르",
    "오늘 하루도 화이팅! 💪",
    "포기하지 않으면 실패는 없다.",
    "천 리 길도 한 걸음부터.",
    "할 수 있다고 믿으면 반은 이룬 것이다.",
    "오늘의 노력이 내일의 나를 만든다."
];

// 완료율에 따른 응원 메시지
const MOTIVATION_MESSAGES = {
    0: "첫 발걸음을 내딛어 보세요! 🚀",
    25: "좋은 시작이에요! 계속 화이팅! 💪",
    50: "절반이나 완료했어요! 대단해요! ⭐",
    75: "거의 다 왔어요! 조금만 더! 🔥",
    100: "🎉 오늘의 할 일 완료! 최고예요!"
};

// ===== 전역 상태 =====
let todos = [];
let currentFilter = 'all';
let currentSort = 'custom';
let deletedTodo = null;
let undoTimeout = null;
let draggedItem = null;

// ===== 유틸리티 함수 =====

/**
 * 디바운스 함수 - 연속 호출 방지
 * @param {Function} func - 실행할 함수
 * @param {number} wait - 대기 시간 (ms)
 * @returns {Function} 디바운스된 함수
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * HTML 이스케이프 - XSS 방지
 * @param {string} text - 이스케이프할 텍스트
 * @returns {string} 이스케이프된 텍스트
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * 고유 ID 생성
 * @returns {string} 고유 ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ===== LocalStorage 함수 =====

/**
 * 할 일 목록을 LocalStorage에 저장
 * 디바운싱 적용으로 성능 최적화
 */
const saveTodos = debounce(() => {
    try {
        localStorage.setItem(STORAGE_KEYS.TODOS, JSON.stringify(todos));
    } catch (e) {
        console.error('저장 실패:', e);
        alert('데이터 저장에 실패했습니다. 저장 공간이 부족할 수 있습니다.');
    }
}, 300);

/**
 * LocalStorage에서 할 일 목록 불러오기
 */
function loadTodos() {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.TODOS);
        todos = stored ? JSON.parse(stored) : [];

        // 데이터 무결성 검사 및 마이그레이션
        todos = todos.filter(todo => todo && typeof todo === 'object');
        todos.forEach((todo, index) => {
            if (!todo.id) todo.id = generateId();
            if (!todo.title) todo.title = '(제목 없음)';
            if (!todo.category) todo.category = '일반';
            if (typeof todo.completed !== 'boolean') todo.completed = false;
            if (!todo.createdAt) todo.createdAt = new Date().toISOString();
            if (typeof todo.order !== 'number') todo.order = index;
        });
    } catch (e) {
        console.error('불러오기 실패:', e);
        todos = [];
    }
}

/**
 * 정렬 옵션 저장
 */
function saveSortOption() {
    localStorage.setItem(STORAGE_KEYS.SORT, currentSort);
}

/**
 * 정렬 옵션 불러오기
 */
function loadSortOption() {
    currentSort = localStorage.getItem(STORAGE_KEYS.SORT) || 'custom';
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) sortSelect.value = currentSort;
}

// ===== 다크 모드 =====

/**
 * 테마 불러오기 및 적용
 */
function loadTheme() {
    const theme = localStorage.getItem(STORAGE_KEYS.THEME);
    if (theme === 'dark') {
        document.body.classList.add('dark');
    }
    updateThemeIcon();
}

/**
 * 테마 전환
 */
function toggleTheme() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    localStorage.setItem(STORAGE_KEYS.THEME, isDark ? 'dark' : 'light');
    updateThemeIcon();

    // 스크린 리더에 알림
    announceToScreenReader(isDark ? '다크 모드로 전환되었습니다' : '라이트 모드로 전환되었습니다');
}

/**
 * 테마 아이콘 업데이트
 */
function updateThemeIcon() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    const isDark = document.body.classList.contains('dark');
    btn.textContent = isDark ? '☀️' : '🌙';
    btn.setAttribute('aria-label', isDark ? '라이트 모드로 전환' : '다크 모드로 전환');
}

// ===== 격언 및 응원 메시지 =====

/**
 * 랜덤 격언 표시
 */
function displayQuote() {
    const quoteText = document.getElementById('quote-text');
    if (!quoteText) return;
    const randomIndex = Math.floor(Math.random() * QUOTES.length);
    quoteText.textContent = `"${QUOTES[randomIndex]}"`;
}

/**
 * 완료율에 따른 응원 메시지 표시
 * @param {number} percentage - 완료율 (0-100)
 */
function displayMotivation(percentage) {
    const messageEl = document.getElementById('motivation-message');
    if (!messageEl) return;

    let message = '';
    if (percentage === 0 && todos.length === 0) {
        message = MOTIVATION_MESSAGES[0];
    } else if (percentage === 100) {
        message = MOTIVATION_MESSAGES[100];
    } else if (percentage >= 75) {
        message = MOTIVATION_MESSAGES[75];
    } else if (percentage >= 50) {
        message = MOTIVATION_MESSAGES[50];
    } else if (percentage >= 25) {
        message = MOTIVATION_MESSAGES[25];
    } else if (todos.length > 0) {
        message = "할 일을 하나씩 처리해 보세요! 📝";
    }

    messageEl.textContent = message;
}

// ===== 필터 및 정렬 =====

/**
 * 필터 변경
 * @param {string} category - 카테고리 또는 'all'
 */
function setFilter(category) {
    currentFilter = category;

    // 필터 버튼 상태 업데이트 (접근성 포함)
    document.querySelectorAll('.filter-btn').forEach(btn => {
        const isActive = btn.dataset.filter === category;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive);
    });

    renderTodos();
}

/**
 * 정렬 기준에 따라 할 일 정렬
 * @param {Array} todoList - 정렬할 할 일 배열
 * @returns {Array} 정렬된 배열
 */
function sortTodos(todoList) {
    const sorted = [...todoList];

    switch (currentSort) {
        case 'created-desc':
            sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        case 'created-asc':
            sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            break;
        case 'category':
            sorted.sort((a, b) => {
                const catA = CATEGORIES.indexOf(a.category);
                const catB = CATEGORIES.indexOf(b.category);
                return catA - catB;
            });
            break;
        case 'status':
            sorted.sort((a, b) => {
                if (a.completed !== b.completed) return a.completed ? 1 : -1;
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
            break;
        case 'custom':
        default:
            sorted.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            break;
    }

    return sorted;
}

/**
 * 필터링 및 정렬된 할 일 목록 반환
 * @returns {Array} 필터링 및 정렬된 배열
 */
function getFilteredTodos() {
    let filtered = currentFilter === 'all'
        ? [...todos]
        : todos.filter(todo => todo.category === currentFilter);

    return sortTodos(filtered);
}

// ===== 대시보드 업데이트 =====

/**
 * 대시보드 (진행률, 통계) 업데이트
 */
function updateDashboard() {
    const progressText = document.getElementById('progress-text');
    const progressFill = document.getElementById('progress-fill');
    const progressBar = document.querySelector('.progress-bar');
    const categoryStats = document.getElementById('category-stats');

    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    // 진행률 텍스트
    if (total === 0) {
        progressText.textContent = '할 일을 추가해보세요 ✏️';
    } else {
        progressText.textContent = `${completed}/${total} 완료 (${percentage}%)`;
    }

    // 프로그레스 바
    progressFill.style.width = `${percentage}%`;
    progressFill.classList.toggle('complete', percentage === 100 && total > 0);

    // 접근성: progressbar 속성 업데이트
    if (progressBar) {
        progressBar.setAttribute('aria-valuenow', percentage);
    }

    // 응원 메시지
    displayMotivation(percentage);

    // 카테고리별 통계
    const statsHtml = CATEGORIES.map(cat => {
        const catTodos = todos.filter(t => t.category === cat);
        const catCompleted = catTodos.filter(t => t.completed).length;
        const catTotal = catTodos.length;
        if (catTotal === 0) return '';
        return `<span class="stat-item">${cat}: ${catCompleted}/${catTotal}</span>`;
    }).filter(s => s).join('');

    categoryStats.innerHTML = statsHtml;
}

// ===== CRUD 함수 =====

/**
 * 중복 할 일 확인
 * @param {string} title - 확인할 제목
 * @param {string} excludeId - 제외할 ID (수정 시)
 * @returns {boolean} 중복 여부
 */
function isDuplicate(title, excludeId = null) {
    const normalizedTitle = title.trim().toLowerCase();
    return todos.some(todo =>
        todo.id !== excludeId &&
        todo.title.toLowerCase() === normalizedTitle
    );
}

/**
 * 할 일 추가
 * @param {string} title - 제목
 * @param {string} category - 카테고리
 * @returns {boolean} 성공 여부
 */
function addTodo(title, category) {
    const trimmedTitle = title.trim();

    // 유효성 검사
    if (!trimmedTitle) {
        announceToScreenReader('할 일을 입력해주세요');
        return false;
    }

    // 중복 확인
    if (isDuplicate(trimmedTitle)) {
        const confirmAdd = confirm(`"${trimmedTitle}"이(가) 이미 존재합니다. 그래도 추가하시겠습니까?`);
        if (!confirmAdd) return false;
    }

    const todo = {
        id: generateId(),
        title: trimmedTitle,
        category: category || '일반',
        completed: false,
        createdAt: new Date().toISOString(),
        order: todos.length
    };

    todos.push(todo);
    saveTodos();
    renderTodos();

    announceToScreenReader(`"${trimmedTitle}" 추가됨`);
    return true;
}

/**
 * 할 일 삭제 (Undo 지원)
 * @param {string} id - 삭제할 할 일 ID
 * @param {HTMLElement} element - 삭제 버튼 요소
 */
function deleteTodo(id, element) {
    const todoIndex = todos.findIndex(t => t.id === id);
    if (todoIndex === -1) return;

    // Undo를 위해 저장
    deletedTodo = { todo: { ...todos[todoIndex] }, index: todoIndex };

    // 애니메이션 처리
    if (element) {
        const li = element.closest('.todo-item');
        if (li) {
            li.classList.add('removing');
            setTimeout(() => {
                performDelete(id);
            }, 300);
            return;
        }
    }

    performDelete(id);
}

/**
 * 실제 삭제 수행
 * @param {string} id - 삭제할 ID
 */
function performDelete(id) {
    const deleted = todos.find(t => t.id === id);
    todos = todos.filter(todo => todo.id !== id);
    saveTodos();
    renderTodos();

    if (deleted) {
        showUndoToast(`"${deleted.title}" 삭제됨`);
        announceToScreenReader(`"${deleted.title}" 삭제됨. 실행 취소하려면 Undo 버튼을 누르세요.`);
    }
}

/**
 * 삭제 취소 (Undo)
 */
function undoDelete() {
    if (!deletedTodo) return;

    // 원래 위치에 복원
    todos.splice(deletedTodo.index, 0, deletedTodo.todo);
    saveTodos();
    renderTodos();

    announceToScreenReader(`"${deletedTodo.todo.title}" 복원됨`);
    hideUndoToast();
    deletedTodo = null;
}

/**
 * Undo 토스트 표시
 * @param {string} message - 표시할 메시지
 */
function showUndoToast(message) {
    const toast = document.getElementById('undo-toast');
    const messageEl = toast.querySelector('.undo-message');

    if (undoTimeout) clearTimeout(undoTimeout);

    messageEl.textContent = message;
    toast.hidden = false;

    // 5초 후 자동 숨김
    undoTimeout = setTimeout(() => {
        hideUndoToast();
        deletedTodo = null;
    }, 5000);
}

/**
 * Undo 토스트 숨김
 */
function hideUndoToast() {
    const toast = document.getElementById('undo-toast');
    toast.hidden = true;
    if (undoTimeout) {
        clearTimeout(undoTimeout);
        undoTimeout = null;
    }
}

/**
 * 할 일 완료 상태 토글
 * @param {string} id - 토글할 할 일 ID
 */
function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveTodos();
        renderTodos();

        announceToScreenReader(
            todo.completed
                ? `"${todo.title}" 완료됨`
                : `"${todo.title}" 미완료로 변경됨`
        );
    }
}

/**
 * 할 일 수정
 * @param {string} id - 수정할 할 일 ID
 * @param {string} newTitle - 새 제목
 */
function editTodo(id, newTitle) {
    const trimmedTitle = newTitle.trim();
    const todo = todos.find(t => t.id === id);

    if (!todo) return;

    if (!trimmedTitle) {
        // 빈 제목이면 원래대로 복원
        renderTodos();
        return;
    }

    // 중복 확인 (자기 자신 제외)
    if (isDuplicate(trimmedTitle, id)) {
        alert(`"${trimmedTitle}"이(가) 이미 존재합니다.`);
        renderTodos();
        return;
    }

    todo.title = trimmedTitle;
    saveTodos();
    renderTodos();

    announceToScreenReader(`"${trimmedTitle}"(으)로 수정됨`);
}

/**
 * 수정 모드 시작
 * @param {HTMLElement} titleSpan - 제목 span 요소
 * @param {string} id - 할 일 ID
 */
function startEdit(titleSpan, id) {
    const currentTitle = titleSpan.textContent;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'edit-input';
    input.value = currentTitle;
    input.setAttribute('aria-label', '할 일 수정');

    titleSpan.replaceWith(input);
    input.focus();
    input.select();

    function finishEdit() {
        editTodo(id, input.value);
    }

    input.addEventListener('blur', finishEdit);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            input.blur();
        } else if (e.key === 'Escape') {
            input.value = currentTitle;
            input.blur();
        }
    });
}

// ===== 드래그 앤 드롭 =====

/**
 * 드래그 시작
 * @param {DragEvent} e - 드래그 이벤트
 */
function handleDragStart(e) {
    if (currentSort !== 'custom') {
        e.preventDefault();
        alert('사용자 정렬 모드에서만 드래그가 가능합니다.');
        return;
    }

    draggedItem = e.target.closest('.todo-item');
    if (draggedItem) {
        draggedItem.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', draggedItem.dataset.id);
    }
}

/**
 * 드래그 오버
 * @param {DragEvent} e - 드래그 이벤트
 */
function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const target = e.target.closest('.todo-item');
    if (target && target !== draggedItem) {
        target.classList.add('drag-over');
    }
}

/**
 * 드래그 리브
 * @param {DragEvent} e - 드래그 이벤트
 */
function handleDragLeave(e) {
    const target = e.target.closest('.todo-item');
    if (target) {
        target.classList.remove('drag-over');
    }
}

/**
 * 드롭
 * @param {DragEvent} e - 드래그 이벤트
 */
function handleDrop(e) {
    e.preventDefault();

    const target = e.target.closest('.todo-item');
    if (!target || !draggedItem || target === draggedItem) return;

    target.classList.remove('drag-over');

    const draggedId = draggedItem.dataset.id;
    const targetId = target.dataset.id;

    const draggedIndex = todos.findIndex(t => t.id === draggedId);
    const targetIndex = todos.findIndex(t => t.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // 배열 재정렬
    const [removed] = todos.splice(draggedIndex, 1);
    todos.splice(targetIndex, 0, removed);

    // order 업데이트
    todos.forEach((todo, index) => {
        todo.order = index;
    });

    saveTodos();
    renderTodos();
}

/**
 * 드래그 종료
 */
function handleDragEnd() {
    if (draggedItem) {
        draggedItem.classList.remove('dragging');
        draggedItem = null;
    }

    document.querySelectorAll('.drag-over').forEach(el => {
        el.classList.remove('drag-over');
    });
}

// ===== 데이터 내보내기/가져오기 =====

/**
 * 데이터를 JSON 파일로 내보내기
 */
function exportData() {
    try {
        const data = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            todos: todos
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `todo-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        announceToScreenReader('데이터 내보내기 완료');
    } catch (e) {
        console.error('내보내기 실패:', e);
        alert('데이터 내보내기에 실패했습니다.');
    }
}

/**
 * JSON 파일에서 데이터 가져오기
 * @param {File} file - JSON 파일
 */
function importData(file) {
    if (!file) return;

    // 파일 형식 확인
    if (!file.name.endsWith('.json')) {
        alert('JSON 파일만 가져올 수 있습니다.');
        return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);

            // 데이터 유효성 검사
            if (!data.todos || !Array.isArray(data.todos)) {
                throw new Error('올바른 형식이 아닙니다.');
            }

            // 현재 데이터가 있으면 백업 확인
            if (todos.length > 0) {
                const confirmImport = confirm(
                    `현재 ${todos.length}개의 할 일이 있습니다.\n` +
                    '가져오기를 진행하면 현재 데이터가 대체됩니다.\n' +
                    '계속하시겠습니까?'
                );
                if (!confirmImport) return;
            }

            // 데이터 마이그레이션 및 적용
            todos = data.todos.map((todo, index) => ({
                id: todo.id || generateId(),
                title: todo.title || '(제목 없음)',
                category: CATEGORIES.includes(todo.category) ? todo.category : '일반',
                completed: Boolean(todo.completed),
                createdAt: todo.createdAt || new Date().toISOString(),
                order: typeof todo.order === 'number' ? todo.order : index
            }));

            saveTodos();
            renderTodos();

            alert(`${todos.length}개의 할 일을 가져왔습니다.`);
            announceToScreenReader(`${todos.length}개의 할 일 가져오기 완료`);

        } catch (err) {
            console.error('가져오기 실패:', err);
            alert('파일을 읽는 중 오류가 발생했습니다.\n올바른 JSON 파일인지 확인해주세요.');
        }
    };

    reader.onerror = () => {
        alert('파일을 읽을 수 없습니다.');
    };

    reader.readAsText(file);
}

// ===== 접근성 =====

/**
 * 스크린 리더에 알림
 * @param {string} message - 알림 메시지
 */
function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}

// ===== 렌더링 =====

/**
 * DocumentFragment를 사용한 효율적인 렌더링
 */
function renderTodos() {
    const todoList = document.getElementById('todo-list');
    const filteredTodos = getFilteredTodos();

    // DocumentFragment 사용으로 리플로우 최소화
    const fragment = document.createDocumentFragment();

    if (filteredTodos.length === 0) {
        const emptyLi = document.createElement('li');
        emptyLi.className = 'empty-message';
        emptyLi.setAttribute('role', 'listitem');

        const isEmptyAll = currentFilter === 'all' && todos.length === 0;
        emptyLi.innerHTML = isEmptyAll
            ? `<span class="empty-icon">📝</span>
               <span class="empty-text">할 일을 추가해보세요!</span>`
            : `<span class="empty-icon">🔍</span>
               <span class="empty-text">해당 카테고리에 할 일이 없습니다</span>`;

        fragment.appendChild(emptyLi);
    } else {
        filteredTodos.forEach(todo => {
            const li = document.createElement('li');
            li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            li.setAttribute('role', 'listitem');
            li.setAttribute('draggable', currentSort === 'custom');
            li.dataset.id = todo.id;

            li.innerHTML = `
                <span class="drag-handle" aria-hidden="true">⋮⋮</span>
                <input
                    type="checkbox"
                    ${todo.completed ? 'checked' : ''}
                    data-id="${todo.id}"
                    aria-label="${todo.title} ${todo.completed ? '완료됨' : '미완료'}"
                >
                <span class="category-label">${escapeHtml(todo.category)}</span>
                <span class="todo-title" data-id="${todo.id}" tabindex="0" role="button" aria-label="${escapeHtml(todo.title)} 더블클릭하여 수정">${escapeHtml(todo.title)}</span>
                <button class="delete-btn" data-id="${todo.id}" aria-label="${escapeHtml(todo.title)} 삭제">삭제</button>
            `;

            fragment.appendChild(li);
        });
    }

    // 한 번에 DOM 업데이트
    todoList.innerHTML = '';
    todoList.appendChild(fragment);

    // 대시보드 업데이트
    updateDashboard();
}

// ===== 이벤트 초기화 =====

document.addEventListener('DOMContentLoaded', () => {
    // DOM 요소 참조
    const todoForm = document.getElementById('todo-form');
    const todoInput = document.getElementById('todo-input');
    const categorySelect = document.getElementById('category-select');
    const todoList = document.getElementById('todo-list');
    const filterSection = document.querySelector('.filter-section');
    const themeToggle = document.getElementById('theme-toggle');
    const sortSelect = document.getElementById('sort-select');
    const exportBtn = document.getElementById('export-btn');
    const importInput = document.getElementById('import-input');
    const undoBtn = document.getElementById('undo-btn');
    const undoClose = document.getElementById('undo-close');

    // 초기 로드
    loadTheme();
    loadSortOption();
    loadTodos();
    displayQuote();
    renderTodos();

    // 초기 포커스
    todoInput.focus();

    // 테마 토글
    themeToggle.addEventListener('click', toggleTheme);

    // 폼 제출
    todoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = todoInput.value.trim();
        const category = categorySelect.value;

        if (addTodo(title, category)) {
            todoInput.value = '';
            todoInput.focus();
        }
    });

    // 정렬 변경
    sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        saveSortOption();
        renderTodos();
    });

    // 필터 버튼
    filterSection.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-btn')) {
            setFilter(e.target.dataset.filter);
        }
    });

    // 할 일 목록 이벤트 (이벤트 위임)
    todoList.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        if (!id) return;

        if (e.target.type === 'checkbox') {
            toggleTodo(id);
        } else if (e.target.classList.contains('delete-btn')) {
            deleteTodo(id, e.target);
        }
    });

    // 더블클릭으로 수정
    todoList.addEventListener('dblclick', (e) => {
        if (e.target.classList.contains('todo-title')) {
            startEdit(e.target, e.target.dataset.id);
        }
    });

    // 키보드로 수정 (Enter 또는 Space)
    todoList.addEventListener('keydown', (e) => {
        if (e.target.classList.contains('todo-title') && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            startEdit(e.target, e.target.dataset.id);
        }
    });

    // 드래그 앤 드롭
    todoList.addEventListener('dragstart', handleDragStart);
    todoList.addEventListener('dragover', handleDragOver);
    todoList.addEventListener('dragleave', handleDragLeave);
    todoList.addEventListener('drop', handleDrop);
    todoList.addEventListener('dragend', handleDragEnd);

    // 데이터 내보내기
    exportBtn.addEventListener('click', exportData);

    // 데이터 가져오기
    importInput.addEventListener('change', (e) => {
        importData(e.target.files[0]);
        e.target.value = ''; // 같은 파일 다시 선택 가능하도록
    });

    // Undo 버튼
    undoBtn.addEventListener('click', undoDelete);
    undoClose.addEventListener('click', () => {
        hideUndoToast();
        deletedTodo = null;
    });

    // 키보드 단축키
    document.addEventListener('keydown', (e) => {
        // Ctrl+Z: Undo
        if (e.ctrlKey && e.key === 'z' && deletedTodo) {
            e.preventDefault();
            undoDelete();
        }
    });
});
