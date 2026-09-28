// Formaterer et antal minutter til en læsbar dansk tekst, fx:
// 20 -> "20 min", 60 -> "1 time", 90 -> "1 time 30 min"
function formatDuration(minutes) {
    const total = Math.round(Number(minutes) || 0);
    if (total <= 0) return "0 min";

    const hours = Math.floor(total / 60);
    const mins = total % 60;

    if (hours === 0) return `${mins} min`;

    const hourLabel = hours === 1 ? "1 time" : `${hours} timer`;
    if (mins === 0) return hourLabel;

    return `${hourLabel} ${mins} min`;
}

module.exports = { formatDuration };
