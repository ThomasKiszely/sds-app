function wireOfferAdvancedToggle(root) {
    const btn = root.querySelector("#toggleAdvancedBtn");
    const box = root.querySelector("#advanced");

    if (btn && box && !btn._advancedBound) {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            box.classList.toggle("hidden");
        });
        btn._advancedBound = true;
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
