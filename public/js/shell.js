// Skallen: markerer det aktive menupunkt og styrer menuen på mobil.
//
// Appen skifter side ved at hente HTML ind i #content uden at ændre URL'en.
// Derfor gemmes stien for den viste side på sidens første element
// (data-nav-path). Så følger den med i history.js' snapshots, og det aktive
// menupunkt kan findes igen, når man går tilbage.

(function () {
    if (window.__shellRegistered) return;
    window.__shellRegistered = true;

    const content = () => document.getElementById("content");
    const sidebar = () => document.getElementById("sidebar");
    const scrim = () => document.getElementById("sidebarScrim");
    const menuToggle = () => document.getElementById("menuToggle");

    function pathMatches(path, prefixes) {
        return prefixes.some(prefix => path === prefix || path.startsWith(prefix));
    }

    function setActive(path) {
        let best = null;
        let bestLength = -1;

        document.querySelectorAll("[data-nav-match]").forEach(el => {
            el.classList.remove("is-active");
            el.removeAttribute("aria-current");

            const prefixes = el.dataset.navMatch.split(" ").filter(Boolean);
            prefixes.forEach(prefix => {
                if (pathMatches(path, [prefix]) && prefix.length > bestLength) {
                    best = prefix;
                    bestLength = prefix.length;
                }
            });
        });

        if (!best) return;

        document.querySelectorAll("[data-nav-match]").forEach(el => {
            if (el.dataset.navMatch.split(" ").includes(best)) {
                el.classList.add("is-active");
                el.setAttribute("aria-current", "page");
            }
        });
    }

    function currentPath() {
        const first = content() && content().firstElementChild;
        return (first && first.dataset.navPath) || "/indexContent";
    }

    function setMenuOpen(open) {
        const bar = sidebar();
        const toggle = menuToggle();
        const backdrop = scrim();
        if (!bar) return;

        bar.classList.toggle("is-open", open);
        if (toggle) toggle.setAttribute("aria-expanded", String(open));
        if (backdrop) backdrop.hidden = !open;
    }

    document.body.addEventListener("htmx:afterSwap", (evt) => {
        const target = evt.detail.target;
        if (!target || target.id !== "content") return;

        const path = (evt.detail.pathInfo && evt.detail.pathInfo.requestPath) || "";
        const cleanPath = path.split("?")[0];
        const first = target.firstElementChild;
        if (first && cleanPath) first.dataset.navPath = cleanPath;

        setActive(cleanPath || currentPath());

        // Kun klik i menuen starter øverst på siden. Editoren genindlæser
        // #content ved hver ændring og skal beholde sin scroll-position.
        const trigger = evt.detail.requestConfig && evt.detail.requestConfig.elt;
        if (trigger && trigger.closest && trigger.closest("[data-nav-match]")) {
            setMenuOpen(false);
            window.scrollTo(0, 0);
        }
    });

    window.addEventListener("popstate", () => {
        // history.js har allerede lagt det gamle indhold tilbage
        setActive(currentPath());
    });

    document.addEventListener("click", (evt) => {
        if (evt.target.closest("#menuToggle")) {
            setMenuOpen(!sidebar().classList.contains("is-open"));
            return;
        }
        if (evt.target.closest("#sidebarScrim")) {
            setMenuOpen(false);
        }
    });

    document.addEventListener("keydown", (evt) => {
        if (evt.key === "Escape") setMenuOpen(false);
    });

    document.addEventListener("DOMContentLoaded", () => setActive(currentPath()));
})();
