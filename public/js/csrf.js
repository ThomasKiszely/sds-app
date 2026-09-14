// Tilføj CSRF-token til alle HTMX requests sikkert
document.body.addEventListener("htmx:configRequest", (event) => {
    const token = document.querySelector("meta[name='csrf-token']")?.content;
    if (token) {
        // Sørg for at headers-objektet eksisterer, før vi tilføjer til det
        if (!event.detail.headers) {
            event.detail.headers = {};
        }
        event.detail.headers["X-CSRF-Token"] = token;
    }
});

// Opdater HTMX's globale CSRF-token efter hver partial load sikkert
document.body.addEventListener("htmx:afterOnLoad", () => {
    const newToken = document.querySelector('meta[name="csrf-token"]')?.content;
    if (newToken) {
        // Sørg for at htmx.config og headers eksisterer
        if (typeof htmx !== 'undefined' && htmx.config) {
            if (!htmx.config.headers) {
                htmx.config.headers = {};
            }
            htmx.config.headers['X-CSRF-Token'] = newToken;
        }
    }
});