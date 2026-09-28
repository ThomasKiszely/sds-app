const { categoryTypes } = require("./categoryEnum");
const { frequencies, frequencyLabels } = require("./frequencyEnum");
const { calculateProgramCodeForRoom } = require("./programCodeUtil");

function groupSdsTasksByRoom(tasks) {
    const rooms = {};

    for (const t of tasks) {

        // Kun SDS-opgaver skal grouped
        const isSds =
            t.category === categoryTypes.daily ||
            t.category === categoryTypes.floor ||
            t.category === categoryTypes.inventory;

        if (!isSds) continue;

        // SDS-opgaver SKAL have rum
        if (!t.roomName || t.roomName.trim() === "") continue;

        if (!rooms[t.roomName]) {
            rooms[t.roomName] = { sds: [] };
        }

        rooms[t.roomName].sds.push(t);
    }

    // Beregn programkode pr rum
    for (const roomName of Object.keys(rooms)) {
        const sdsTasks = rooms[roomName].sds;

        // Sortér SDS-opgaver efter kategori (daily, floor, inventory)
        sdsTasks.sort((a, b) => a.category.localeCompare(b.category));

        rooms[roomName].programCode = calculateProgramCodeForRoom(sdsTasks);

        // SDS-opgaver der ikke sker ugentligt indgår ikke i programkoden (kun days.length tælles),
        // så de vises i stedet som bemærkninger på rummet (fx "Radiatorer – Halvårlig")
        rooms[roomName].extraNotes = sdsTasks
            .filter(t => t.frequency && t.frequency !== frequencies.weekly)
            .map(t => `${t.name} – ${frequencyLabels[t.frequency] || t.frequency}`);
    }

    return rooms;
}

module.exports = { groupSdsTasksByRoom };
