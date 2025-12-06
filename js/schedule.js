const dayInput = document.getElementById("dayInput");
const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const scheduleBody = document.getElementById("scheduleBody");

function loadSchedule() {
  const data = JSON.parse(localStorage.getItem("schedule")) || [];
  scheduleBody.innerHTML = "";
  data.forEach((item, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.day}</td>
      <td>${item.task}</td>
      <td><input type="checkbox" ${item.done ? "checked" : ""} onchange="toggleDone(${index}, this.checked)"></td>
      <td><button onclick="deleteRow(${index})" class="delete-btn">🗑️ حذف</button></td>
    `;
    scheduleBody.appendChild(row);
  });
}

function addSchedule() {
  const day = dayInput.value.trim();
  const task = taskInput.value.trim();
  if (!day || !task) {
    alert("يرجى إدخال اليوم والمهمة معًا.");
    return;
  }
  const data = JSON.parse(localStorage.getItem("schedule")) || [];
  data.push({ day, task, done: false });
  localStorage.setItem("schedule", JSON.stringify(data));
  dayInput.value = "";
  taskInput.value = "";
  loadSchedule();
}

function deleteRow(index) {
  const data = JSON.parse(localStorage.getItem("schedule")) || [];
  data.splice(index, 1);
  localStorage.setItem("schedule", JSON.stringify(data));
  loadSchedule();
}

function toggleDone(index, value) {
  const data = JSON.parse(localStorage.getItem("schedule")) || [];
  data[index].done = value;
  localStorage.setItem("schedule", JSON.stringify(data));
}

addBtn.addEventListener("click", addSchedule);
window.addEventListener("DOMContentLoaded", loadSchedule);
