// Kontrakttimer og arbejdstider i Opret/Rediger medarbejder-panelet.
// Formularen markeres med [data-employment-form]. Fejl sættes med
// setCustomValidity, så htmx ikke sender en ugyldig formular.

function setFieldError(input, errorEl, message) {
    input.setCustomValidity(message);
    errorEl.textContent = message;
    errorEl.hidden = message === "";
    input.classList.toggle("is-invalid", message !== "");
}

function validateContractHours(form) {
    const input = form.querySelector("[data-contract-hours]");
    if (!input) return;
    const errorEl = form.querySelector('[data-error-for="hoursPerWeek"]');

    let message = "";
    if (input.value !== "") {
        const hours = Number(input.value);
        if (!Number.isFinite(hours) || hours <= 0) {
            message = "Kontrakttimer skal være større end 0";
        } else if (hours > 500) {
            message = "Kontrakttimer må højst være 500";
        }
    }
    setFieldError(input, errorEl, message);
}

function validateWorkDay(row) {
    const from = row.querySelector("[data-work-from]");
    const to = row.querySelector("[data-work-to]");
    const errorEl = row.querySelector(".work-hours-error");

    // "HH:MM" kan sammenlignes som tekst
    const message = !from.disabled && from.value && to.value && to.value <= from.value
        ? "Til-tid skal være senere end fra-tid"
        : "";
    setFieldError(to, errorEl, message);
}

function setWorkDayEnabled(row, enabled) {
    row.classList.toggle("is-off", !enabled);
    row.querySelectorAll("[data-work-from], [data-work-to]").forEach(input => {
        input.disabled = !enabled;
        input.required = enabled;
    });
    validateWorkDay(row);
    if (enabled) row.querySelector("[data-work-from]").focus();
}

// Kopierer første valgte dags tider til de andre valgte dage
function copyFirstDayTimes(form) {
    const rows = [...form.querySelectorAll("[data-work-day]:not(.is-off)")];
    if (rows.length < 2) return;

    const from = rows[0].querySelector("[data-work-from]").value;
    const to = rows[0].querySelector("[data-work-to]").value;
    if (!from || !to) return;

    rows.slice(1).forEach(row => {
        row.querySelector("[data-work-from]").value = from;
        row.querySelector("[data-work-to]").value = to;
        validateWorkDay(row);
    });
}

function toMinutes(time) {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}

// 37.5 → "37,5", 40 → "40"
function formatHours(hours) {
    return String(Math.round(hours * 10) / 10).replace(".", ",");
}

// Viser timer i de valgte arbejdstider ud af kontrakttimerne: "I alt 45 af 250 t"
function updateWorkHoursTotal(form) {
    const totalEl = form.querySelector("[data-work-hours-total]");
    if (!totalEl) return;

    let minutes = 0;
    form.querySelectorAll("[data-work-day]:not(.is-off)").forEach(row => {
        const from = row.querySelector("[data-work-from]").value;
        const to = row.querySelector("[data-work-to]").value;
        if (from && to && to > from) minutes += toMinutes(to) - toMinutes(from);
    });
    const worked = minutes / 60;

    const contract = Number(form.querySelector("[data-contract-hours]")?.value);
    const hasContract = Number.isFinite(contract) && contract > 0;
    const over = hasContract && worked > contract;

    totalEl.innerHTML = "";
    totalEl.append("I alt ");
    const strong = document.createElement("strong");
    strong.textContent = formatHours(worked);
    totalEl.append(strong);
    totalEl.append(hasContract ? ` af ${formatHours(contract)} t` : " t");
    if (over) totalEl.append(` · ${formatHours(worked - contract)} t over kontrakt`);
    totalEl.classList.toggle("is-over", over);
}

// Scriptet kan blive evalueret flere gange – registrer kun listeners én gang
if (!window.__employmentListenersRegistered) {
    window.__employmentListenersRegistered = true;

    document.addEventListener("change", (evt) => {
        const form = evt.target.closest("[data-employment-form]");
        if (!form) return;

        if (evt.target.matches("[data-work-day-toggle]")) {
            setWorkDayEnabled(evt.target.closest("[data-work-day]"), evt.target.checked);
        }
        updateWorkHoursTotal(form);
    });

    document.addEventListener("input", (evt) => {
        const form = evt.target.closest("[data-employment-form]");
        if (!form) return;

        if (evt.target.matches("[data-contract-hours]")) {
            validateContractHours(form);
        } else if (evt.target.matches("[data-work-from], [data-work-to]")) {
            validateWorkDay(evt.target.closest("[data-work-day]"));
        }
        updateWorkHoursTotal(form);
    });

    document.addEventListener("click", (evt) => {
        const btn = evt.target.closest("[data-work-hours-copy]");
        if (!btn) return;
        const form = btn.closest("[data-employment-form]");
        copyFirstDayTimes(form);
        updateWorkHoursTotal(form);
    });

    // Udregn summen, når panelet er indlæst
    document.body.addEventListener("htmx:load", (evt) => {
        const root = evt.detail.elt;
        if (!root.querySelectorAll) return;
        const forms = root.matches?.("[data-employment-form]") ? [root] : root.querySelectorAll("[data-employment-form]");
        forms.forEach(updateWorkHoursTotal);
    });

    // htmx afviser ugyldige formularer stille – vis browserens besked ved feltet
    document.body.addEventListener("htmx:validation:halted", (evt) => {
        const form = evt.target.closest?.("[data-employment-form]");
        if (form) form.reportValidity();
    });
}
