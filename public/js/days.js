function setDailyWeekdays(fieldName = "days") {
    const weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday"];
    document.querySelectorAll(`input[name="${fieldName}"]`).forEach(cb => {
        cb.checked = weekdays.includes(cb.value);
    });
}

// ⭐ CSP-kompatibel event listener (vigtig!)
document.addEventListener("click", (evt) => {
    const btn = evt.target.closest("[data-weekdays]");
    if (!btn) return;

    const fieldName = btn.dataset.weekdays;
    setDailyWeekdays(fieldName);
});
