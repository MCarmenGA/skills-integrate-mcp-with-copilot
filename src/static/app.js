document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const loginForm = document.getElementById("login-form");
  const loginMessage = document.getElementById("login-message");
  const signupContainer = document.getElementById("signup-container");

  let isAdmin = localStorage.getItem("admin_logged_in") === "true";

  updateAdminUI();

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons only if admin
        let participantsHTML;
        if (details.participants.length > 0) {
          participantsHTML = `<div class="participants-section">
            <h5>Participants:</h5>
            <ul class="participants-list">
              ${details.participants
                .map(
                  (email) =>
                    `<li><span class="participant-email">${email}</span>${
                      isAdmin
                        ? `<button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button>`
                        : ""
                    }</li>`
                )
                .join("")}
            </ul>
          </div>`;
        } else {
          participantsHTML = `<p><em>No participants yet</em></p>`;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
          ${
            isAdmin
              ? `<button class="signup-btn" data-activity="${name}">Sign Up Student</button>`
              : ""
          }
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown only if admin
        if (isAdmin) {
          const option = document.createElement("option");
          option.value = name;
          option.textContent = name;
          activitySelect.appendChild(option);
        }
      });

      // Add event listeners to delete buttons if admin
      if (isAdmin) {
        document.querySelectorAll(".delete-btn").forEach((button) => {
          button.addEventListener("click", handleUnregister);
        });
        document.querySelectorAll(".signup-btn").forEach((button) => {
          button.addEventListener("click", handleSignup);
        });
      }
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle signup from card button
  async function handleSignup(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = prompt("Enter student email:");
    if (!email) return;

    try {
      const response = await fetch(`/activities/${encodeURIComponent(activity)}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ email }),
      });

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");
    } catch (error) {
      messageDiv.textContent = "Network error";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");
    } catch (error) {
      messageDiv.textContent = "Network error";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
    }
  }

  // Handle signup form submission
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(signupForm);
    const email = formData.get("email");
    const activity = formData.get("activity");

    try {
      const response = await fetch(`/activities/${encodeURIComponent(activity)}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ email }),
      });

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");
    } catch (error) {
      messageDiv.textContent = "Network error";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
    }
  });

  // Handle login form submission
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(loginForm);
    const username = formData.get("username");
    const password = formData.get("password");

    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ username, password }),
      });

      const result = await response.json();

      if (response.ok) {
        isAdmin = true;
        localStorage.setItem("admin_logged_in", "true");
        updateAdminUI();
        fetchActivities();
        hideLogin();
        loginMessage.classList.add("hidden");
      } else {
        loginMessage.textContent = result.detail || "Login failed";
        loginMessage.className = "error";
        loginMessage.classList.remove("hidden");
      }
    } catch (error) {
      loginMessage.textContent = "Network error";
      loginMessage.className = "error";
      loginMessage.classList.remove("hidden");
    }
  });

  function updateAdminUI() {
    if (isAdmin) {
      loginBtn.style.display = "none";
      logoutBtn.style.display = "inline-block";
      signupContainer.style.display = "block";
    } else {
      loginBtn.style.display = "inline-block";
      logoutBtn.style.display = "none";
      signupContainer.style.display = "none";
    }
  }

  function showLogin() {
    document.getElementById("login-modal").style.display = "block";
  }

  function hideLogin() {
    document.getElementById("login-modal").style.display = "none";
    loginForm.reset();
    loginMessage.classList.add("hidden");
  }

  function logout() {
    isAdmin = false;
    localStorage.removeItem("admin_logged_in");
    updateAdminUI();
    fetchActivities();
  }

  // Initial load
  fetchActivities();
});
