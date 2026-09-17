function scrollToLetter(letter) {
    const el = document.getElementById("letter-" + letter);
    if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

function bindAlphabetNav() {
    const buttons = document.querySelectorAll(".alpha-btn");

    buttons.forEach(btn => {
        const letter = btn.dataset.letter;

        // Klik-event
        btn.addEventListener("click", () => {
            scrollToLetter(letter);

            // Highlight aktivt bogstav
            buttons.forEach(b => b.classList.remove("active-letter"));
            btn.classList.add("active-letter");
        });
    });

    disableEmptyLetters();
}

function disableEmptyLetters() {
    const buttons = document.querySelectorAll(".alpha-btn");

    buttons.forEach(btn => {
        const letter = btn.dataset.letter;
        const el = document.getElementById("letter-" + letter);

        if (!el) {
            btn.disabled = true;
            btn.classList.add("alpha-disabled");
        }
    });
}

// Første load
document.addEventListener("DOMContentLoaded", bindAlphabetNav);

// HTMX partial load
document.body.addEventListener("htmx:afterSwap", bindAlphabetNav);
