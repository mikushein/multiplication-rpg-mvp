import { monsters } from "./monsters.js";

function resolveApiUrl() {
  // Supports local dev and production without code edits.
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return "http://localhost:5000/api";
  }

  const override = window.__API_BASE_URL__;
  if (override) {
    return `${override.replace(/\/$/, "")}/api`;
  }

  // Fallback for same-origin hosting.
  return "/api";
}

const API_URL = resolveApiUrl();

const landingPage = document.getElementById("landing-page");
const studentAuthPage = document.getElementById("student-auth-page");
const postLoginMenuPage = document.getElementById("post-login-menu-page");
const teacherLoginPage = document.getElementById("teacher-login-page");
const teacherDashboardPage = document.getElementById("teacher-dashboard-page");
const teacherEntryButton = document.getElementById("teacher-entry-btn");
const teacherPasswordInput = document.getElementById("teacher-password-input");
const teacherBackButton = document.getElementById("teacher-back-btn");
const teacherLoginBtn = document.getElementById("teacher-login-btn");
const teacherLoginMessage = document.getElementById("teacher-login-message");
const teacherLogoutBtn = document.getElementById("teacher-logout-btn");
const classFilter = document.getElementById("class-filter");
const studentsTableBody = document.getElementById("students-tbody");
const progressChart = document.getElementById("teacher-progress-chart");
const summaryTotalStudents = document.getElementById("summary-total-students");
const summaryAverageAccuracy = document.getElementById("summary-average-accuracy");
const summarySupportCount = document.getElementById("summary-support-count");
const teacherSupportList = document.getElementById("teacher-support-list");
const teacherStrongList = document.getElementById("teacher-strong-list");
const teacherPhaseList = document.getElementById("teacher-phase-list");
const teacherMissedList = document.getElementById("teacher-missed-list");
const teacherStudentDetail = document.getElementById("teacher-student-detail");

function showTeacherLogin() {
  landingPage.classList.add("hidden");
  studentAuthPage.classList.add("hidden");
  postLoginMenuPage.classList.add("hidden");
  teacherLoginPage.classList.remove("hidden");
  teacherDashboardPage.classList.add("hidden");
  teacherPasswordInput.value = "";
  teacherLoginMessage.textContent = "";
}

function showTeacherDashboard() {
  landingPage.classList.add("hidden");
  studentAuthPage.classList.add("hidden");
  postLoginMenuPage.classList.add("hidden");
  teacherLoginPage.classList.add("hidden");
  teacherDashboardPage.classList.remove("hidden");
  loadClassesAndStudents();
}

teacherEntryButton.addEventListener("click", () => {
  showTeacherLogin();
});

teacherBackButton.addEventListener("click", () => {
  landingPage.classList.remove("hidden");
  studentAuthPage.classList.add("hidden");
  postLoginMenuPage.classList.add("hidden");
  teacherLoginPage.classList.add("hidden");
  teacherDashboardPage.classList.add("hidden");
});

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

teacherLogoutBtn.addEventListener("click", () => {
  showTeacherLogin();
});

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

    await Promise.all([loadAnalyticsOverview(), loadStudents()]);
  } catch (error) {
    console.error("Error loading classes:", error);
  }
}

function renderProgressChart(students) {
  if (!progressChart) return;

  const entries = Array.isArray(students)
    ? students
        .map((student) => ({
          username: student.username || "Student",
          progress: Math.max(0, Math.min(100, Number(student.progress) || 0))
        }))
        .sort((a, b) => b.progress - a.progress)
        .slice(0, 8)
    : [];

  if (!entries.length) {
    progressChart.innerHTML = `
      <rect x="0" y="0" width="320" height="180" rx="16" fill="rgba(17,24,39,0.35)"></rect>
      <text x="160" y="92" text-anchor="middle" fill="#f3f4f6" font-size="14">No student data yet</text>
    `;
    return;
  }

  const width = 320;
  const height = 180;
  const padding = { top: 18, right: 20, bottom: 38, left: 36 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(100, ...entries.map((entry) => entry.progress));
  const gap = 12;
  const barWidth = Math.max(24, (innerWidth - gap * (entries.length - 1)) / entries.length);

  const gridLines = Array.from({ length: 4 }, (_, index) => {
    const y = padding.top + (innerHeight / 3) * index;
    return `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="rgba(255,255,255,0.12)" stroke-dasharray="3 3"></line>`;
  }).join("");

  const bars = entries.map((entry, index) => {
    const barHeight = (entry.progress / maxValue) * innerHeight;
    const x = padding.left + index * (barWidth + gap);
    const y = padding.top + innerHeight - barHeight;
    const label = entry.username.length > 10 ? `${entry.username.slice(0, 10)}...` : entry.username;

    return `
      <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="8" fill="url(#barGradient)"></rect>
      <text x="${x + barWidth / 2}" y="${height - 12}" text-anchor="middle" fill="#d1d5db" font-size="10">${label}</text>
      <text x="${x + barWidth / 2}" y="${y - 6}" text-anchor="middle" fill="#fef3c7" font-size="10">${entry.progress}%</text>
    `;
  }).join("");

  progressChart.innerHTML = `
    <defs>
      <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#60a5fa"></stop>
        <stop offset="100%" stop-color="#34d399"></stop>
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="320" height="180" rx="16" fill="rgba(17,24,39,0.25)"></rect>
    ${gridLines}
    ${bars}
  `;
}

async function loadAnalyticsOverview() {
  try {
    const classSection = classFilter.value || "";
    const encodedSection = encodeURIComponent(classSection);
    const url = classSection
      ? `${API_URL}/teacher/analytics/overview?classSection=${encodedSection}`
      : `${API_URL}/teacher/analytics/overview`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.success) {
      const {
        overview = {},
        studentsNeedingSupport = [],
        strongestStudents = [],
        phaseMastery = [],
        missedQuestions = []
      } = data.data || {};
      const totalStudents = Number(overview.totalStudents) || 0;
      const averageAccuracy = Number(overview.averageAccuracy) || 0;
      const supportCount = Number(overview.studentsNeedingSupport) || 0;

      if (summaryTotalStudents) {
        summaryTotalStudents.textContent = totalStudents;
        summaryAverageAccuracy.textContent = `${averageAccuracy}%`;
        summarySupportCount.textContent = supportCount;
      }

      if (teacherSupportList) {
        teacherSupportList.innerHTML = studentsNeedingSupport.length
          ? studentsNeedingSupport
              .map((student) => `<li>${student.fullName || student.username} · ${Math.round(student.accuracy || 0)}% accuracy</li>`)
              .join("")
          : "<li>No students need immediate support yet.</li>";
      }

      if (teacherStrongList) {
        teacherStrongList.innerHTML = strongestStudents.length
          ? strongestStudents
              .map((student) => `<li>${student.fullName || student.username} · ${Math.round(student.progress || 0)}% progress</li>`)
              .join("")
          : "<li>No strong performers yet.</li>";
      }

      if (teacherPhaseList) {
        teacherPhaseList.innerHTML = phaseMastery.length
          ? phaseMastery
              .map((phase) => `<li>Phase ${phase.phase} · ${phase.accuracy}% accuracy</li>`)
              .join("")
          : "<li>No phase data yet.</li>";
      }

      if (teacherMissedList) {
        teacherMissedList.innerHTML = missedQuestions.length
          ? missedQuestions
              .map((entry) => `<li>${entry.question} · ${entry.incorrectCount} misses</li>`)
              .join("")
          : "<li>No missed questions yet.</li>";
      }
    }
  } catch (error) {
    console.error("Error loading analytics overview:", error);
  }
}

