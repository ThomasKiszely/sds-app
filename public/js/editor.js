// public/js/editor.js
// Prisberegneren (Hurtig beregning og redigering af eksisterende planer).
// Al tilstand ligger på serveren: hver ændring sender en htmx-request, og
// #content tegnes forfra. Scriptet holder styr på hvilke lokaler der er
// åbne, og hvor man var scrollet hen.

(function () {
    function getBaseUrl() {
        const el = document.getElementById('editorWorkspace') || document.querySelector('[data-base-url]');
        return el?.dataset?.baseUrl || '/newPlanDraft';
    }

    // Lokaler der er foldet ud. Overlever at #content tegnes forfra.
    window._expandedRooms = window._expandedRooms || new Set();

    function initEditor() {
        initModalHandlers();
        initRoomReorder();
        initCustomerPickerToggle();
        initRoomToggle();
    }

    /* --------------------------------------------------
       1. RÆKKEFØLGE AF LOKALER (træk i håndtaget)
    -------------------------------------------------- */
    function initRoomReorder() {
        const list = document.getElementById('planRoomsList');
        if (!list || list._sortableInit || typeof Sortable === 'undefined') return;

        new Sortable(list, {
            animation: 150,
            handle: '.room-drag-handle',
            draggable: '.plan-room-card:not(.general-tasks-card)',
            onEnd: function (evt) {
                if (evt.oldIndex === evt.newIndex) return;
                const order = [...list.querySelectorAll('.plan-room-card:not(.general-tasks-card)')]
                    .map(el => el.dataset.roomName)
                    .filter(Boolean);

                htmx.ajax('POST', `${getBaseUrl()}/reorderRooms`, {
                    target: '#content',
                    swap: 'innerHTML',
                    values: { order: JSON.stringify(order) }
                });
            }
        });
        list._sortableInit = true;
    }

    /* --------------------------------------------------
       2. TILFØJ OPGAVE VED AT SKRIVE NAVNET
       Feltet bruger en <datalist>. Når teksten matcher en opgave,
       tilføjes den til lokalet.
    -------------------------------------------------- */
    function findTemplateId(input) {
        const list = input.list;
        if (!list) return null;
        const wanted = input.value.trim().toLowerCase();
        const match = [...list.options].find(o => o.value.trim().toLowerCase() === wanted);
        return match ? match.dataset.id : null;
    }

    document.addEventListener('change', function (e) {
        const input = e.target.closest && e.target.closest('input[data-add-task]');
        if (!input || !input.value.trim()) return;

        const templateId = findTemplateId(input);
        if (!templateId) {
            if (typeof window.showCenterToast === 'function') {
                window.showCenterToast(`Ingen opgave hedder "${input.value.trim()}"`);
            }
            return;
        }

        const roomName = input.dataset.roomName || '';
        window._expandedRooms.add(roomName || '__general__');

        htmx.ajax('POST', `${getBaseUrl()}/addTask`, {
            target: '#content',
            swap: 'innerHTML',
            values: { roomName, templateId }
        });
    });

    /* --------------------------------------------------
       3. KUNDE- OG BYGNINGSVÆLGER
    -------------------------------------------------- */
    function initCustomerPickerToggle() {
        const panel = document.getElementById('customerPickerPanel');
        if (!panel) return;

        const toggle = (open) => {
            const show = open === undefined ? panel.classList.contains('hidden') : open;
            panel.classList.toggle('hidden', !show);
            if (show) panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        };

        const bind = (id, handler) => {
            const el = document.getElementById(id);
            if (!el || el._pickerInit) return;
            el.addEventListener('click', function (e) {
                if (id === 'customerMetaBar' && e.target.closest('button')) return;
                e.preventDefault();
                handler();
            });
            el._pickerInit = true;
        };

        bind('toggleCustomerPickerBtn', () => toggle());
        bind('customerMetaBar', () => toggle(true));
        bind('closeCustomerPickerBtn', () => toggle(false));
        bind('closeCustomerPickerBtn2', () => toggle(false));
    }

    /* --------------------------------------------------
       4. FOLD LOKALER UD OG IND
    -------------------------------------------------- */

    // Lokaler der findes før et nyt lokale tilføjes, så det nye kan foldes ud
    document.addEventListener('htmx:beforeRequest', function (e) {
        const path = e.detail?.requestConfig?.path || '';
        if (!path.endsWith('/addRoom')) return;
        window._roomsBeforeAdd = new Set(
            [...document.querySelectorAll('.plan-room-card')].map(el => el.dataset.roomName)
        );
    });

    function initRoomToggle() {
        const cards = document.querySelectorAll('.plan-room-card');

        if (window._roomsBeforeAdd) {
            cards.forEach(card => {
                if (!window._roomsBeforeAdd.has(card.dataset.roomName)) {
                    window._expandedRooms.add(card.dataset.roomName);
                }
            });
            window._roomsBeforeAdd = null;
        }

        cards.forEach(card => {
            const roomName = card.dataset.roomName;
            const toggleText = card.querySelector('.toggle-room-text');

            const setExpanded = (expanded) => {
                card.classList.toggle('is-minimized', !expanded);
                if (toggleText) toggleText.textContent = expanded ? 'Luk' : 'Rediger';
            };

            setExpanded(window._expandedRooms.has(roomName));

            if (card._roomToggleInit) return;
            card._roomToggleInit = true;

            const header = card.querySelector('.room-card-header');
            if (!header) return;

            header.addEventListener('click', function (e) {
                // Klik i felter og på knapper (undtagen fold-knappen) skal ikke folde
                if (e.target.closest('input, select, textarea, label, .room-drag-handle, .btn-icon-delete')) return;

                const expand = card.classList.contains('is-minimized');
                if (expand) {
                    window._expandedRooms.add(roomName);
                } else {
                    window._expandedRooms.delete(roomName);
                }
                setExpanded(expand);
            });
        });
    }

    /* --------------------------------------------------
       5. MODALER (opret kunde / bygning i #overlay)
    -------------------------------------------------- */
    function initModalHandlers() {
        if (window._modalHandlersInit) return;
        window._modalHandlersInit = true;

        const overlay = () => document.getElementById('overlay');

        document.addEventListener('click', function (e) {
            const el = overlay();
            if (!el || !el.innerHTML.trim()) return;

            if (e.target === el || (e.target.classList && e.target.classList.contains('overlay'))) {
                el.innerHTML = '';
                return;
            }
            if (e.target.closest('.modal-close-btn, .btn-modal-cancel, [data-close-modal]')) {
                el.innerHTML = '';
            }
        });

        document.addEventListener('keydown', function (e) {
            const el = overlay();
            if (e.key === 'Escape' && el && el.innerHTML.trim() !== '') {
                el.innerHTML = '';
            }
        });

        // Luk modalen når en formular i den er sendt
        document.addEventListener('htmx:afterRequest', function (e) {
            const el = overlay();
            const elt = e.detail && e.detail.elt;
            if (el && e.detail.successful && elt && elt.closest && elt.closest('#overlay, .overlay')) {
                el.innerHTML = '';
            }
        });
    }

    initModalHandlers();

    document.addEventListener('DOMContentLoaded', initEditor);
    document.addEventListener('htmx:afterSwap', initEditor);
    document.addEventListener('htmx:load', initEditor);

    /* --------------------------------------------------
       6. BEVAR SCROLL-POSITION NÅR EDITOREN TEGNES FORFRA
    -------------------------------------------------- */
    let savedScroll = null;

    document.addEventListener('htmx:beforeSwap', function (e) {
        const target = e.detail && e.detail.target;
        if (!target || target.id !== 'content' || !target.querySelector('.editor-main')) {
            savedScroll = null;
            return;
        }
        if (e.detail.shouldSwap) target.classList.add('is-refreshing');
        savedScroll = window.scrollY;
    });

    // Registreres efter initEditor, så udfoldede lokaler er på plads før scroll
    document.addEventListener('htmx:afterSwap', function (e) {
        const target = e.detail && e.detail.target;
        if (savedScroll === null || !target || target.id !== 'content') return;
        const y = savedScroll;
        savedScroll = null;
        if (target.querySelector('.editor-main')) window.scrollTo(0, y);
    });

    document.addEventListener('htmx:afterSettle', function (e) {
        const target = e.detail && e.detail.target;
        if (!target || !target.classList.contains('is-refreshing')) return;
        requestAnimationFrame(() => requestAnimationFrame(() => target.classList.remove('is-refreshing')));
    });

    window.initEditorSortables = initEditor;
})();
