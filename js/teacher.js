const API_URL = "http://localhost:5000/api";

// DOM Elements
const modeSelector = document.getElementById("mode-selector");
const studentModeBtn = document.getElementById("student-mode-btn");
const teacherModeBtn = document.getElementById("teacher-mode-btn");

const loginPage = document.getElementById("login-page");
const teacherLoginPage = document.getElementById("teacher-login-page");
const teacherDashboardPage = document.getElementById("teacher-dashboard-page");

const teacherPasswordInput = document.getElementById("teacher-password-input");
const teacherLoginBtn = document.getElementById("teacher-login-btn");
const teacherLoginMessage = document.getElementById("teacher-login-message");
const teacherLogoutBtn = document.getElementById("teacher-logout-btn");

const classFilter = document.getElementById("class-filter");
const studentsTableBody = document.getElementById("students-tbody");

// Mode Switching
studentModeBtn.addEventListener("click", () => {
  studentModeBtn.classList.add("active");
  teacherModeBtn.classList.remove("active");
  showStudentLogin();
});

teacherModeBtn.addEventListener("click", () => {
  teacherModeBtn.classList.add("active");
  studentModeBtn.classList.remove("active");
  showTeacherLogin();
});

function showStudentLogin() {
  loginPage.classList.remove("hidden");
  teacherLoginPage.classList.add("hidden");
  teacherDashboardPage.classList.add("hidden");
}

function showTeacherLogin() {
  loginPage.classList.add("hidden");
  teacherLoginPage.classList.remove("hidden");
  teacherDashboardPage.classList.add("hidden");
  teacherPasswordInput.value = "";
  teacherLoginMessage.textContent = "";
}

function showTeacherDashboard() {
  loginPage.classList.add("hidden");
  teacherLoginPage.classList.add("hidden");
  teacherDashboardPage.classList.remove("hidden");
  loadClassesAndStudents();
}

// Teacher Login
teacherLoginBtn.addEventListener("click", async () => {
  const password = teacherPasswordInput.value.trim();

  if (!password) {
    teacherLoginMessage.textContent = "❌ Please enter a password";
    return;
  }

  try {
    const response = await fetch(`${API_URL}/teacher/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });

    const data = await response.json();
    if (data.success) {
      teacherLoginMessage.textContent = "";
      showTeacherDashboard();
    } else {
      teacherLoginMessage.textContent = "❌ " + data.message;
    }
  } catch (error) {
    console.error("Error logging in:", error);
    teacherLoginMessage.textContent = "❌ Failed to connect to server";
  }
});

// Teacher Logout
teacherLogoutBtn.addEventListener("click", () => {
  showTeacherLogin();
});

// Load Classes
async function loadClassesAndStudents() {
  try {
    const classesResponse = await fetch(`${API_URL}/teacher/classes`);
    const classesData = await classesResponse.json();

    if (classesData.success) {
      const classes = classesData.data || [];
      classFilter.innerHTML = '<option value="">All Classes</option>';
      classes.forEach((cls) => {
        const option = document.createElement("option");
        option.value = cls;
        option.textContent = cls;
        classFilter.appendChild(option);
      });
    }

    loadStudents();
  } catch (error) {
    console.error("Error loading classes:", error);
  }
}

// Load Students
async function loadStudents() {
  try {
    const classSection = classFilter.value || "";
    const url = classSection
      ? `${API_URL}/teacher/students?classSection=${classSection}`
      : `${API_URL}/teacher/students`;

    const response = await fetch(url);
    const data = await response.json();

    studentsTableBody.innerHTML = "";

    if (data.success && data.data.length > 0) {
      data.data.forEach((student) => {
        const row = document.createElement("tr");
        const levelNames = [
          "Slime",
          "Goblin",
          "Wolf",
          "Orc",
          "Boss"
        ];
        const levelName = levelNames[student.currentLevel] || "Unknown";
        const progressPercent = Math.round(student.progress);

        row.innerHTML = `
          <td>${student.username}</td>
          <td>${student.classSection}</td>
          <td>${levelName} (${student.currentLevel})</td>
          <td>${student.xp}</td>
          <td>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${progressPercent}%">
                ${progressPercent}%
              </div>
            </div>
          </td>
        `;
        studentsTableBody.appendChild(row);
      });
    } else {
      studentsTableBody.innerHTML = '<tr><td colspan="5">No students found</td></tr>';
    }
  } catch (error) {
    console.error("Error loading students:", error);
    studentsTableBody.innerHTML = '<tr><td colspan="5">Error loading students</td></tr>';
  }
}

// Filter Change
classFilter.addEventListener("change", () => {
  loadStudents();
});
