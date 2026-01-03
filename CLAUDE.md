<!-- Created: 2026-01-04 -->
# Daily Todo Manager

간단하고 직관적인 할 일 관리 웹 애플리케이션

## Project Overview

브라우저에서 동작하는 순수 JavaScript 기반 Todo 앱으로, LocalStorage를 활용해 데이터를 영구 저장합니다.

## Commands

```bash
# 프로젝트 초기화
mkdir todo-app && cd todo-app
git init
mkdir css js

# 설치 (의존성 없음)
없음

# 실행
index.html을 브라우저에서 열기

# 또는 로컬 서버 실행
npx serve .
python -m http.server 8000

# Git 설정
git add .
git commit -m "Initial commit"
git remote add origin <REPO_URL>
git push -u origin master

# 테스트
수동 테스트 (자동화된 테스트 없음)
```

## Tech Stack

- **HTML5**: 시맨틱 마크업
- **CSS3**: CSS Variables, Flexbox, 반응형
- **JavaScript**: ES6+ (Vanilla JS, 프레임워크 없음)
- **Storage**: LocalStorage API

## Architecture

```
todoapp/
├── index.html          # 메인 HTML 구조
├── css/
│   └── style.css       # 스타일 (다크모드, 반응형 포함)
├── js/
│   └── app.js          # 메인 로직 (CRUD, 필터, 테마)
├── README.md           # 프로젝트 소개
├── CLAUDE.md           # 개발 가이드
└── .gitignore          # Git 제외 파일
```

### 핵심 함수 (js/app.js)

| 함수 | 역할 |
|------|------|
| `saveTodos()` / `loadTodos()` | LocalStorage CRUD |
| `addTodo()` / `deleteTodo()` / `toggleTodo()` / `editTodo()` | Todo 항목 관리 |
| `renderTodos()` | UI 렌더링 |
| `updateDashboard()` | 진행률 및 통계 업데이트 |
| `setFilter()` / `getFilteredTodos()` | 카테고리 필터링 |
| `toggleTheme()` / `loadTheme()` | 다크 모드 관리 |

## Code Style

- **언어**: 한국어 주석, 한국어 UI
- **함수명**: camelCase (예: `addTodo`, `renderTodos`)
- **변수명**: camelCase (예: `currentFilter`, `todoList`)
- **상수**: UPPER_SNAKE_CASE 권장
- **들여쓰기**: 4 spaces
- **문자열**: 템플릿 리터럴 사용 권장
- **파일 헤더**: 모든 새 파일에 날짜/시간 주석 포함

```javascript
// Created: YYYY-MM-DD HH:mm:ss
// Description: 파일 설명
```

## Development Notes

### 현재 상태
- 모든 핵심 기능 구현 완료
- GitHub Pages 배포 준비 완료

### 제한 사항
- 서버 없이 클라이언트만 사용 (LocalStorage 한계)
- 기기 간 동기화 불가
- 브라우저 데이터 삭제 시 데이터 손실

### 향후 개선 가능 사항
- 드래그 앤 드롭 정렬
- 마감일 설정
- 알림 기능
- PWA 지원
