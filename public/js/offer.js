function wireOfferAdvancedToggle(root) {
    const btn = root.querySelector("#toggleAdvancedBtn");
    const box = root.querySelector("#advanced");

    if (btn && box) {
        btn.addEventListener("click", () => {
            box.classList.toggle("hidden");
        });
    }
}

// Når hele siden loader (første gang)
document.addEventListener("DOMContentLoaded", () => {
    wireOfferAdvancedToggle(document);
});

// Når HTMX har swappet nyt indhold ind (fx tilbudssiden)
document.body.addEventListener("htmx:afterSwap", (e) => {
    wireOfferAdvancedToggle(e.target);
});
