const STORAGE_KEY = "personal-web-app.tasks";

const form = document.querySelector("#taskForm");
const input = document.querySelector("#taskInput");
const addButton = document.querySelector("#addTaskButton");
const list = document.querySelector("#taskList");
const template = document.querySelector("#taskTemplate");

let tasks = loadTasks();

function loadTasks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function createTask(title) {
  return {
    id: crypto.randomUUID(),
    title,
    done: false
  };
}

function addTask() {
  const title = input.value.trim();
  if (!title) {
    input.focus();
    return;
  }

  tasks = [createTask(title), ...tasks];
  input.value = "";
  saveTasks();
  renderTasks();
}

function renderTasks() {
  list.replaceChildren();

  if (tasks.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = "아직 할 일이 없습니다.";
    list.append(empty);
    return;
  }

  for (const task of tasks) {
    const item = template.content.firstElementChild.cloneNode(true);
    const checkbox = item.querySelector("input");
    const title = item.querySelector("span");
    const removeButton = item.querySelector("button");

    checkbox.checked = task.done;
    title.textContent = task.title;
    item.classList.toggle("is-done", task.done);

    checkbox.addEventListener("change", () => {
      tasks = tasks.map((current) =>
        current.id === task.id ? { ...current, done: checkbox.checked } : current
      );
      saveTasks();
      renderTasks();
    });

    removeButton.addEventListener("click", () => {
      tasks = tasks.filter((current) => current.id !== task.id);
      saveTasks();
      renderTasks();
    });

    list.append(item);
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  addTask();
});

addButton.addEventListener("click", addTask);

renderTasks();
