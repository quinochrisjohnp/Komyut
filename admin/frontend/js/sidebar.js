// Highlight the active menu item based on the current page
const currentPage = window.location.pathname.split("/").pop(); // e.g. 'feedback.html'
const menuItems = document.querySelectorAll(".menu li");

menuItems.forEach(item => {
  const link = item.querySelector("a");
  if (link && link.getAttribute("href") === currentPage) {
    item.classList.add("active");
  } else {
    item.classList.remove("active");
  }
});
