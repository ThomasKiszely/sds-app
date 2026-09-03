document.body.addEventListener("click", (evt) => {
    const dropdown = document.querySelector(".dropdown");
    const target = evt.target;

    // Tilbage-knap
    if (target.closest("#topbarBackBtn")) {
        evt.preventDefault();
        evt.stopPropagation();

        if (typeof window.htmxBack === "function") {
            window.htmxBack();
        } else {
            console.warn("htmxBack funktion blev ikke fundet");
        }
        return;
    }

    if (!dropdown) return;

    // Hamburger: åbner/lukker menu
    if (target.closest(".hamburger")) {
        dropdown.classList.toggle("open");
        return;
    }

    // Username: lukker menu
    if (target.closest(".username")) {
        dropdown.classList.remove("open");
        return;
    }

    // Dropdown items: lukker menu efter navigation
    if (target.closest(".dropdown-item")) {
        dropdown.classList.remove("open");
        return;
    }
});
