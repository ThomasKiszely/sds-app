const { categoryTypes } = require("../utils/categoryEnum");

// Hjælpefunktion: tæl antal dage på en opgave
function countDays(task) {
    if (!task || !Array.isArray(task.days)) return 0;
    return task.days.length;
}

// Beregn programkode for et rum ud fra dets SDS-opgaver
function calculateProgramCodeForRoom(tasksForRoom) {
    if (!Array.isArray(tasksForRoom)) return "000";

    const soignering = tasksForRoom.find(t => t.category === categoryTypes.daily);
    const gulv       = tasksForRoom.find(t => t.category === categoryTypes.floor);
    const inventar   = tasksForRoom.find(t => t.category === categoryTypes.inventory);

    const s = countDays(soignering);
    const g = countDays(gulv);
    const i = countDays(inventar);

    return `${s}${g}${i}`;
}

module.exports = {
    calculateProgramCodeForRoom,
};
