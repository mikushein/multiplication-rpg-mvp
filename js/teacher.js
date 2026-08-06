import { monsters } from "./monsters.js";

function resolveApiUrl() {
  if (window.location.protocol === "file:") {
    return "http://localhost:5000/api";
  }

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
const summaryHighestScore = document.getElementById("summary-highest-score");
const summarySupportCount = document.getElementById("summary-support-count");
const teacherTrendChart = document.getElementById("teacher-trend-chart");
const teacherClassTrendChart = document.getElementById("teacher-class-trend-chart");
const teacherStudentSelect = document.getElementById("teacher-student-select");
const teacherStudentDetail = document.getElementById("teacher-student-detail");
const teacherClassTableBody = document.getElementById("teacher-class-table-body");
const teacherDifficultyChart = document.getElementById("teacher-difficulty-chart");
const teacherMistakesList = document.getElementById("teacher-mistakes-list");
const teacherRecommendationsList = document.getElementById("teacher-recommendations-list");
const teacherClassTab = document.getElementById("teacher-class-tab");
const teacherStudentTab = document.getElementById("teacher-student-tab");
const teacherClassView = document.getElementById("teacher-class-view");
const teacherStudentView = document.getElementById("teacher-student-view");

let dashboardStudents = [];
let selectedStudentUsername = "";

function clearStudentSelection() {
  if (!studentsTableBody) return;

  studentsTableBody.querySelectorAll("tr.student-table-row").forEach((tableRow) => {
    tableRow.classList.remove("is-selected");
  });
}

function getLevelLabel(student) {
  const safeLevelIndex = Math.max(0, Math.min(Number(student.currentLevel) || 0, monsters.length - 1));
  const monster = monsters[safeLevelIndex] || monsters[0];
  return `Phase ${monster.phase} · Level ${monster.level}`;
}

function calculateAccuracy(correctAnswers, incorrectAnswers) {
  const total = correctAnswers + incorrectAnswers;
  if (!total) {
    return 0;
  }

  return Math.round((correctAnswers / total) * 100);
}

function getPerformanceStatus(accuracy) {
  if (accuracy >= 80) {
    return { label: "Excellent", className: "good" };
  }

  if (accuracy >= 60) {
    return { label: "Developing", className: "warning" };
  }

  return { label: "Needs support", className: "bad" };
}

function parseMultiplicationTable(question) {
  if (typeof question !== "string") {
    return null;
  }

  const normalized = question.replace(/×/g, "x").replace(/\s+/g, " ").trim();
  const match = normalized.match(/(\d+)\s*x\s*(\d+)/i);
  if (!match) {
    return null;
  }

  return `${Number(match[1])}x`;
}

function buildTablePerformance(students) {
  const tableBuckets = {};

  students.forEach((student) => {
    const attempts = Array.isArray(student.attempts) ? student.attempts : [];

    attempts.forEach((attempt) => {
      const tableKey = parseMultiplicationTable(attempt.question);
      if (!tableKey) {
        return;
      }

      if (!tableBuckets[tableKey]) {
        tableBuckets[tableKey] = { table: tableKey, correct: 0, total: 0 };
      }

      tableBuckets[tableKey].total += 1;
      if (attempt.isCorrect) {
        tableBuckets[tableKey].correct += 1;
      }
    });
  });

  return Object.values(tableBuckets)
    .map((bucket) => ({
      ...bucket,
      accuracy: bucket.total ? calculateAccuracy(bucket.correct, bucket.total - bucket.correct) : 0,
      incorrect: bucket.total - bucket.correct
    }))
    .sort((a, b) => a.table.localeCompare(b.table));
}

function buildTrends(student) {
  if (!student || !Array.isArray(student.attempts)) {
    return [];
  }

  const attempts = student.attempts;
  const grouped = new Map();

  attempts.forEach((attempt) => {
    const timestamp = attempt.timestamp || attempt.createdAt;
    if (!timestamp) {
      return;
    }

    const dateValue = new Date(timestamp).toISOString().split("T")[0];
    if (!grouped.has(dateValue)) {
      grouped.set(dateValue, { date: dateValue, correct: 0, total: 0 });
    }

    const bucket = grouped.get(dateValue);
    bucket.total += 1;
    if (attempt.isCorrect) {
      bucket.correct += 1;
    }
  });

  return Array.from(grouped.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((entry) => ({
      ...entry,
      accuracy: calculateAccuracy(entry.correct, entry.total - entry.correct)
    }));
}

function buildCommonMistakes(students) {
  const mistakes = {};

  students.forEach((student) => {
    const attempts = Array.isArray(student.attempts) ? student.attempts : [];

    attempts.forEach((attempt) => {
      if (attempt.isCorrect) {
        return;
      }

      const question = typeof attempt.question === "string" && attempt.question.trim()
        ? attempt.question.trim()
        : "Unknown question";

      if (!mistakes[question]) {
        mistakes[question] = { question, incorrectCount: 0 };
      }

      mistakes[question].incorrectCount += 1;
    });
  });

  return Object.values(mistakes)
    .sort((a, b) => b.incorrectCount - a.incorrectCount)
    .slice(0, 6);
}

function populateStudentSelector(students) {
  if (!teacherStudentSelect) return;

  const currentValue = teacherStudentSelect.value || selectedStudentUsername;
  teacherStudentSelect.innerHTML = '<option value="">Select a student</option>';

  students.forEach((student) => {
    const option = document.createElement("option");
    option.value = student.username;
    option.textContent = student.fullName || student.username;
    teacherStudentSelect.appendChild(option);
  });

  if (currentValue) {
    teacherStudentSelect.value = currentValue;
  }
}

function selectStudent(username) {
  if (!username) {
    selectedStudentUsername = "";
    clearStudentSelection();
    renderStudentDetail(null);
    renderProgressChart(dashboardStudents);
    renderRecommendations(dashboardStudents);
    return;
  }

  selectedStudentUsername = username;
  clearStudentSelection();

  if (studentsTableBody) {
    const selectedRow = studentsTableBody.querySelector(`tr.student-table-row[data-username="${username}"]`);
    if (selectedRow) {
      selectedRow.classList.add("is-selected");
    }
  }

  const student = dashboardStudents.find((entry) => entry.username === username);
  renderStudentDetail(student || null);
  renderProgressChart(dashboardStudents);
  renderRecommendations(dashboardStudents);
}

function buildClassTrend(students) {
  const grouped = new Map();

  students.forEach((student) => {
    const attempts = Array.isArray(student.attempts) ? student.attempts : [];

    attempts.forEach((attempt) => {
      const timestamp = attempt.timestamp || attempt.createdAt;
      if (!timestamp) {
        return;
      }

      const dateValue = new Date(timestamp).toISOString().split("T")[0];
      if (!grouped.has(dateValue)) {
        grouped.set(dateValue, { date: dateValue, correct: 0, total: 0 });
      }

      const bucket = grouped.get(dateValue);
      bucket.total += 1;
      if (attempt.isCorrect) {
        bucket.correct += 1;
      }
    });
  });

  return Array.from(grouped.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((entry) => ({
      ...entry,
      accuracy: calculateAccuracy(entry.correct, entry.total - entry.correct)
    }));
}

function renderClassTrendChart(students) {
  if (!teacherClassTrendChart) return;

  const points = buildClassTrend(students);

  if (!points.length) {
    teacherClassTrendChart.innerHTML = '<div class="tutorial-chart-empty">No class activity yet.</div>';
    return;
  }

  const width = 320;
  const height = 180;
  const padding = { top: 18, right: 16, bottom: 28, left: 24 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const pointsMarkup = points.map((point, index) => {
    const x = padding.left + (index / Math.max(1, points.length - 1)) * innerWidth;
    const y = padding.top + innerHeight - ((point.accuracy / 100) * innerHeight);
    return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const dots = points.map((point, index) => {
    const x = padding.left + (index / Math.max(1, points.length - 1)) * innerWidth;
    const y = padding.top + innerHeight - ((point.accuracy / 100) * innerHeight);
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="#60a5fa"></circle>`;
  }).join('');

  const labels = points.map((point, index) => {
    const x = padding.left + (index / Math.max(1, points.length - 1)) * innerWidth;
    return `<text x="${x.toFixed(1)}" y="${height - 8}" fill="#cbd5e1" font-size="10" text-anchor="middle">${point.date.slice(5)}</text>`;
  }).join('');

  teacherClassTrendChart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Class accuracy trend chart">
      <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="rgba(255,255,255,0.16)"></line>
      <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="rgba(255,255,255,0.16)"></line>
      <path d="${pointsMarkup}" fill="none" stroke="#34d399" stroke-width="3" stroke-linecap="round"></path>
      ${dots}
      ${labels}
      <text x="${padding.left + innerWidth / 2}" y="${height - 4}" fill="#cbd5e1" font-size="10" text-anchor="middle">Date</text>
      <text x="10" y="${padding.top + innerHeight / 2}" fill="#cbd5e1" font-size="10" text-anchor="middle" transform="rotate(-90 10 ${padding.top + innerHeight / 2})">Accuracy %</text>
    </svg>
  `;
}

function renderClassOverviewTable(students) {
  if (!teacherClassTableBody) return;

  const classLabel = classFilter.value ? classFilter.value : "All Classes";
  const totalQuestions = students.reduce((sum, student) => {
    const attempts = Array.isArray(student.attempts) ? student.attempts : [];
    return sum + attempts.length;
  }, 0);
  const totalCorrect = students.reduce((sum, student) => {
    const attempts = Array.isArray(student.attempts) ? student.attempts : [];
    return sum + attempts.filter((attempt) => attempt.isCorrect).length;
  }, 0);
  const totalIncorrect = totalQuestions - totalCorrect;
  const averageAccuracy = totalQuestions ? calculateAccuracy(totalCorrect, totalIncorrect) : 0;
  const accuracies = students.map((student) => {
    const attempts = Array.isArray(student.attempts) ? student.attempts : [];
    const correct = attempts.filter((attempt) => attempt.isCorrect).length;
    const incorrect = attempts.filter((attempt) => !attempt.isCorrect).length;
    return calculateAccuracy(correct, incorrect);
  });
  const highestAccuracy = accuracies.length ? Math.max(...accuracies) : 0;
  const lowestAccuracy = accuracies.length ? Math.min(...accuracies) : 0;
  const supportCount = students.filter((student) => {
    const attempts = Array.isArray(student.attempts) ? student.attempts : [];
    const correct = attempts.filter((attempt) => attempt.isCorrect).length;
    const incorrect = attempts.filter((attempt) => !attempt.isCorrect).length;
    return calculateAccuracy(correct, incorrect) < 60;
  }).length;

  teacherClassTableBody.innerHTML = `
    <tr>
      <td>${classLabel}</td>
      <td>${students.length}</td>
      <td>${averageAccuracy}%</td>
      <td>${highestAccuracy}%</td>
      <td>${lowestAccuracy}%</td>
      <td>${supportCount}</td>
      <td>${totalQuestions}</td>
      <td>${totalCorrect}</td>
      <td>${totalIncorrect}</td>
    </tr>
  `;
}

function renderClassSummary(students) {
  const totalStudents = students.length;
  const totalCorrect = students.reduce((sum, student) => {
    const attempts = Array.isArray(student.attempts) ? student.attempts : [];
    return sum + attempts.filter((attempt) => attempt.isCorrect).length;
  }, 0);
  const totalAnswered = students.reduce((sum, student) => {
    const attempts = Array.isArray(student.attempts) ? student.attempts : [];
    return sum + attempts.length;
  }, 0);
  const averageAccuracy = totalAnswered ? calculateAccuracy(totalCorrect, totalAnswered - totalCorrect) : 0;
  const highestScore = students.reduce((highest, student) => Math.max(highest, Number(student.xp) || 0), 0);
  const supportCount = students.filter((student) => {
    const attempts = Array.isArray(student.attempts) ? student.attempts : [];
    const accuracy = calculateAccuracy(
      attempts.filter((attempt) => attempt.isCorrect).length,
      attempts.filter((attempt) => !attempt.isCorrect).length
    );
    const topicStats = buildTablePerformance([student]);
    const weakTopic = topicStats.some((entry) => entry.total >= 3 && entry.accuracy < 60);
    return accuracy < 60 || weakTopic;
  }).length;

  if (summaryTotalStudents) {
    summaryTotalStudents.textContent = totalStudents;
  }

  if (summaryAverageAccuracy) {
    summaryAverageAccuracy.textContent = `${averageAccuracy}%`;
  }

  if (summaryHighestScore) {
    summaryHighestScore.textContent = highestScore.toLocaleString();
  }

  if (summarySupportCount) {
    summarySupportCount.textContent = `${supportCount}`;
  }
}

function renderStudentTrendChart(student) {
  if (!teacherTrendChart) return;

  const points = buildTrends(student);

  if (!points.length) {
    teacherTrendChart.innerHTML = '<div class="tutorial-chart-empty">No recent attempts yet for this student.</div>';
    return;
  }

  const width = 320;
  const height = 180;
  const padding = { top: 18, right: 16, bottom: 28, left: 24 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const maxValue = 100;
  const minValue = 0;

  const pointsMarkup = points.map((point, index) => {
    const x = padding.left + (index / Math.max(1, points.length - 1)) * innerWidth;
    const y = padding.top + innerHeight - ((point.accuracy - minValue) / (maxValue - minValue || 1)) * innerHeight;
    return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  const dots = points.map((point, index) => {
    const x = padding.left + (index / Math.max(1, points.length - 1)) * innerWidth;
    const y = padding.top + innerHeight - ((point.accuracy - minValue) / (maxValue - minValue || 1)) * innerHeight;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="#34d399"></circle>`;
  }).join("");

  const labels = points.map((point, index) => {
    const x = padding.left + (index / Math.max(1, points.length - 1)) * innerWidth;
    return `<text x="${x.toFixed(1)}" y="${height - 8}" fill="#cbd5e1" font-size="10" text-anchor="middle">${index + 1}</text>`;
  }).join("");

  teacherTrendChart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Student progress line chart">
      <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="rgba(255,255,255,0.16)"></line>
      <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="rgba(255,255,255,0.16)"></line>
      <path d="${pointsMarkup}" fill="none" stroke="#60a5fa" stroke-width="3" stroke-linecap="round"></path>
      ${dots}
      ${labels}
      <text x="${padding.left + innerWidth / 2}" y="${height - 4}" fill="#cbd5e1" font-size="10" text-anchor="middle">Day</text>
      <text x="10" y="${padding.top + innerHeight / 2}" fill="#cbd5e1" font-size="10" text-anchor="middle" transform="rotate(-90 10 ${padding.top + innerHeight / 2})">Accuracy %</text>
    </svg>
  `;
}

function renderDifficultyChart(students) {
  if (!teacherDifficultyChart) return;

  const tableStats = buildTablePerformance(students);

  if (!tableStats.length) {
    teacherDifficultyChart.innerHTML = '<div class="tutorial-chart-empty">No multiplication data yet.</div>';
    return;
  }

  teacherDifficultyChart.innerHTML = `
    <div style="display:flex; justify-content:flex-end; color:#cbd5e1; font-size:11px; margin-bottom:6px;">Accuracy %</div>
    ${tableStats.map((entry) => {
      const fillColor = entry.accuracy >= 80 ? "#34d399" : entry.accuracy >= 60 ? "#fbbf24" : "#f87171";
      return `
        <div class="difficulty-bar-row">
          <strong>${entry.table}</strong>
          <div class="difficulty-bar-track">
            <div class="difficulty-bar-fill" style="width: ${Math.max(8, entry.accuracy)}%; background:${fillColor};"></div>
          </div>
          <span>${entry.accuracy}%</span>
        </div>
      `;
    }).join("")}
    <div style="margin-top:8px; color:#cbd5e1; font-size:11px;">Multiplication table</div>
  `;
}

function renderStudentDetail(student) {
  if (!teacherStudentDetail) return;

  if (!student) {
    teacherStudentDetail.innerHTML = '<p class="detail-placeholder">Select a student row to open their profile.</p>';
    return;
  }

  const attempts = Array.isArray(student.attempts) ? student.attempts : [];
  const correctAnswers = attempts.filter((attempt) => attempt.isCorrect).length;
  const incorrectAnswers = attempts.filter((attempt) => !attempt.isCorrect).length;
  const accuracy = calculateAccuracy(correctAnswers, incorrectAnswers);
  const averageResponseTime = attempts.length
    ? (attempts.reduce((sum, attempt) => sum + (Number(attempt.responseTimeSeconds) || 0), 0) / attempts.length).toFixed(1)
    : "0.0";
  const tableStats = buildTablePerformance([student]);
  const strongTables = tableStats.filter((entry) => entry.accuracy >= 80).slice(0, 3);
  const weakTables = tableStats.filter((entry) => entry.accuracy < 60).slice(0, 3);
  const recentResults = attempts.slice(-3).reverse();
  const status = getPerformanceStatus(accuracy);

  teacherStudentDetail.innerHTML = `
    <div class="student-detail-grid">
      <div class="detail-metric">
        <span>Student</span>
        <strong>${student.fullName || student.username}</strong>
      </div>
      <div class="detail-metric">
        <span>Current level</span>
        <strong>${getLevelLabel(student)}</strong>
      </div>
      <div class="detail-metric">
        <span>Total score</span>
        <strong>${Number(student.xp) || 0}</strong>
      </div>
      <div class="detail-metric">
        <span>Accuracy</span>
        <strong>${accuracy}%</strong>
      </div>
      <div class="detail-metric">
        <span>Questions answered</span>
        <strong>${attempts.length}</strong>
      </div>
      <div class="detail-metric">
        <span>Performance status</span>
        <strong><span class="status-pill ${status.className}">${status.label}</span></strong>
      </div>
    </div>

    <div class="detail-section">
      <h4>Strengths</h4>
      <p>${strongTables.length ? strongTables.map((entry) => entry.table).join(", ") : "No strong tables yet."}</p>
    </div>

    <div class="detail-section">
      <h4>Needs practice</h4>
      <p>${weakTables.length ? weakTables.map((entry) => entry.table).join(", ") : "No weak tables yet."}</p>
    </div>

    <div class="detail-section">
      <h4>Recent results</h4>
      <ul class="teacher-list">
        ${recentResults.length ? recentResults.map((entry) => `<li>${entry.question || "Question"} · ${entry.isCorrect ? "Correct" : "Incorrect"}</li>`).join("") : "<li>No recent attempts available.</li>"}
      </ul>
    </div>

    <div class="detail-section">
      <h4>Other metrics</h4>
      <p>Correct answers: ${correctAnswers} · Incorrect answers: ${incorrectAnswers} · Avg. response time: ${averageResponseTime}s</p>
    </div>
  `;
}

function renderCommonMistakes(students) {
  if (!teacherMistakesList) return;

  const mistakes = buildCommonMistakes(students);

  teacherMistakesList.innerHTML = mistakes.length
    ? mistakes.map((entry) => `<li>${entry.question} · ${entry.incorrectCount} incorrect attempts</li>`).join("")
    : "<li>No mistakes recorded yet.</li>";
}

function renderRecommendations(students) {
  if (!teacherRecommendationsList) return;

  const sourceStudents = Array.isArray(students) ? students : [];
  const selectedStudent = sourceStudents.find((student) => student.username === selectedStudentUsername);
  const studentList = selectedStudent ? [selectedStudent] : sourceStudents;
  const recommendations = [];

  studentList.forEach((student) => {
    const attempts = Array.isArray(student.attempts) ? student.attempts : [];
    const correctAnswers = attempts.filter((attempt) => attempt.isCorrect).length;
    const incorrectAnswers = attempts.filter((attempt) => !attempt.isCorrect).length;
    const accuracy = calculateAccuracy(correctAnswers, incorrectAnswers);
    const avgResponseTime = attempts.length
      ? attempts.reduce((sum, attempt) => sum + (Number(attempt.responseTimeSeconds) || 0), 0) / attempts.length
      : 0;
    const trendPoints = buildTrends(student);
    const recentAccuracy = trendPoints.length ? trendPoints[trendPoints.length - 1].accuracy : accuracy;
    const earlierAccuracy = trendPoints.length > 1 ? trendPoints[0].accuracy : accuracy;
    const weakTables = buildTablePerformance([student]).filter((entry) => entry.total >= 3 && entry.accuracy < 60);

    if (accuracy < 60 && weakTables.length) {
      recommendations.push(`Review the ${weakTables[0].table} table with ${student.fullName || student.username}.`);
    }

    if (avgResponseTime > 12 && accuracy < 80) {
      recommendations.push(`${student.fullName || student.username} is answering slowly; add short timed practice sessions.`);
    }

    if (trendPoints.length > 1 && recentAccuracy < earlierAccuracy - 8) {
      recommendations.push(`${student.fullName || student.username} shows a recent drop in accuracy; schedule a review session.`);
    }
  });

  if (!recommendations.length) {
    recommendations.push("Keep the current pace and introduce a new challenge level for confident learners.");
  }

  teacherRecommendationsList.innerHTML = recommendations.slice(0, 4).map((entry) => `<li>${entry}</li>`).join("");
}

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
  showDashboardView("class");
  loadClassesAndStudents();
}

function showDashboardView(viewName) {
  const isClassView = viewName === "class";

  if (teacherClassTab) {
    teacherClassTab.classList.toggle("active", isClassView);
  }

  if (teacherStudentTab) {
    teacherStudentTab.classList.toggle("active", !isClassView);
  }

  if (teacherClassView) {
    teacherClassView.classList.toggle("hidden", !isClassView);
  }

  if (teacherStudentView) {
    teacherStudentView.classList.toggle("hidden", isClassView);
  }
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

if (teacherClassTab) {
  teacherClassTab.addEventListener("click", () => showDashboardView("class"));
}

if (teacherStudentTab) {
  teacherStudentTab.addEventListener("click", () => showDashboardView("student"));
}

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
  if (!teacherTrendChart) return;

  const selectedStudent = students.find((student) => student.username === selectedStudentUsername);
  renderStudentTrendChart(selectedStudent || students[0] || null);
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
      const overview = data.data?.overview || {};
      if (summaryTotalStudents) {
        summaryTotalStudents.textContent = Number(overview.totalStudents) || 0;
      }
      if (summaryAverageAccuracy) {
        summaryAverageAccuracy.textContent = `${Number(overview.averageAccuracy) || 0}%`;
      }
      if (summarySupportCount) {
        summarySupportCount.textContent = Number(overview.studentsNeedingSupport) || 0;
      }

      if (dashboardStudents.length) {
        renderClassSummary(dashboardStudents);
        renderDifficultyChart(dashboardStudents);
        renderCommonMistakes(dashboardStudents);
        renderRecommendations(dashboardStudents);
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

    dashboardStudents = Array.isArray(data.data) ? data.data : [];

    if (studentsTableBody) {
      studentsTableBody.innerHTML = "";
    }

    if (dashboardStudents.length > 0) {
      if (studentsTableBody) {
        dashboardStudents.forEach((student) => {
          const row = document.createElement("tr");
          row.className = "student-table-row";
          row.dataset.username = student.username;

          const attempts = Array.isArray(student.attempts) ? student.attempts : [];
          const correctAnswers = attempts.filter((attempt) => attempt.isCorrect).length;
          const incorrectAnswers = attempts.filter((attempt) => !attempt.isCorrect).length;
          const accuracyPercent = calculateAccuracy(correctAnswers, incorrectAnswers);
          const averageResponseTime = attempts.length
            ? (attempts.reduce((sum, attempt) => sum + (Number(attempt.responseTimeSeconds) || 0), 0) / attempts.length).toFixed(1)
            : "0.0";
          const levelLabel = getLevelLabel(student);
          const status = getPerformanceStatus(accuracyPercent);

          row.innerHTML = `
            <td>${student.fullName || student.username}</td>
            <td>${levelLabel}</td>
            <td>${attempts.length}</td>
            <td>${correctAnswers}</td>
            <td>${incorrectAnswers}</td>
            <td>${accuracyPercent}%</td>
            <td>${averageResponseTime}s</td>
            <td>${Number(student.xp) || 0}</td>
            <td><span class="status-pill ${status.className}">${status.label}</span></td>
          `;
          studentsTableBody.appendChild(row);
        });
      }

      populateStudentSelector(dashboardStudents);

      const initialSelection = selectedStudentUsername
        ? dashboardStudents.find((student) => student.username === selectedStudentUsername)
        : dashboardStudents[0];

      if (initialSelection) {
        selectedStudentUsername = initialSelection.username;
        if (studentsTableBody) {
          const selectedRow = studentsTableBody.querySelector(`tr.student-table-row[data-username="${selectedStudentUsername}"]`);
          if (selectedRow) {
            selectedRow.classList.add("is-selected");
          }
        }
      }

      renderClassSummary(dashboardStudents);
      renderClassTrendChart(dashboardStudents);
      renderClassOverviewTable(dashboardStudents);
      renderProgressChart(dashboardStudents);
      renderDifficultyChart(dashboardStudents);
      renderCommonMistakes(dashboardStudents);
      renderRecommendations(dashboardStudents);
      renderStudentDetail(initialSelection || null);
    } else {
      dashboardStudents = [];
      selectedStudentUsername = "";
      populateStudentSelector([]);
      renderClassSummary([]);
      renderClassTrendChart([]);
      renderClassOverviewTable([]);
      renderProgressChart([]);
      renderDifficultyChart([]);
      renderCommonMistakes([]);
      renderRecommendations([]);
      renderStudentDetail(null);
      if (studentsTableBody) {
        studentsTableBody.innerHTML = '<tr><td colspan="9">No students found</td></tr>';
      }
    }
  } catch (error) {
    console.error("Error loading students:", error);
    dashboardStudents = [];
    selectedStudentUsername = "";
    populateStudentSelector([]);
    renderClassSummary([]);
    renderClassTrendChart([]);
    renderClassOverviewTable([]);
    renderProgressChart([]);
    renderDifficultyChart([]);
    renderCommonMistakes([]);
    renderRecommendations([]);
    renderStudentDetail(null);
    if (studentsTableBody) {
      studentsTableBody.innerHTML = '<tr><td colspan="9">Error loading students</td></tr>';
    }
  }
}

if (studentsTableBody) {
  studentsTableBody.addEventListener("click", (event) => {
    const selectedRow = event.target.closest("tr.student-table-row");
    if (!selectedRow) {
      return;
    }

    const username = selectedRow.dataset.username;
    if (teacherStudentSelect) {
      teacherStudentSelect.value = username;
    }
    selectStudent(username);
  });
}

if (teacherStudentSelect) {
  teacherStudentSelect.addEventListener("change", (event) => {
    selectStudent(event.target.value || "");
  });
}

if (classFilter) {
  classFilter.addEventListener("change", () => {
    Promise.all([loadAnalyticsOverview(), loadStudents()]);
  });
}
