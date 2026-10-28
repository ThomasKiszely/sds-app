function showCenterToast(message) {
    const container = document.getElementById("toast-center");
    if (!container) return;

    // Undgå identiske toasts under hinanden
    const alreadyShown = Array.from(container.children).some(
        (el) => el.textContent === message && !el.classList.contains("hide")
    );
    if (alreadyShown) return;

    const toast = document.createElement("div");
    toast.className = "toast-center";
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("hide");
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// Scriptet kan blive evalueret flere gange (htmx-swaps) – registrer kun listeners én gang
if (!window.__toastListenersRegistered) {
window.__toastListenersRegistered = true;

// Success + info toasts via HX-Trigger
document.body.addEventListener("htmx:afterRequest", (evt) => {
    const xhr = evt.detail.xhr;
    if (!xhr) return;

    let triggerHeader = xhr.getResponseHeader("HX-Trigger");

    if (triggerHeader) {
        try {
            const parsed = JSON.parse(triggerHeader);
            if (parsed && parsed.toast) {
                let message = parsed.toast;

                if (typeof message === "object" && message !== null) {
                    message = message.value || message.message || JSON.stringify(message);
                }

                showCenterToast(message);
            }
        } catch (e) {
            console.error("Kunne ikke parse HX-Trigger header:", e);
        }
    }
});

// Error toasts
document.body.addEventListener("htmx:responseError", (event) => {
    const xhr = event.detail.xhr;

    if (xhr && xhr.responseText && typeof xhr.responseText === "string") {
        const clean = xhr.responseText.replace(/<[^>]+>/g, "").trim();
        if (clean.length > 0) {
            showCenterToast(clean);
            return;
        }
    }

    try {
        const json = xhr && JSON.parse(xhr.responseText);
        if (json && json.message) {
            showCenterToast(json.message);
            return;
        }
    } catch (_) {}

    showCenterToast("Der opstod en fejl");
});

}