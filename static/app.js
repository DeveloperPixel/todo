document.addEventListener('DOMContentLoaded', () => {
  const todoForm = document.getElementById('todo-form');
  const todoInput = document.getElementById('todo-input');
  const todoList = document.getElementById('todo-list');
  const emptyState = document.getElementById('empty-state');
  const loadingSpinner = document.getElementById('loading-spinner');
  
  const totalNum = document.querySelector('#stat-total .stat-num');
  const completedNum = document.querySelector('#stat-completed .stat-num');
  const pendingNum = document.querySelector('#stat-pending .stat-num');

  let todos = [];

  // Fetch todos on load
  fetchTodos();

  // Form submission (Add Todo)
  todoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = todoInput.value.trim();
    if (!title) return;

    todoInput.value = '';
    try {
      const response = await fetch('/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });
      if (response.ok) {
        const newTodo = await response.json();
        todos.push(newTodo);
        renderTodos();
      }
    } catch (err) {
      console.error('Failed to create todo:', err);
    }
  });

  // Fetch all todos
  async function fetchTodos() {
    showLoading(true);
    try {
      const response = await fetch('/todos');
      if (response.ok) {
        todos = await response.json();
        renderTodos();
      }
    } catch (err) {
      console.error('Failed to fetch todos:', err);
    } finally {
      showLoading(false);
    }
  }

  // Render todos to UI
  function renderTodos() {
    todoList.innerHTML = '';
    updateStats();

    if (todos.length === 0) {
      emptyState.classList.remove('hidden');
      return;
    }
    emptyState.classList.add('hidden');

    todos.forEach(todo => {
      const li = document.createElement('li');
      li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
      li.dataset.id = todo.id;

      li.innerHTML = `
        <label class="checkbox-container">
          <input type="checkbox" ${todo.completed ? 'checked' : ''} class="toggle-checkbox">
          <span class="checkmark"></span>
        </label>
        <div class="todo-content-wrapper">
          <input type="text" class="todo-text" value="${escapeHtml(todo.title)}" autocomplete="off">
        </div>
        <div class="todo-actions">
          <button class="action-btn delete-btn" aria-label="Delete todo">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      `;

      // Event Listeners for inside items
      const checkbox = li.querySelector('.toggle-checkbox');
      const textInput = li.querySelector('.todo-text');
      const deleteBtn = li.querySelector('.delete-btn');

      // Toggle Complete
      checkbox.addEventListener('change', () => toggleComplete(todo.id, checkbox.checked));

      // Inline Edit Title on enter or blur
      let originalVal = todo.title;
      textInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          textInput.blur();
        } else if (e.key === 'Escape') {
          textInput.value = originalVal;
          textInput.blur();
        }
      });

      textInput.addEventListener('blur', () => {
        const newVal = textInput.value.trim();
        if (newVal && newVal !== originalVal) {
          updateTodoTitle(todo.id, newVal);
          originalVal = newVal;
        } else {
          textInput.value = originalVal;
        }
      });

      // Delete Todo
      deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

      todoList.appendChild(li);
    });
  }

  // Toggle complete API Call
  async function toggleComplete(id, completed) {
    try {
      const response = await fetch(`/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed })
      });
      if (response.ok) {
        const updated = await response.json();
        todos = todos.map(t => t.id === id ? updated : t);
        renderTodos();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  }

  // Update Todo Title API Call
  async function updateTodoTitle(id, title) {
    try {
      const response = await fetch(`/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });
      if (response.ok) {
        const updated = await response.json();
        todos = todos.map(t => t.id === id ? updated : t);
        updateStats();
      }
    } catch (err) {
      console.error('Failed to update title:', err);
    }
  }

  // Delete Todo API Call
  async function deleteTodo(id) {
    try {
      const response = await fetch(`/todos/${id}`, {
        method: 'DELETE'
      });
      if (response.status === 204 || response.ok) {
        todos = todos.filter(t => t.id !== id);
        renderTodos();
      }
    } catch (err) {
      console.error('Failed to delete todo:', err);
    }
  }

  // Update Stats Counters
  function updateStats() {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const pending = total - completed;

    totalNum.textContent = total;
    completedNum.textContent = completed;
    pendingNum.textContent = pending;
  }

  // Loading States
  function showLoading(show) {
    if (show) {
      loadingSpinner.classList.remove('hidden');
    } else {
      loadingSpinner.classList.add('hidden');
    }
  }

  // Escape HTML helper
  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
