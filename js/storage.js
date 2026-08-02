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

export async function createUser(username, classSection, password, fullName = "") {
  try {
    const response = await fetch(`${API_URL}/user/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, classSection, password, fullName })
    });

    const data = await response.json();
    if (data.success) {
      console.log("✅ User created:", username);
      return data;
    } else {
      console.error("Failed to create user:", data.message);
      return null;
    }
  } catch (error) {
    console.error("Error creating user:", error);
    return null;
  }
}

export async function loginUser(username, password) {
  try {
    const response = await fetch(`${API_URL}/user/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    if (data.success) {
      console.log("✅ User logged in:", username);
      return data;
    } else {
      console.error("Failed to login:", data.message);
      return null;
    }
  } catch (error) {
    console.error("Error logging in:", error);
    return null;
  }
}

export async function saveGame(state) {
  try {
    const payload = {
      username: state.username,
      currentLevel: state.levelIndex,
      xp: state.xp,
      playerHp: state.hp
    };

    const response = await fetch(`${API_URL}/game/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (data.success) {
      console.log("✅ Game saved to MongoDB");
      return data;
    } else {
      console.error("Failed to save game:", data.message);
      return null;
    }
  } catch (error) {
    console.error("Error saving game:", error);
    return null;
  }
}

export async function loadGame(username) {
  try {
    const safeUsername = encodeURIComponent(username);
    const response = await fetch(`${API_URL}/game/load/${safeUsername}`, {
      method: "GET"
    });

    const data = await response.json();
    if (data.success) {
      console.log("✅ Game loaded from MongoDB");
      return {
        username: data.data.username,
        currentLevel: data.data.currentLevel,
        xp: data.data.xp,
        playerHp: data.data.playerHp
      };
    } else {
      console.error("Failed to load game:", data.message);
      return null;
    }
  } catch (error) {
    console.error("Error loading game:", error);
    return null;
  }
}

export async function fetchLeaderboard() {
  try {
    const response = await fetch(`${API_URL}/leaderboard`, {
      method: "GET"
    });

    const text = await response.text();

    if (!text) {
      console.error("Leaderboard endpoint returned no content.");
      return [];
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error("Leaderboard response was not valid JSON:", text);
      return [];
    }

    if (data.success) {
      return Array.isArray(data.data) ? data.data : [];
    }

    console.error("Failed to load leaderboard:", data.message || "Unknown error");
    return [];
  } catch (error) {
    console.error("Error loading leaderboard:", error);
    return [];
  }
}

export async function trackAnalyticsEvent(type, payload = {}) {
  try {
    const response = await fetch(`${API_URL}/analytics/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, ...payload })
    });

    const data = await response.json();
    if (data.success) {
      return data.data || data;
    }

    console.warn("Analytics tracking failed:", data.message || "Unknown error");
    return null;
  } catch (error) {
    console.warn("Analytics tracking unavailable:", error);
    return null;
  }
}
