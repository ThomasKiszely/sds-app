let htmxHistory = [];

// Gem initial tilstand
document.addEventListener("DOMContentLoaded", () => {
    const contentEl = document.querySelector('#content');
    if (contentEl) {
        htmxHistory.push({
            targetId: "content",
            html: contentEl.innerHTML,
            scroll: 0
        });
    }
});

// ⭐ Brug AFTERSWAP i stedet for BEFORESWAP
document.body.addEventListener('htmx:afterSwap', (evt) => {
    const target = evt.detail.target;

    // Gem kun navigationer der rammer #content eller #taskArea
    if (!target || (target.id !== "content" && target.id !== "taskArea")) {
        return;
    }

    htmxHistory.push({
        targetId: target.id,
        html: target.innerHTML,
        scroll: window.scrollY
    });
});

window.htmxBack = function() {
    if (htmxHistory.length <= 1) {
        console.log("Ingen historik at gå tilbage til");
        return;
    }

    htmxHistory.pop();

    const prev = htmxHistory[htmxHistory.length - 1];
    const target = document.getElementById(prev.targetId);

    if (!target) return;

    target.innerHTML = prev.html;
    window.scrollTo(0, prev.scroll);

    htmx.process(target);
};
