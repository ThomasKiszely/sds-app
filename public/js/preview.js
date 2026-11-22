// Små klik-effekter på Preview-siderne, så faner, valg og tællere føles
// levende. Intet bliver gemt.
(function () {
    if (window.__previewRegistered) return;
    window.__previewRegistered = true;

    document.addEventListener("click", (evt) => {
        const groupButton = evt.target.closest("[data-toggle-group] > button");
        if (groupButton) {
            groupButton.parentElement.querySelectorAll(":scope > button").forEach(b => b.classList.remove("is-active"));
            groupButton.classList.add("is-active");
            return;
        }

        const step = evt.target.closest("[data-stepper] [data-step]");
        if (step) {
            const output = step.closest("[data-stepper]").querySelector("output");
            const next = Math.max(0, (parseInt(output.textContent, 10) || 0) + Number(step.dataset.step));
            output.textContent = String(next);
        }
    });
})();
