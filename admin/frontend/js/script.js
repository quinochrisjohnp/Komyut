// Sidebar toggle for mobile
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("active");
}

// Load pages dynamically
function loadPage(page, element) {
  fetch(page)
    .then(response => {
      if (!response.ok) throw new Error("Page not found");
      return response.text();
    })
    .then(data => {
      document.getElementById("content-area").innerHTML = data;

      // Update active sidebar link
      const links = document.querySelectorAll(".sidebar nav ul li a");
      links.forEach(link => link.classList.remove("active"));
      if (element) element.classList.add("active");

      // 🟢 Re-initialize button and table logic after new content is loaded
      initTableButtons();
      activateFirstTableButton();
    })
    .catch(error => {
      document.getElementById("content-area").innerHTML = "<p>Error loading page.</p>";
      console.error(error);
    });
}

// Load Dashboard by default
window.onload = () => {
  loadPage("pages/dashboard.html", document.querySelector(".sidebar nav ul li a"));
};

/* ===============================
   Admin Login (DEMO MODE)
   - runs only on pages with <body class="login-page">
   - no real auth yet; basic checks + redirect
   =============================== */
(() => {
  const HOME_URL  = 'index.html';  // saan pupunta after "login"
  const LOGIN_URL = 'login.html';  // canonical login page (root)
  const TOKEN_KEY = 'adminAuth';   // demo token key

  function initLogin() {
    // tatakbo lang sa login page
    if (!document.body.classList.contains('login-page')) return;

    const form = document.querySelector('.login-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const email = document.getElementById('email')?.value.trim();
      const pass  = document.getElementById('password')?.value.trim();

      if (!email || !pass) {
        alert('Please enter email and password.');
        return;
      }
      const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!okEmail) {
        alert('Please enter a valid email.');
        return;
      }

      // DEMO ONLY: “mark as logged in” for this tab
      sessionStorage.setItem(TOKEN_KEY, 'demo-ok');

      // go to homepage
      window.location.href = HOME_URL;
    });
  }

  // Optional: guard sa homepage (index.html)
  function guardHome() {
    if (!document.body.classList.contains('guard-index')) return;
    if (sessionStorage.getItem(TOKEN_KEY) !== 'demo-ok') {
      window.location.href = LOGIN_URL;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    initLogin();
    guardHome();
  });
})();


//DASHBOARD PART//
/* Dashboard actions (safe placeholders; replace later) */
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;

  const action = btn.getAttribute("data-action");
  // TODO: wire these to real pages/modals/requests later
});

/* ===== Dashboard modals (final) ===== */
const openModal = (id) => {
  const m = document.getElementById(id);
  if (!m) return;
  m.hidden = false;
  document.body.classList.add("modal-open");
  const f = m.querySelector("input,select,textarea,button");
  if (f) setTimeout(()=>f.focus(), 0);
};
const closeModal = (el) => {
  if (!el) return;
  el.hidden = true;
  if (!document.querySelector(".modal:not([hidden])")) {
    document.body.classList.remove("modal-open");
  }
};

document.addEventListener("click", (e) => {
  // open by action
  const btn = e.target.closest("[data-action]");
  if (btn) {
    const action = btn.getAttribute("data-action");
    if (action === "view-feedback") openModal("modal-feedback");
    if (action === "add-route")     openModal("modal-add-route");
    if (action === "send-system")   openModal("modal-send");
  }

  // close (×, Close button, or overlay)
  if (e.target.closest("[data-close]")) {
    closeModal(e.target.closest(".modal"));
  }
  if (e.target.classList.contains("modal")) {
    closeModal(e.target);
  }

  // swap start/destination in Add Route
  if (e.target.closest(".swap")) {
    const wrap = e.target.closest(".route-form");
    const a = wrap.querySelector("input[name='start']");
    const b = wrap.querySelector("input[name='destination']");
    [a.value, b.value] = [b.value, a.value];
  }
});

