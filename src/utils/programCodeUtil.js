const { categoryTypes } = require("../utils/categoryEnum");

// Hjælpefunktion: tæl antal dage på en opgave
function countDays(task) {
    if (!task || !Array.isArray(task.days)) return 0;
    return task.days.length;
}

// Beregn programkode for et rum ud fra dets SDS-opgaver
function calculateProgramCodeForRoom(tasksForRoom) {
    if (!Array.isArray(tasksForRoom)) return "000";

    const daily = tasksForRoom.find(t => t.category === categoryTypes.daily);
    const floor       = tasksForRoom.find(t => t.category === categoryTypes.floor);
    const inventory   = tasksForRoom.find(t => t.category === categoryTypes.inventory);

    const s = countDays(daily);
    const g = countDays(floor);
    const i = countDays(inventory);

    return `${s}${g}${i}`;
}

module.exports = {
    calculateProgramCodeForRoom,
};
