function setupSearch() {
    const searchInput = document.querySelector(".search-input-route");
    searchInput.addEventListener("input", () => {
    const searchValue = searchInput.value.toLowerCase();
    const rows = document.querySelectorAll(".scrollable-body2 tr");
    rows.forEach((row) => {
        const username = row.cells[0]?.textContent.toLowerCase() || "";
        const message = row.cells[1]?.textContent.toLowerCase() || "";
        row.style.display =
        username.includes(searchValue) || message.includes(searchValue)
            ? ""
            : "none";
    });
    });
}