// SPA-historik uden push-url:
// Hver navigation i #content gemmes som et snapshot, og der lægges en
// browserhistorik-post (samme URL) ind, så browserens tilbage/frem-knapper
// kan gendanne snapshots via popstate.

const htmxHistory = [];
let historyIndex = -1;

// Unikt id for denne sideindlæsning, så gamle historik-poster fra før en
// genindlæsning ikke forveksles med nye snapshots
const historySessionId = Date.now().toString(36) + Math.random().toString(36).slice(2);

// htmx' egen historik bruges ikke (ingen push-url) og skal ikke blande sig
if (window.htmx) {
    htmx.config.historyEnabled = false;
}

// Vi styrer selv scroll-positionen ved tilbage/frem
if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
}

function saveSnapshot(contentEl, replace) {
    // Ny navigation efter at være gået tilbage: kassér "frem"-posterne
    htmxHistory.length = historyIndex + 1;

    htmxHistory.push({
        html: contentEl.innerHTML,
        scroll: 0
    });
    historyIndex = htmxHistory.length - 1;

    const state = { sdsHistoryIndex: historyIndex, sdsSessionId: historySessionId };
    if (replace) {
        history.replaceState(state, "", location.href);
    } else {
        history.pushState(state, "", location.href);
    }
}

// Gem initial tilstand
document.addEventListener("DOMContentLoaded", () => {
    const contentEl = document.querySelector('#content');
    if (contentEl) {
        saveSnapshot(contentEl, true);
    }
});

function rememberScroll() {
    if (htmxHistory[historyIndex]) {
        htmxHistory[historyIndex].scroll = window.scrollY;
    }
}

// Husk hvor langt nede man var på siden man forlader (før ny side kan ændre scroll)
document.body.addEventListener('htmx:beforeSwap', (evt) => {
    if (evt.detail.target && evt.detail.target.id === "content") {
        rememberScroll();
    }
});

// Brug AFTERSWAP i stedet for BEFORESWAP
document.body.addEventListener('htmx:afterSwap', (evt) => {
    const target = evt.detail.target;

    // Gem kun navigationer der rammer #content
    if (!target || target.id !== "content") {
        return;
    }

    saveSnapshot(target, false);
});

// Browserens tilbage/frem-knapper
window.addEventListener("popstate", (evt) => {
    const state = evt.state;
    if (!state || state.sdsSessionId !== historySessionId) return;

    const entry = htmxHistory[state.sdsHistoryIndex];
    const target = document.getElementById("content");
    if (!entry || !target) return;

    rememberScroll();
    historyIndex = state.sdsHistoryIndex;

    target.innerHTML = entry.html;
    htmx.process(target);
    window.scrollTo(0, entry.scroll);
});

// Topbar'ens Tilbage-knap går gennem browserhistorikken, så de to holdes i sync
window.htmxBack = function() {
    if (historyIndex <= 0) {
        console.log("Ingen historik at gå tilbage til");
        return;
    }

    history.back();
};
