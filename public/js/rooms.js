// public/js/rooms.js
document.addEventListener('change', function(event) {
    if (event.target.classList.contains('room-checkbox')) {
        const templateId = event.target.getAttribute('data-id');
        const countDiv = document.getElementById(`count-${templateId}`);
        if (countDiv) {
            countDiv.classList.toggle('hidden', !event.target.checked);
        }
    }
});