async function loadStudents() {
  try {
    const classSection = classFilter.value || "";
    const encodedSection = encodeURIComponent(classSection);
    const url = classSection
      ? `${API_URL}/teacher/students?classSection=${encodedSection}`
      : `${API_URL}/teacher/students`;

    const response = await fetch(url);
    const data = await response.json();

    studentsTableBody.innerHTML = "";

    if (data.success && data.data.length > 0) {
      renderProgressChart(data.data);
      data.data.forEach((student) => {
        const row = document.createElement("tr");
        const safeLevelIndex = Math.max(0, Math.min(student.currentLevel || 0, monsters.length - 1));
        const monster = monsters[safeLevelIndex] || monsters[0];
        const levelLabel = `${monster.name} • P${monster.phase} • L${monster.level}`;
        const progressPercent = Math.round(student.progress);

        const accuracyPercent = Math.max(0, Math.min(100, Number(student.accuracy) || 0));
        const sessionsPlayed = Number(student.sessionsPlayed) || 0;

        row.innerHTML = `
          <td>${student.fullName || student.username}</td>
          <td>${student.classSection}</td>
          <td>${levelLabel}</td>
          <td>${student.xp}</td>
          <td>${accuracyPercent}%</td>
          <td>${sessionsPlayed}</td>
          <td>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${progressPercent}%">
                ${progressPercent}%
              </div>
            </div>
          </td>
        `;
        row.addEventListener("click", () => {
          renderStudentDetail(student);
        });
        studentsTableBody.appendChild(row);
      });

      const firstStudent = data.data[0];
      if (firstStudent) {
        renderStudentDetail(firstStudent);
      }
    } else {
      renderProgressChart([]);
      if (teacherStudentDetail) {
        teacherStudentDetail.innerHTML = "No student data is available for this class yet.";
      }
      studentsTableBody.innerHTML = '<tr><td colspan="7">No students found</td></tr>';
    }
  } catch (error) {
    console.error("Error loading students:", error);
    renderProgressChart([]);
    if (teacherStudentDetail) {
      teacherStudentDetail.innerHTML = "The student dashboard could not be loaded right now.";
    }
    studentsTableBody.innerHTML = '<tr><td colspan="7">Error loading students</td></tr>';
  }
}

function renderStudentDetail(student) {
  if (!teacherStudentDetail) return;

  const fullName = student.fullName || student.username || "Student";
  const accuracyPercent = Math.max(0, Math.min(100, Number(student.accuracy) || 0));
  const progressPercent = Math.max(0, Math.min(100, Number(student.progress) || 0));
  const sessionsPlayed = Number(student.sessionsPlayed) || 0;

  teacherStudentDetail.innerHTML = `
    <div><strong>${fullName}</strong></div>
    <div>Class: ${student.classSection || "—"}</div>
    <div>Current level: ${student.currentLevel || 0}</div>
    <div>XP: ${student.xp || 0}</div>
    <div>Accuracy: ${accuracyPercent}%</div>
    <div>Sessions played: ${sessionsPlayed}</div>
    <div>Progress: ${progressPercent}%</div>
  `;
}

classFilter.addEventListener("change", () => {
  Promise.all([loadAnalyticsOverview(), loadStudents()]);
});
