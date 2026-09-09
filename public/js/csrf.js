// Tilføj CSRF-token til alle HTMX requests
document.body.addEventListener("htmx:configRequest", (event) => {
    const token = document.querySelector("meta[name='csrf-token']")?.content;
    if (token) {
        event.detail.headers["X-CSRF-Token"] = token;
    }
});

// Opdater HTMX's globale CSRF-token efter hver partial load
document.body.addEventListener("htmx:afterOnLoad", () => {
    const newToken = document.querySelector('meta[name="csrf-token"]')?.content;
    if (newToken) {
        htmx.config.headers['X-CSRF-Token'] = newToken;
    }
});
