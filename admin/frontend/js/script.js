const menuItems = document.querySelectorAll("#menu li");
const pages = document.querySelectorAll(".page");

menuItems.forEach(item => {
  item.addEventListener("click", () => {
    
    // Remove active from sidebar
    document.querySelector(".menu .active")?.classList.remove("active");
    item.classList.add("active");

    // Hide all pages
    pages.forEach(page => page.classList.remove("active-page"));
    
    // Show selected page
    const targetPage = document.getElementById("page-" + item.dataset.page);
    if (targetPage) targetPage.classList.add("active-page");

    // Optional: logout action
    if (item.dataset.page === "logout") {
      alert("Logging out...");
    }
  });
});

// Elements
const modal = document.getElementById("addRouteModal");
const openBtn = document.getElementById("openAddRouteModal");
const closeBtn = document.getElementById("closeModal");

// ✅ OPEN
openBtn.onclick = () => {
  modal.style.display = "block";
};

// ✅ CLOSE
closeBtn.onclick = () => {
  modal.style.display = "none";
};

// ✅ Close when clicking outside
window.onclick = (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
  }
};


