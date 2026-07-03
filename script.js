// ===== Global State =====
// Stores all tasks in memory
let tasks = [];
let taskCount = 0;          // Used to assign unique IDs to tasks
let editingTaskId = null;   // Tracks which task is being edited

// ===== DOM Elements =====
// Grab key UI elements from the HTML
const modal = document.getElementById("taskModal");
const addTaskBtn = document.getElementById("addTaskBtn");
const closeModalBtn = document.getElementById("closeModal");
const taskForm = document.getElementById("taskForm");
const taskTableBody = document.getElementById("taskTableBody");
const searchBar = document.getElementById("searchBar");
const sortOptions = document.getElementById("sortOptions");
const progressBox = document.querySelector(".progress-box");
const progressPercent = document.getElementById("progressPercent");

// ===== Load from LocalStorage =====
// When the page loads, fetch previously saved tasks
window.addEventListener("DOMContentLoaded", () => {
  const stored = localStorage.getItem("tasks");
  if (stored) {
    tasks = JSON.parse(stored); // Restore saved tasks
    // Ensure unique IDs continue correctly
    taskCount = tasks.length ? Math.max(...tasks.map(t => t.id)) : 0;
  }
  renderTasks(); // Show tasks immediately
});

// ===== Save to LocalStorage =====
// Save current state of tasks into browser storage
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// ===== Modal Controls =====
// Show modal when clicking "+ Add Task"
addTaskBtn.onclick = () => {
  editingTaskId = null;   // Reset editing mode
  taskForm.reset();       // Clear the form
  modal.style.display = "flex"; // Show modal
};
// Close modal when clicking "X"
closeModalBtn.onclick = () => modal.style.display = "none";
// Close modal if clicking outside modal content
window.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; };

// ===== Add / Edit Task =====
taskForm.addEventListener("submit", (e) => {
  e.preventDefault(); // Prevent page reload

  // Collect data from form
  const taskData = {
    name: document.getElementById("taskName").value,
    priority: document.getElementById("taskPriority").value,
    startDate: document.getElementById("startDate").value,
    dueDate: document.getElementById("dueDate").value,
    notes: document.getElementById("taskNotes").value,
  };

  if (editingTaskId) {
    // If editing → update the existing task
    let task = tasks.find(t => t.id === editingTaskId);
    Object.assign(task, taskData);
    editingTaskId = null; // Reset after editing
  } else {
    // If adding new → create a new task with unique ID
    taskCount++;
    tasks.push({ id: taskCount, completed: false, ...taskData });
  }

  saveTasks();             // Save changes
  taskForm.reset();        // Clear form
  modal.style.display = "none"; // Hide modal
  renderTasks();           // Refresh table
});

// ===== Render Tasks =====
// Handles search, sorting, and displaying tasks in the table
function renderTasks() {
  taskTableBody.innerHTML = ""; // Clear table

  // --- Filter by Search Bar ---
  let filtered = tasks.filter(t => {
    const term = searchBar.value.toLowerCase();
    return (
      t.name.toLowerCase().includes(term) ||
      t.priority.toLowerCase().includes(term) ||
      t.notes.toLowerCase().includes(term)
    );
  });

  // --- Sorting Options ---
  if (sortOptions.value === "priority") {
    const order = { High: 3, Medium: 2, Low: 1 };
    filtered.sort((a, b) => order[b.priority] - order[a.priority]);
  } else if (sortOptions.value === "due-date") {
    filtered.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  } else if (sortOptions.value === "status") {
    filtered.sort((a, b) => a.completed - b.completed);
  }

  // --- Render each task as a row ---
  filtered.forEach((task, idx) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${idx + 1}</td>
      <td>${task.name}</td>
      <td>${task.priority}</td>
      <td>${task.startDate}</td>
      <td>${task.dueDate}</td>
      <td>${task.notes}</td>
      <td><input type="checkbox" class="completeCheck" ${task.completed ? "checked" : ""}></td>
      <td><button class="edit">Edit</button></td>
      <td><button class="delete">Delete</button></td>
    `;

    // --- Complete Task Toggle ---
    row.querySelector(".completeCheck").addEventListener("change", (e) => {
      task.completed = e.target.checked;
      saveTasks();
      updateStats();
      updateProgress();
    });

    // --- Edit Task ---
    row.querySelector(".edit").addEventListener("click", () => {
      editingTaskId = task.id;
      document.getElementById("taskName").value = task.name;
      document.getElementById("taskPriority").value = task.priority;
      document.getElementById("startDate").value = task.startDate;
      document.getElementById("dueDate").value = task.dueDate;
      document.getElementById("taskNotes").value = task.notes;
      modal.style.display = "flex"; // Open modal with pre-filled data
    });

    // --- Delete Task ---
    row.querySelector(".delete").addEventListener("click", () => {
      tasks = tasks.filter(t => t.id !== task.id); // Remove from array
      saveTasks();
      renderTasks(); // Refresh table
    });

    taskTableBody.appendChild(row); // Add row to table
  });

  // Update stats and progress circle
  updateStats();
  updateProgress();
}

// ===== Search & Sort =====
// Re-render table when typing in search or changing sort option
searchBar.addEventListener("input", renderTasks);
sortOptions.addEventListener("change", renderTasks);

// ===== Stats =====
// Updates dashboard counters
function updateStats() {
  document.getElementById("totalTasks").textContent = tasks.length;
  document.getElementById("lowCount").textContent = tasks.filter(t => t.priority === "Low").length;
  document.getElementById("mediumCount").textContent = tasks.filter(t => t.priority === "Medium").length;
  document.getElementById("highCount").textContent = tasks.filter(t => t.priority === "High").length;
  document.getElementById("completedCount").textContent = tasks.filter(t => t.completed).length;
  document.getElementById("inProgressCount").textContent = tasks.filter(t => !t.completed).length;
}

// ===== Progress Circle =====
// Updates circular graph based on completed tasks
function updateProgress() {
  let total = tasks.length;
  let completed = tasks.filter(t => t.completed).length;
  let percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Update text inside circle
  progressPercent.textContent = `${percent}%`;

  // Update conic gradient for circular progress bar
  progressBox.style.background = `conic-gradient(
    #4caf50 ${percent * 3.6}deg,  /* Green arc showing completion */
    #e2e8f0 ${percent * 3.6}deg   /* Gray remainder */
  )`;
}