// ESC closes the topmost modal
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const open = document.querySelector(".modal:not([hidden])");
    if (open) closeModal(open);
  }
});



// Set default password icons for hidden passwords
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".password-wrapper").forEach(wrapper => {
    const passwordSpan = wrapper.querySelector(".password-text");
    const icon = wrapper.querySelector(".material-symbols-outlined");

    // Only set icon if password is hidden (•)
    if (passwordSpan.textContent.includes("•")) {
      icon.textContent = "visibility_off"; // eye with slash
    }
  });
});


/* ===== USERS PAGE: Password toggle logic ===== */
document.addEventListener("click", (e) => {
  const button = e.target.closest(".toggle-password");
  if (!button) return;

  const wrapper = button.closest(".password-wrapper");
  const passwordSpan = wrapper.querySelector(".password-text");
  const icon = button.querySelector(".material-symbols-outlined");

  const isHidden = passwordSpan.textContent.includes("•"); // check actual content

  if (isHidden) {
    // Show password → eye icon
    passwordSpan.textContent = passwordSpan.dataset.password;
    icon.textContent = "visibility"; // plain eye
  } else {
    // Hide password → eye with slash icon
    passwordSpan.textContent = "•".repeat(passwordSpan.dataset.password.length);
    icon.textContent = "visibility_off"; // eye with slash
  }
});



/* ===== Table switcher buttons ===== */
function initTableButtons() {
  const buttonContainer = document.querySelector('.row2'); // parent of all .buttonz
  if (!buttonContainer) return;

  buttonContainer.addEventListener('click', (event) => {
    const button = event.target.closest('.buttonz');
    if (!button) return;

    const tableId = button.getAttribute('data-table');
    if (!tableId) return;

    // Hide all tables
    document.querySelectorAll('.table-container').forEach(table => {
      table.classList.remove('active');
    });

    // Show selected table
    const tableToShow = document.getElementById(tableId);
    if (tableToShow) tableToShow.classList.add('active');

    // Highlight clicked button
    document.querySelectorAll('.buttonz').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
  });
}

function activateFirstTableButton() {
  const firstButton = document.querySelector('.buttonz');
  if (!firstButton) return;

  const tableId = firstButton.getAttribute('data-table');
  if (!tableId) return;

  firstButton.classList.add('active');

  const tableToShow = document.getElementById(tableId);
  if (tableToShow) tableToShow.classList.add('active');
}



// System Settings
function initSettingsPage() {
  console.log("Settings page loaded");

  // Toggle switches
  const maintenanceToggle = document.getElementById("maintenanceMode");
  const updateToggle = document.getElementById("updateMode");

  maintenanceToggle?.addEventListener("change", () => {
    console.log("Maintenance Mode:", maintenanceToggle.checked ? "ON" : "OFF");
  });

  updateToggle?.addEventListener("change", () => {
    console.log("Update Mode:", updateToggle.checked ? "ON" : "OFF");
  });

  // Dropdown
  const loginAttemptLimit = document.getElementById("loginAttemptLimit");
  loginAttemptLimit?.addEventListener("change", () => {
    console.log("Login Attempt Limit set to:", loginAttemptLimit.value);
  });

  // Edit button
  const editButton = document.getElementById("editPasswordPolicy");
  editButton?.addEventListener("click", () => {
    alert("Password Policy modal will go here later.");
  });
}

// Placeholder for filtering logic
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const dateRange = document.getElementById("dateRange");
  const actionType = document.getElementById("actionType");

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      console.log("Searching:", searchInput.value);
    });
  }

  if (dateRange) {
    dateRange.addEventListener("change", () => {
      console.log("Date filter:", dateRange.value);
    });
  }

  if (actionType) {
    actionType.addEventListener("change", () => {
      console.log("Action filter:", actionType.value);
    });
  }
});



function confirmLogout() {
  const ok = confirm("Are you sure you want to logout?");
  if (ok) {
    // Proceed to logout page
    window.location.href = "login.html";
    return true;
  } else {
    // Cancel logout
    return false;
  }
}





