// public/js/editor.js

(function () {
    let currentDragData = null;

    function getBaseUrl() {
        const el = document.getElementById('editorWorkspace') ||
                   document.getElementById('planSummaryContainer') ||
                   document.querySelector('[data-base-url]');
        return el?.dataset?.baseUrl || '/newPlanDraft';
    }

    function initEditor() {
        initModalHandlers();
        initSortableJS();
        initNativeDragAndDrop();
        initCategoryFilters();
        initAdvancedToggle();
        initCustomerPickerToggle();
        initRoomToggle();
        initSidebarSectionToggle();
    }

    /* --------------------------------------------------
       1. SORTABLE JS INTEGRATION
    -------------------------------------------------- */
    function initSortableJS() {
        if (typeof Sortable === 'undefined') {
            console.warn('SortableJS ikke tilgængeligt, bruger native HTML5 træk-og-slip.');
            return;
        }

        // A. Rumskabeloner (Venstre panel)
        const roomTemplatesEl = document.getElementById('roomTemplatesList');
        if (roomTemplatesEl && !roomTemplatesEl._sortableInit) {
            new Sortable(roomTemplatesEl, {
                group: { name: 'rooms', pull: 'clone', put: false },
                sort: false,
                animation: 150
            });
            roomTemplatesEl._sortableInit = true;
        }

        // B. Planens rumliste (Højre hovedpanel - modtager rum og reordering)
        const planRoomsEl = document.getElementById('planRoomsList');
        if (planRoomsEl && !planRoomsEl._sortableInit) {
            new Sortable(planRoomsEl, {
                group: { name: 'rooms', pull: false, put: ['rooms', 'tasks', 'days'] },
                animation: 150,
                handle: '.room-drag-handle',
                draggable: '.plan-room-card',
                onAdd: function (evt) {
                    const templateId = evt.item.dataset.templateId;
                    const name = evt.item.dataset.name;
                    const size = evt.item.dataset.size;
                    const day = evt.item.dataset.day;
                    const isTask = evt.item.classList.contains('task-template-card') || evt.item.dataset.category;

                    if (evt.item && evt.item.parentNode) {
                        evt.item.parentNode.removeChild(evt.item);
                    }

                    if (day) {
                        // Dag droppet på container
                        return;
                    }

                    if (isTask && templateId) {
                        htmx.ajax('POST', `${getBaseUrl()}/addTask`, {
                            target: '#content',
                            swap: 'innerHTML',
                            values: { templateId, roomName: '' }
                        });
                    } else if (templateId) {
                        htmx.ajax('POST', `${getBaseUrl()}/addRoom`, {
                            target: '#content',
                            swap: 'innerHTML',
                            values: { templateId, name, size }
                        });
                    }
                },
                onEnd: function (evt) {
                    if (evt.to === evt.from && evt.oldIndex !== evt.newIndex) {
                        const order = [...document.querySelectorAll('.plan-room-card')]
                            .map(el => el.dataset.roomName)
                            .filter(Boolean);

                        htmx.ajax('POST', `${getBaseUrl()}/reorderRooms`, {
                            target: '#content',
                            swap: 'innerHTML',
                            values: { order: JSON.stringify(order) }
                        });
                    }
                }
            });
            planRoomsEl._sortableInit = true;
        }

        // C. Opgaveskabeloner & Forbrugsvarer (Venstre panel)
        document.querySelectorAll('#taskTemplatesList, #consumableTemplatesList, .task-templates-list').forEach(taskTemplatesEl => {
            if (taskTemplatesEl && !taskTemplatesEl._sortableInit) {
                new Sortable(taskTemplatesEl, {
                    group: { name: 'tasks', pull: 'clone', put: false },
                    sort: false,
                    animation: 150
                });
                taskTemplatesEl._sortableInit = true;
            }
        });

        // D. Lokalernes opgave dropzones & Generelle opgaver dropzone
        document.querySelectorAll('.room-tasks-dropzone, .general-tasks-dropzone, #generalTasksDropzone').forEach(dropzone => {
            if (!dropzone._sortableInit) {
                new Sortable(dropzone, {
                    group: { name: 'tasks', pull: false, put: true },
                    animation: 150,
                    draggable: '.plan-task-row',
                    onAdd: function (evt) {
                        const templateId = evt.item.dataset.templateId;
                        const isGeneralZone = evt.to.classList.contains('general-tasks-dropzone') || evt.to.id === 'generalTasksDropzone';
                        const roomName = isGeneralZone
                            ? ''
                            : (evt.to.dataset.roomName !== undefined
                                ? evt.to.dataset.roomName
                                : (evt.to.closest('.plan-room-card:not(.general-tasks-card)')?.dataset.roomName || ''));

                        if (evt.item && evt.item.parentNode) {
                            evt.item.parentNode.removeChild(evt.item);
                        }

                        if (templateId) {
                            window._expandedRooms = window._expandedRooms || new Set();
                            if (roomName) {
                                window._expandedRooms.add(roomName);
                            } else {
                                window._expandedRooms.add('__general__');
                            }
                            htmx.ajax('POST', `${getBaseUrl()}/addTask`, {
                                target: '#content',
                                swap: 'innerHTML',
                                values: { roomName: roomName || '', templateId }
                            });
                        }
                    }
                });
                dropzone._sortableInit = true;
            }
        });

        // E. Ugedage skabeloner (Venstre panel)
        const dayChipsEl = document.getElementById('dayChipsList');
        if (dayChipsEl && !dayChipsEl._sortableInit) {
            new Sortable(dayChipsEl, {
                group: { name: 'days', pull: 'clone', put: false },
                sort: false,
                animation: 150
            });
            dayChipsEl._sortableInit = true;
        }

        // F. Lokalernes dage dropzones
        document.querySelectorAll('.room-days-dropzone').forEach(dropzone => {
            if (!dropzone._sortableInit) {
                new Sortable(dropzone, {
                    group: { name: 'days', pull: false, put: true },
                    animation: 150,
                    onAdd: function (evt) {
                        const day = evt.item.dataset.day;
                        const roomName = evt.to.dataset.roomName || evt.to.closest('.plan-room-card')?.dataset.roomName;

                        if (evt.item && evt.item.parentNode) {
                            evt.item.parentNode.removeChild(evt.item);
                        }

                        if (day && roomName) {
                            htmx.ajax('POST', `${getBaseUrl()}/addDayToRoom`, {
                                target: '#content',
                                swap: 'innerHTML',
                                values: { roomName, day }
                            });
                        }
                    }
                });
                dropzone._sortableInit = true;
            }
        });

        // G. Opgavernes dage mini dropzones
        document.querySelectorAll('.task-days-mini-zone').forEach(miniZone => {
            if (!miniZone._sortableInit) {
                new Sortable(miniZone, {
                    group: { name: 'days', pull: false, put: true },
                    animation: 150,
                    onAdd: function (evt) {
                        const day = evt.item.dataset.day;
                        const roomName = miniZone.dataset.roomName !== undefined
                            ? miniZone.dataset.roomName
                            : (miniZone.closest('.plan-room-card')?.dataset.roomName || '');
                        const templateId = miniZone.dataset.templateId || '';
                        const taskIndex = miniZone.dataset.taskIndex !== undefined ? miniZone.dataset.taskIndex : '';

                        if (evt.item && evt.item.parentNode) {
                            evt.item.parentNode.removeChild(evt.item);
                        }

                        if (day) {
                            htmx.ajax('POST', `${getBaseUrl()}/addDay`, {
                                target: '#content',
                                swap: 'innerHTML',
                                values: { roomName: roomName || '', templateId: templateId || '', taskIndex: taskIndex || '', day }
                            });
                        }
                    }
                });
                miniZone._sortableInit = true;
            }
        });
    }

    /* --------------------------------------------------
       2. NATIVE HTML5 DRAG & DROP FOR FULD SIKKERHED
    -------------------------------------------------- */
    function initNativeDragAndDrop() {
        // Dragstart på alle trækbare elementer
        document.querySelectorAll('.room-template-card, .task-template-card, .draggable-day-chip').forEach(el => {
            if (el._nativeDragInit) return;
            el.setAttribute('draggable', 'true');

            el.addEventListener('dragstart', function (e) {
                const isRoom = el.classList.contains('room-template-card');
                const isTask = el.classList.contains('task-template-card');
                const isDay = el.classList.contains('draggable-day-chip');

                currentDragData = {
                    type: isRoom ? 'room' : (isTask ? 'task' : (isDay ? 'day' : 'unknown')),
                    templateId: el.dataset.templateId || '',
                    name: el.dataset.name || '',
                    size: el.dataset.size || '',
                    day: el.dataset.day || '',
                    category: el.dataset.category || ''
                };

                try {
                    e.dataTransfer.setData('text/plain', JSON.stringify(currentDragData));
                    e.dataTransfer.effectAllowed = 'copyMove';
                } catch (err) {
                    // Ignorer ældre browsere
                }
            });

            el.addEventListener('dragend', function () {
                currentDragData = null;
                document.querySelectorAll('.drag-over').forEach(node => node.classList.remove('drag-over'));
            });

            el._nativeDragInit = true;
        });

        // Dropzones: Hovedplan, Rumkort, Opgavezones, Dagszones
        const dropzoneSelectors = [
            '#planRoomsList',
            '.plan-room-card',
            '.room-tasks-dropzone',
            '#generalTasksDropzone',
            '.room-days-dropzone',
            '.task-days-mini-zone',
            '.plan-task-row'
        ];

        document.querySelectorAll(dropzoneSelectors.join(', ')).forEach(zone => {
            if (zone._nativeDropInit) return;

            zone.addEventListener('dragover', function (e) {
                e.preventDefault();
                try {
                    e.dataTransfer.dropEffect = 'copy';
                } catch (err) {}
                zone.classList.add('drag-over');
            });

            zone.addEventListener('dragleave', function (e) {
                if (!zone.contains(e.relatedTarget)) {
                    zone.classList.remove('drag-over');
                }
            });

            zone.addEventListener('drop', function (e) {
                e.preventDefault();
                e.stopPropagation();
                zone.classList.remove('drag-over');

                let dragInfo = currentDragData;
                if (!dragInfo) {
                    try {
                        const raw = e.dataTransfer.getData('text/plain');
                        if (raw) dragInfo = JSON.parse(raw);
                    } catch (err) {}
                }

                if (!dragInfo) return;

                // Håndter drop baseret på type og mål
                handleNativeDrop(dragInfo, zone);
                currentDragData = null;
            });

            zone._nativeDropInit = true;
        });
    }

    function handleNativeDrop(data, targetZone) {
        if (!data || !data.type) return;

        // A. DROP AF RUM
        if (data.type === 'room' && data.templateId) {
            htmx.ajax('POST', `${getBaseUrl()}/addRoom`, {
                target: '#content',
                swap: 'innerHTML',
                values: {
                    templateId: data.templateId,
                    name: data.name || '',
                    size: data.size || ''
                }
            });
            return;
        }

        // B. DROP AF OPGAVE
        if (data.type === 'task' && data.templateId) {
            const roomCard = targetZone.closest('.plan-room-card');
            const isGeneral = targetZone.closest('.general-tasks-card') || targetZone.id === 'generalTasksDropzone';
            const roomName = targetZone.dataset.roomName !== undefined
                ? targetZone.dataset.roomName
                : (roomCard && !isGeneral ? roomCard.dataset.roomName : '');

            window._expandedRooms = window._expandedRooms || new Set();
            if (roomName) {
                window._expandedRooms.add(roomName);
            } else {
                window._expandedRooms.add('__general__');
            }

            htmx.ajax('POST', `${getBaseUrl()}/addTask`, {
                target: '#content',
                swap: 'innerHTML',
                values: {
                    roomName: roomName || '',
                    templateId: data.templateId
                }
            });
            return;
        }

        // C. DROP AF DAG
        if (data.type === 'day' && data.day) {
            const taskRow = targetZone.closest('.plan-task-row');
            const roomCard = targetZone.closest('.plan-room-card');

            if (taskRow) {
                const taskIndex = taskRow.dataset.taskIndex !== undefined ? taskRow.dataset.taskIndex : '';
                const templateId = taskRow.dataset.templateId || '';
                const roomName = roomCard ? roomCard.dataset.roomName : '';

                htmx.ajax('POST', `${getBaseUrl()}/addDay`, {
                    target: '#content',
                    swap: 'innerHTML',
                    values: {
                        roomName: roomName || '',
                        templateId: templateId,
                        taskIndex: taskIndex,
                        day: data.day
                    }
                });
            } else if (roomCard) {
                const roomName = roomCard.dataset.roomName || '';
                htmx.ajax('POST', `${getBaseUrl()}/addDayToRoom`, {
                    target: '#content',
                    swap: 'innerHTML',
                    values: {
                        roomName: roomName,
                        day: data.day
                    }
                });
            }
        }
    }

    /* --------------------------------------------------
       3. KATEGORI FILTRE
    -------------------------------------------------- */
    function initCategoryFilters() {
        const filterContainer = document.getElementById('taskCategoryFilters');
        if (!filterContainer || filterContainer._filterInit) return;

        filterContainer.addEventListener('click', function (e) {
            const btn = e.target.closest('.filter-pill');
            if (!btn) return;

            filterContainer.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');

            const cat = btn.dataset.filter;
            const taskCards = document.querySelectorAll('#taskTemplatesList .task-template-card');

            taskCards.forEach(card => {
                if (cat === 'all' || card.dataset.category === cat) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });

        filterContainer._filterInit = true;
    }

    /* --------------------------------------------------
       4. AVANCERET KNAP TOGGLE
    -------------------------------------------------- */
    function initAdvancedToggle() {
        const advBtn = document.getElementById('toggleAdvancedBtn');
        const advPanel = document.getElementById('advancedSettingsPanel');
        const closeBtn = document.getElementById('closeAdvancedBtn');

        if (advBtn && advPanel && !advBtn._advInit) {
            advBtn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                advPanel.classList.toggle('hidden');
                advBtn.classList.toggle('active', !advPanel.classList.contains('hidden'));
            });
            advBtn._advInit = true;
        }

        if (closeBtn && advPanel && !closeBtn._closeInit) {
            closeBtn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                advPanel.classList.add('hidden');
                if (advBtn) {
                    advBtn.classList.remove('active');
                }
            });
            closeBtn._closeInit = true;
        }
    }

    /* --------------------------------------------------
       5. KUNDE- OG LOKATIONSVÆLGER TOGGLE
    -------------------------------------------------- */
    function initCustomerPickerToggle() {
        const toggleBtn = document.getElementById('toggleCustomerPickerBtn');
        const headerToggleBtn = document.getElementById('toggleCustomerPickerBtnHeader');
        const metaBar = document.getElementById('customerMetaBar');
        const pickerPanel = document.getElementById('customerPickerPanel');
        const closeBtn = document.getElementById('closeCustomerPickerBtn');
        const closeBtn2 = document.getElementById('closeCustomerPickerBtn2');

        function togglePicker(e) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            if (!pickerPanel) return;
            const isHidden = pickerPanel.classList.contains('hidden');
            if (isHidden) {
                pickerPanel.classList.remove('hidden');
                if (toggleBtn) toggleBtn.classList.add('active');
                if (headerToggleBtn) headerToggleBtn.classList.add('active');
            } else {
                pickerPanel.classList.add('hidden');
                if (toggleBtn) toggleBtn.classList.remove('active');
                if (headerToggleBtn) headerToggleBtn.classList.remove('active');
            }
        }

        function closePicker(e) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            if (!pickerPanel) return;
            pickerPanel.classList.add('hidden');
            if (toggleBtn) toggleBtn.classList.remove('active');
            if (headerToggleBtn) headerToggleBtn.classList.remove('active');
        }

        if (toggleBtn && pickerPanel && !toggleBtn._pickerInit) {
            toggleBtn.addEventListener('click', togglePicker);
            toggleBtn._pickerInit = true;
        }

        if (headerToggleBtn && pickerPanel && !headerToggleBtn._headerPickerInit) {
            headerToggleBtn.addEventListener('click', function(e) {
                togglePicker(e);
                const section = document.getElementById('customerSectionWrapper');
                if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            headerToggleBtn._headerPickerInit = true;
        }

        if (metaBar && pickerPanel && !metaBar._metaBarInit) {
            metaBar.addEventListener('click', function(e) {
                if (e.target.closest('button')) return;
                togglePicker(e);
            });
            metaBar._metaBarInit = true;
        }

        if (closeBtn && pickerPanel && !closeBtn._closeInit) {
            closeBtn.addEventListener('click', closePicker);
            closeBtn._closeInit = true;
        }

        if (closeBtn2 && pickerPanel && !closeBtn2._closeInit2) {
            closeBtn2.addEventListener('click', closePicker);
            closeBtn2._closeInit2 = true;
        }
    }

    /* --------------------------------------------------
       7. RUM ACCORDION / MINIMEREDE LOKALER & ØVRIGE OPGAVER
    -------------------------------------------------- */
    window._expandedRooms = window._expandedRooms || new Set();

    function initRoomToggle() {
        const roomCards = document.querySelectorAll('.plan-room-card');
        roomCards.forEach(card => {
            const isGeneralCard = card.classList.contains('general-tasks-card');
            const roomName = card.dataset.roomName || (isGeneralCard ? '__general__' : '');
            const toggleBtn = card.querySelector('.btn-toggle-room');
            const toggleText = card.querySelector('.toggle-room-text');

            function updateCardState(isExpanded) {
                if (isExpanded) {
                    card.classList.remove('is-minimized');
                    if (toggleText) toggleText.textContent = 'Luk';
                    if (toggleBtn) {
                        toggleBtn.title = isGeneralCard ? 'Luk øvrige opgaver' : 'Luk lokale';
                        toggleBtn.classList.add('active');
                    }
                } else {
                    card.classList.add('is-minimized');
                    if (toggleText) toggleText.textContent = 'Rediger';
                    if (toggleBtn) {
                        toggleBtn.title = isGeneralCard ? 'Klik for at redigere øvrige opgaver' : 'Klik for at redigere lokalet';
                        toggleBtn.classList.remove('active');
                    }
                }
            }

            // Synkroniser tilstand fra _expandedRooms
            const isCurrentlyExpanded = window._expandedRooms.has(roomName);
            updateCardState(isCurrentlyExpanded);

            if (card._roomToggleInit) return;
            card._roomToggleInit = true;

            const header = card.querySelector('.room-card-header');
            if (header) {
                header.addEventListener('click', function (e) {
                    // Ignorer klik på felter, slet-knapper, træk-håndtag osv.
                    if (e.target.closest('input, select, textarea, .btn-icon-delete, .btn-icon-delete-small, .room-drag-handle, .room-day-pill, .btn-shortcut')) {
                        return;
                    }

                    const willBeExpanded = card.classList.contains('is-minimized');
                    if (willBeExpanded) {
                        window._expandedRooms.add(roomName);
                        card.classList.add('is-opening');
                        updateCardState(true);
                    } else {
                        window._expandedRooms.delete(roomName);
                        updateCardState(false);
                    }
                });
            }
        });
    }

    /* --------------------------------------------------
       5b. SIDEBAR SEKTION TOGGLE (LOKALER, OPGAVER, FORBRUGSVARER)
    -------------------------------------------------- */
    window._expandedSidebarSections = window._expandedSidebarSections || new Set();

    function initSidebarSectionToggle() {
        const sections = document.querySelectorAll('.sidebar-section[data-section-id]');
        sections.forEach(section => {
            const sectionId = section.dataset.sectionId;
            const toggleBtn = section.querySelector('.btn-toggle-sidebar');
            const toggleText = section.querySelector('.toggle-sidebar-text');

            function updateSectionState(isExpanded) {
                if (isExpanded) {
                    section.classList.remove('is-minimized');
                    if (toggleText) toggleText.textContent = 'Luk';
                    if (toggleBtn) {
                        toggleBtn.title = 'Luk sektion';
                        toggleBtn.classList.add('active');
                    }
                } else {
                    section.classList.add('is-minimized');
                    if (toggleText) toggleText.textContent = 'Vis';
                    if (toggleBtn) {
                        toggleBtn.title = 'Åbn sektion';
                        toggleBtn.classList.remove('active');
                    }
                }
            }

            // Synkroniser tilstand fra _expandedSidebarSections
            const isCurrentlyExpanded = window._expandedSidebarSections.has(sectionId);
            updateSectionState(isCurrentlyExpanded);

            if (section._sidebarToggleInit) return;
            section._sidebarToggleInit = true;

            const header = section.querySelector('.sidebar-section-header');
            if (header) {
                header.addEventListener('click', function (e) {
                    if (e.target.closest('input, select, textarea')) {
                        return;
                    }

                    const willBeExpanded = section.classList.contains('is-minimized');
                    if (willBeExpanded) {
                        window._expandedSidebarSections.add(sectionId);
                        section.classList.add('is-opening');
                        updateSectionState(true);
                    } else {
                        window._expandedSidebarSections.delete(sectionId);
                        updateSectionState(false);
                    }
                });
            }
        });
    }

    /* --------------------------------------------------
       6. MODAL- OG OVERLAY-HÅNDTERING (Uden inline scripts)
    -------------------------------------------------- */
    function initModalHandlers() {
        if (window._modalHandlersInit) return;
        window._modalHandlersInit = true;

        // Luk overlay ved klik på baggrund eller luk-knapper
        document.addEventListener('click', function (e) {
            const overlay = document.getElementById('overlay');
            if (!overlay || !overlay.innerHTML.trim()) return;

            // Klik direkte på overlay-baggrunden
            if (e.target === overlay || (e.target.classList && e.target.classList.contains('overlay'))) {
                overlay.innerHTML = '';
                return;
            }

            // Klik på luk- eller annuller-knap i modal
            if (e.target.closest('.modal-close-btn, .btn-modal-cancel, [data-close-modal]')) {
                overlay.innerHTML = '';
                return;
            }
        });

        // Luk modal ved tastetryk på Escape
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                const overlay = document.getElementById('overlay');
                if (overlay && overlay.innerHTML.trim() !== '') {
                    overlay.innerHTML = '';
                }
            }
        });

        // Luk overlay automatisk efter vellykket HTMX-request fra en form i #overlay
        document.addEventListener('htmx:afterRequest', function (e) {
            const overlay = document.getElementById('overlay');
            if (!overlay) return;

            const isSuccess = e.detail && e.detail.successful;
            if (isSuccess) {
                const elt = e.detail.elt;
                if (elt && (elt.closest('#overlay') || (elt.classList && elt.classList.contains('overlay')) || elt.closest('.overlay'))) {
                    overlay.innerHTML = '';
                }
            }
        });

        // Global HTMX fejlhåndtering uden brug af inline hx-on:error
        document.addEventListener('htmx:responseError', function (e) {
            if (e.detail && e.detail.xhr && e.detail.xhr.responseText) {
                alert(e.detail.xhr.responseText);
            }
        });
    }

    // Kør modal handlers straks
    initModalHandlers();

    // Registrer lyttere
    document.addEventListener('DOMContentLoaded', initEditor);
    document.addEventListener('htmx:afterSwap', initEditor);
    document.addEventListener('htmx:load', initEditor);

    /* --------------------------------------------------
       BEVAR SCROLL-POSITION VED OPDATERING AF EDITOREN
       #content udskiftes ved hver ændring, så de scrollbare
       paneler starter forfra. Gem positionen før swap og
       gendan den bagefter, hvis editoren stadig vises.
    -------------------------------------------------- */
    const SCROLL_SELECTORS = ['.editor-main', '.editor-sidebar', '.template-list'];
    let savedScroll = null;

    document.addEventListener('htmx:beforeSwap', function (e) {
        const target = e.detail && e.detail.target;
        if (!target || target.id !== 'content' || !target.querySelector('.editor-main')) {
            savedScroll = null;
            return;
        }
        if (e.detail.shouldSwap) target.classList.add('is-refreshing');
        savedScroll = {
            window: window.scrollY,
            panels: SCROLL_SELECTORS.map(sel =>
                Array.from(target.querySelectorAll(sel)).map(el => el.scrollTop))
        };
    });

    // Registreres efter initEditor, så rum-udvidelser er anvendt før gendannelse
    document.addEventListener('htmx:afterSwap', function (e) {
        const target = e.detail && e.detail.target;
        if (!savedScroll || !target || target.id !== 'content') return;
        const state = savedScroll;
        savedScroll = null;
        if (!target.querySelector('.editor-main')) return;

        SCROLL_SELECTORS.forEach((sel, i) => {
            target.querySelectorAll(sel).forEach((el, j) => {
                if (state.panels[i][j] != null) el.scrollTop = state.panels[i][j];
            });
        });
        window.scrollTo(0, state.window);
    });

    // Slå transitions til igen, når det nye indhold er tegnet færdigt
    document.addEventListener('htmx:afterSettle', function (e) {
        const target = e.detail && e.detail.target;
        if (!target || !target.classList.contains('is-refreshing')) return;
        requestAnimationFrame(() => requestAnimationFrame(() => {
            target.classList.remove('is-refreshing');
        }));
    });

    window.initEditorSortables = initEditor;
})();
