// services/newPlanDraftService.js

const cleaningTaskTemplateService = require("./cleaningTaskTemplateService");
const cleaningPlanService = require("./cleaningPlanService");
const cleaningTaskService = require("./cleaningTaskService");
const roomTemplateService = require("../services/roomTemplateService");
const systemSettingsService = require("../services/systemSettingsService");
const customerService = require("./customerService");

const { calculateTaskPrice, calculateTotals } = require("./priceService");
const { groupSdsTasksByRoom } = require("../utils/groupedUtil");
const { categoryTypes, categoryLabels } = require("../utils/categoryEnum");
const { days, daysLabels } = require("../utils/dayEnum");
const { frequencies, frequencyLabels } = require("../utils/frequencyEnum");
const { units, unitsLabels } = require("../utils/unitEnum");
const { paymentTerms, paymentTermLabels } = require("../utils/paymentTerms");
const { terminationNotice, terminationNoticeLabels } = require("../utils/terminationNotice");
const { calculateProgramCodeForRoom } = require("../utils/programCodeUtil");


// CENTRAL PRISBEREGNING — eneste sted i hele systemet
function priceAllTasks(draft) {
    if (!draft.tasks) draft.tasks = [];
    const hourlyRate = draft.hourlyRate || 350;

    const priced = draft.tasks.map(t =>
        calculateTaskPrice(t, hourlyRate)
    );

    draft.tasks.forEach((t, i) => {
        Object.assign(t, priced[i]);
    });

    return draft;
}


// INIT: Start draft
function initDraft(systemSettings) {
    const hourlyRate = systemSettings ? systemSettings.hourlyRate : 350;
    const environmentalFee = systemSettings ? systemSettings.environmentalFee : 4;

    return {
        customerId: null,
        locationId: null,
        name: null,
        description: null,
        rooms: [],
        tasks: [],
        roomNotes: [],
        hourlyRate: hourlyRate,
        discounts: { discountPercent: 0 },
        environment: { environmentalFeePercent: environmentalFee },
        operations: {
            paymentTerms: paymentTerms.netto30,
            terminationNotice: terminationNotice.month3
        }
    };
}


// Tilføj rum til draft (fra skabelon eller tomt)
async function addRoomToDraft(draft, templateId, customName, customSize) {
    if (!draft.rooms) draft.rooms = [];
    if (!draft.tasks) draft.tasks = [];

    let tpl = null;
    if (templateId) {
        const roomTemplates = await roomTemplateService.getAllRoomTemplates();
        tpl = roomTemplates.find(t => t._id.toString() === templateId.toString());
    }

    const baseName = (customName && customName.trim()) || (tpl ? tpl.name : "Nyt rum");
    const size = customSize != null && !isNaN(customSize) && Number(customSize) > 0
        ? Number(customSize)
        : (tpl ? tpl.defaultSize : 20);

    // Find unikt rum-navn
    const existingSameBase = draft.rooms.filter(r =>
        (r.baseName || r.name).toLowerCase() === baseName.toLowerCase() ||
        r.name.toLowerCase().startsWith(baseName.toLowerCase())
    );

    let roomName;
    if (existingSameBase.length === 0 && !draft.rooms.some(r => r.name.toLowerCase() === `${baseName} 1`.toLowerCase())) {
        roomName = `${baseName} 1`;
    } else {
        let count = existingSameBase.length + 1;
        roomName = `${baseName} ${count}`;
        while (draft.rooms.some(r => r.name.toLowerCase() === roomName.toLowerCase())) {
            count++;
            roomName = `${baseName} ${count}`;
        }
    }

    const roomObj = {
        templateId: tpl ? tpl._id.toString() : null,
        name: roomName,
        baseName,
        size
    };

    draft.rooms.push(roomObj);

    // Hvis skabelonen har SDS opgaveskabeloner, opret opgaver
    if (tpl && tpl.taskTemplateId) {
        const { daily, floor, inventory } = tpl.taskTemplateId || {};
        const ids = [daily, floor, inventory].filter(Boolean);

        if (ids.length > 0) {
            const sdsTemplates = await cleaningTaskTemplateService.getByIds(ids);

            for (const taskTpl of sdsTemplates) {
                const cat = taskTpl.category.toLowerCase();

                let autoDays = [];
                if (cat === categoryTypes.daily) {
                    autoDays = [days.monday, days.tuesday, days.wednesday, days.thursday, days.friday];
                } else if (cat === categoryTypes.floor) {
                    autoDays = [days.monday, days.wednesday, days.friday];
                } else if (cat === categoryTypes.inventory) {
                    autoDays = [days.tuesday, days.thursday];
                } else {
                    autoDays = [days.friday];
                }

                draft.tasks.push({
                    templateId: taskTpl._id,
                    name: taskTpl.name,
                    description: taskTpl.description || "",
                    category: cat,
                    unit: taskTpl.unit || units.m2,
                    durationPerUnit: taskTpl.durationPerUnit || 0,
                    frequency: taskTpl.frequency || frequencies.weekly,
                    days: autoDays,
                    amount: size,
                    roomName: roomName,
                    customPrice: taskTpl.customPrice ?? null
                });
            }
        }
    }

    priceAllTasks(draft);
    return draft;
}


// Fjern rum fra draft
function removeRoomFromDraft(draft, roomName) {
    if (!draft.rooms) draft.rooms = [];
    if (!draft.tasks) draft.tasks = [];

    draft.rooms = draft.rooms.filter(r => r.name !== roomName);
    draft.tasks = draft.tasks.filter(t => t.roomName !== roomName);
    if (draft.roomNotes) {
        draft.roomNotes = draft.roomNotes.filter(n => n.roomName !== roomName);
    }

    priceAllTasks(draft);
    return draft;
}


// Opdater rum (navn / størrelse)
function updateRoomInDraft(draft, oldRoomName, newRoomName, newSize) {
    if (!draft.rooms) draft.rooms = [];
    if (!draft.tasks) draft.tasks = [];

    const room = draft.rooms.find(r => r.name === oldRoomName);
    if (!room) return draft;

    const trimmedName = (newRoomName && newRoomName.trim()) ? newRoomName.trim() : oldRoomName;
    const sizeNum = newSize != null && !isNaN(newSize) && Number(newSize) >= 0 ? Number(newSize) : room.size;

    room.name = trimmedName;
    room.size = sizeNum;

    // Opdater opgaver i dette rum
    draft.tasks.forEach(t => {
        if (t.roomName === oldRoomName) {
            t.roomName = trimmedName;
            // Opdater opgavens amount til lokalets nye størrelse hvis det er en arealbaseret/rum-opgave
            if (t.unit === units.m2 || t.unit === units.ingen || t.category === categoryTypes.daily || t.category === categoryTypes.floor || t.category === categoryTypes.inventory) {
                t.amount = sizeNum;
            }
        }
    });

    // Opdater noter
    if (draft.roomNotes) {
        draft.roomNotes.forEach(n => {
            if (n.roomName === oldRoomName) {
                n.roomName = trimmedName;
            }
        });
    }

    priceAllTasks(draft);
    return draft;
}


// Reorder rum i plan
function reorderRoomsInDraft(draft, orderedRoomNames) {
    if (!draft.rooms || !Array.isArray(orderedRoomNames)) return draft;

    draft.rooms.sort((a, b) => {
        const idxA = orderedRoomNames.indexOf(a.name);
        const idxB = orderedRoomNames.indexOf(b.name);
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
    });

    return draft;
}


// Tilføj opgave til rum eller direkte til planen (uden rum)
async function addTaskToRoomInDraft(draft, roomName, templateId, slotName) {
    if (!draft.tasks) draft.tasks = [];
    const taskTpl = await cleaningTaskTemplateService.findTemplateById(templateId);
    if (!taskTpl) throw new Error("Opgaveskabelon blev ikke fundet");

    const cleanRoomName = (roomName && typeof roomName === "string" && roomName.trim() !== "") ? roomName.trim() : "";
    const room = cleanRoomName ? (draft.rooms || []).find(r => r.name === cleanRoomName) : null;
    const amount = room ? room.size : (taskTpl.amount || 1);
    const cat = (taskTpl.category || "other").toLowerCase();

    let autoDays = [];
    if (taskTpl.days && taskTpl.days.length > 0) {
        autoDays = [...taskTpl.days];
    } else if (cat === categoryTypes.daily) {
        autoDays = [days.monday, days.tuesday, days.wednesday, days.thursday, days.friday];
    } else if (cat === categoryTypes.floor) {
        autoDays = [days.monday, days.wednesday, days.friday];
    } else if (cat === categoryTypes.inventory) {
        autoDays = [days.tuesday, days.thursday];
    } else if (cat === categoryTypes.consumables) {
        autoDays = [];
    } else {
        autoDays = [days.monday];
    }

    // Hvis der er angivet et specifikt rum og en SDS-kategori / slot, erstat evt. eksisterende
    if (cleanRoomName) {
        if (slotName) {
            draft.tasks = draft.tasks.filter(t => !(t.roomName === cleanRoomName && t.category === slotName));
        } else if (cat === categoryTypes.daily || cat === categoryTypes.floor || cat === categoryTypes.inventory) {
            draft.tasks = draft.tasks.filter(t => !(t.roomName === cleanRoomName && t.category === cat));
        }
    }

    draft.tasks.push({
        templateId: taskTpl._id,
        name: taskTpl.name,
        description: taskTpl.description || "",
        category: cat,
        unit: taskTpl.unit || units.m2,
        durationPerUnit: taskTpl.durationPerUnit || 0,
        frequency: taskTpl.frequency || frequencies.weekly,
        days: autoDays,
        amount: amount,
        roomName: cleanRoomName,
        customPrice: taskTpl.customPrice ?? null
    });

    priceAllTasks(draft);
    return draft;
}


// Fjern opgave fra draft
function removeTaskFromDraft(draft, roomName, templateId, taskIndex) {
    if (!draft.tasks) draft.tasks = [];

    if (taskIndex !== undefined && taskIndex !== "" && !isNaN(taskIndex)) {
        draft.tasks.splice(Number(taskIndex), 1);
    } else if (roomName && templateId) {
        draft.tasks = draft.tasks.filter(t => !(t.roomName === roomName && t.templateId.toString() === templateId.toString()));
    } else if (templateId) {
        draft.tasks = draft.tasks.filter(t => t.templateId.toString() !== templateId.toString());
    }

    priceAllTasks(draft);
    return draft;
}


// Opdater opgave i draft (amount, frequency, days, customPrice)
function updateTaskInDraft(draft, { roomName, templateId, taskIndex, frequency, amount, days: taskDays, customPrice }) {
    if (!draft.tasks) draft.tasks = [];

    let task = null;
    if (taskIndex !== undefined && taskIndex !== "" && !isNaN(taskIndex) && draft.tasks[Number(taskIndex)]) {
        task = draft.tasks[Number(taskIndex)];
    } else if (roomName && templateId) {
        task = draft.tasks.find(t => t.roomName === roomName && t.templateId.toString() === templateId.toString());
    } else if (templateId) {
        task = draft.tasks.find(t => t.templateId.toString() === templateId.toString());
    }

    if (task) {
        if (frequency !== undefined && frequency !== "") task.frequency = frequency;
        if (amount !== undefined && amount !== "" && !isNaN(amount)) task.amount = Number(amount);
        if (taskDays !== undefined) {
            task.days = Array.isArray(taskDays) ? taskDays : (taskDays ? [taskDays] : []);
        }
        if (customPrice !== undefined) {
            task.customPrice = customPrice === "" || customPrice == null ? null : Number(customPrice);
        }
    }

    priceAllTasks(draft);
    return draft;
}


// Tilføj dag til opgave eller alle opgaver i rum
function addDayToDraft(draft, roomName, templateId, day, taskIndex) {
    if (!day) return draft;
    if (!draft.rooms) draft.rooms = [];
    if (!draft.tasks) draft.tasks = [];

    if (taskIndex !== undefined && taskIndex !== "" && !isNaN(taskIndex) && draft.tasks[Number(taskIndex)]) {
        const task = draft.tasks[Number(taskIndex)];
        if (!Array.isArray(task.days)) task.days = [];
        if (!task.days.includes(day)) task.days.push(day);
    } else if (templateId && roomName) {
        const task = draft.tasks.find(t =>
            t.roomName === roomName && t.templateId.toString() === templateId.toString()
        );
        if (task) {
            if (!Array.isArray(task.days)) task.days = [];
            if (!task.days.includes(day)) task.days.push(day);
        }
    } else if (templateId) {
        const task = draft.tasks.find(t =>
            t.templateId.toString() === templateId.toString()
        );
        if (task) {
            if (!Array.isArray(task.days)) task.days = [];
            if (!task.days.includes(day)) task.days.push(day);
        }
    } else if (roomName) {
        const room = draft.rooms.find(r => r.name === roomName);
        if (room) {
            if (!Array.isArray(room.days)) room.days = [];
            if (!room.days.includes(day)) room.days.push(day);
        }
        draft.tasks.forEach(t => {
            if (t.roomName === roomName) {
                if (!Array.isArray(t.days)) t.days = [];
                if (!t.days.includes(day)) t.days.push(day);
            }
        });
    }

    priceAllTasks(draft);
    return draft;
}


// Fjern dag fra opgave eller alle opgaver i rum
function removeDayFromDraft(draft, roomName, templateId, day, taskIndex) {
    if (!day) return draft;
    if (!draft.rooms) draft.rooms = [];
    if (!draft.tasks) draft.tasks = [];

    if (taskIndex !== undefined && taskIndex !== "" && !isNaN(taskIndex) && draft.tasks[Number(taskIndex)]) {
        const task = draft.tasks[Number(taskIndex)];
        if (Array.isArray(task.days)) {
            task.days = task.days.filter(d => d !== day);
        }
    } else if (templateId && roomName) {
        const task = draft.tasks.find(t =>
            t.roomName === roomName && t.templateId.toString() === templateId.toString()
        );
        if (task && Array.isArray(task.days)) {
            task.days = task.days.filter(d => d !== day);
        }
    } else if (templateId) {
        const task = draft.tasks.find(t =>
            t.templateId.toString() === templateId.toString()
        );
        if (task && Array.isArray(task.days)) {
            task.days = task.days.filter(d => d !== day);
        }
    } else if (roomName) {
        const room = draft.rooms.find(r => r.name === roomName);
        if (room && Array.isArray(room.days)) {
            room.days = room.days.filter(d => d !== day);
        }
        draft.tasks.forEach(t => {
            if (t.roomName === roomName && Array.isArray(t.days)) {
                t.days = t.days.filter(d => d !== day);
            }
        });
    }

    priceAllTasks(draft);
    return draft;
}


// Sæt dage for et helt rum
function setDaysForRoomInDraft(draft, roomName, daysArray) {
    if (!draft.rooms) draft.rooms = [];
    if (!draft.tasks) draft.tasks = [];

    const room = draft.rooms.find(r => r.name === roomName);
    if (room) {
        room.days = [...daysArray];
    }

    draft.tasks.forEach(t => {
        if (t.roomName === roomName) {
            t.days = [...daysArray];
        }
    });

    priceAllTasks(draft);
    return draft;
}


// Byg Viewmodel til Editoren
async function buildEditorViewModel(draft, systemSettings, customer, location) {
    priceAllTasks(draft);

    const roomTemplates = await roomTemplateService.getAllRoomTemplates();
    const taskTemplates = await cleaningTaskTemplateService.listTemplates();

    const discountPercent = draft.discounts?.discountPercent || 0;
    const environmentalFeePercent = draft.environment?.environmentalFeePercent != null
        ? draft.environment.environmentalFeePercent
        : (systemSettings ? systemSettings.environmentalFee : 4);

    const totals = calculateTotals({
        tasks: draft.tasks || [],
        discountPercent,
        environmentalFeePercent
    });

    // Grupper opgaver pr. rum
    const roomsMap = {};
    (draft.rooms || []).forEach(r => {
        roomsMap[r.name] = {
            name: r.name,
            baseName: r.baseName || r.name,
            size: r.size || 0,
            templateId: r.templateId,
            tasks: [],
            daily: null,
            floor: null,
            inventory: null,
            sds: [],
            otherTasks: [],
            totalPrice: 0,
            days: Array.isArray(r.days) ? [...r.days] : []
        };
    });

    const generalTasks = [];

    (draft.tasks || []).forEach((t, idx) => {
        t._idx = idx;
        if (t.roomName && roomsMap[t.roomName]) {
            const rm = roomsMap[t.roomName];
            rm.tasks.push(t);

            if (t.category === categoryTypes.daily) {
                rm.daily = t;
                rm.sds.push(t);
            } else if (t.category === categoryTypes.floor) {
                rm.floor = t;
                rm.sds.push(t);
            } else if (t.category === categoryTypes.inventory) {
                rm.inventory = t;
                rm.sds.push(t);
            } else {
                rm.otherTasks.push(t);
            }

            const itemPrice = t.monthlyPrice > 0 ? t.monthlyPrice : (t.pricePerOccurrence || t.pricePerTime || t.totalPrice || 0);
            rm.totalPrice += itemPrice;

            if (Array.isArray(t.days)) {
                t.days.forEach(d => {
                    if (!rm.days.includes(d)) rm.days.push(d);
                });
            }
        } else {
            generalTasks.push(t);
        }
    });

    // Beregn programkoder
    Object.values(roomsMap).forEach(rm => {
        rm.sds.sort((a, b) => a.category.localeCompare(b.category));
        rm.programCode = calculateProgramCodeForRoom(rm.sds);
    });

    // SDS grouped struktur for kompatibilitet
    const grouped = groupSdsTasksByRoom(draft.tasks || []);

    return {
        draft,
        customer,
        location,
        roomTemplates,
        taskTemplates,
        roomsList: Object.values(roomsMap),
        generalTasks,
        grouped,
        groupedArray: Object.values(grouped),
        subtotal: totals.subtotal,
        monthlyTotal: totals.subtotal,
        discountPercent: totals.discountPercent,
        discountAmount: totals.discountAmount,
        environmentalFeePercent: totals.environmentalFeePercent,
        environmentalFeeAmount: totals.environmentalFeeAmount,
        finalTotal: totals.total,
        discounts: draft.discounts || {},
        environment: draft.environment || {},
        operations: draft.operations || {},
        paymentTerms,
        paymentTermLabels,
        terminationNotice,
        terminationNoticeLabels,
        systemSettings: systemSettings || {},
        categoryTypes,
        categoryLabels,
        days,
        daysLabels,
        frequencies,
        frequencyLabels,
        units,
        unitsLabels
    };
}


// STEP 2: Vælg rum → generér rum-instansliste (for backwards compatibility)
async function generateRooms(selectedTemplates, counts) {
    const roomTemplates = await roomTemplateService.getAllRoomTemplates();
    const rooms = [];

    for (const templateId of selectedTemplates) {
        const tpl = roomTemplates.find(t => t._id.toString() === templateId);
        if (!tpl) throw new Error(`Room template not found: ${templateId}`);

        const count = Number(counts[templateId] || 1);

        for (let i = 1; i <= count; i++) {
            rooms.push({
                templateId,
                taskTemplateId: tpl.taskTemplateId,
                name: count === 1 ? tpl.name : `${tpl.name} ${i}`,
                baseName: tpl.name,
                index: i,
                size: tpl.defaultSize,
            });
        }
    }

    return rooms;
}


// STEP 3: Generér SDS tasks for hvert rum (uden pris)
async function generateDraftTasks(draft) {
    const tasks = [];

    for (const room of draft.rooms) {
        const { daily, floor, inventory } = room.taskTemplateId || {};
        const ids = [daily, floor, inventory].filter(Boolean);

        const sdsTemplates = await cleaningTaskTemplateService.getByIds(ids);

        for (const tpl of sdsTemplates) {
            const cat = tpl.category.toLowerCase();

            let autoDays = [];
            if (cat === categoryTypes.daily) {
                autoDays = [days.monday, days.tuesday, days.wednesday, days.thursday, days.friday];
            } else if (cat === categoryTypes.floor) {
                autoDays = [days.monday, days.wednesday, days.friday];
            } else if (cat === categoryTypes.inventory) {
                autoDays = [days.tuesday, days.thursday];
            } else {
                autoDays = [days.friday];
            }

            const base = {
                templateId: tpl._id,
                name: tpl.name,
                description: tpl.description,
                category: cat,
                unit: tpl.unit,
                durationPerUnit: tpl.durationPerUnit,
                frequency: "weekly",
                days: autoDays,
                amount: room.size,
                roomName: room.name,
                customPrice: tpl.customPrice ?? null
            };

            tasks.push(base);
        }
    }

    draft.tasks = tasks;
    priceAllTasks(draft);

    return buildTaskViewModel(draft);
}


// Hjælpemetode: Byg viewmodel for tasks
function buildTaskViewModel(draft) {
    const tasks = draft.tasks || [];
    const grouped = groupSdsTasksByRoom(tasks);

    const totals = calculateTotals({
        tasks,
        discountPercent: draft.discounts?.discountPercent || 0,
        environmentalFeePercent: draft.environment?.environmentalFeePercent ?? 0
    });

    return {
        tasks,
        grouped,
        monthlyTotal: totals.subtotal,
        yearlyTotal: totals.subtotal * 12
    };
}


function getBundleForRoom(draft, roomName) {
    const tasks = (draft.tasks || []).filter(t => t.roomName === roomName);

    if (tasks.length !== 3) {
        throw new Error("Bundle mangler opgaver");
    }

    return tasks.sort((a, b) => a.category.localeCompare(b.category));
}


function updateBundle(draft, roomName, body) {
    const tasks = (draft.tasks || []).filter(t => t.roomName === roomName);

    for (const t of tasks) {
        t.frequency = body[`frequency_${t.templateId}`];

        const rawDays = body[`days_${t.templateId}`];
        t.days = Array.isArray(rawDays) ? rawDays : rawDays ? [rawDays] : [];
    }

    priceAllTasks(draft);
    return buildTaskViewModel(draft);
}


function updateAdjustments(draft, body, systemSettings) {
    draft.discounts = draft.discounts || {};
    draft.environment = draft.environment || {};
    draft.operations = draft.operations || {};

    draft.discounts.discountPercent = Number(body.discountPercent || 0);
    draft.environment.environmentalFeePercent = body.environmentalFeePercent != null
        ? Number(body.environmentalFeePercent)
        : (systemSettings ? systemSettings.environmentalFee : 4);

    if (body.paymentTerms) {
        draft.operations.paymentTerms = body.paymentTerms;
    }

    if (body.terminationNotice) {
        draft.operations.terminationNotice = body.terminationNotice;
    }

    return draft;
}


function buildOffer(draft) {
    const totals = calculateTotals({
        tasks: draft.tasks || [],
        discountPercent: draft.discounts?.discountPercent || 0,
        environmentalFeePercent: draft.environment?.environmentalFeePercent ?? 0
    });

    return {
        tasks: draft.tasks || [],
        grouped: groupSdsTasksByRoom(draft.tasks || []),
        monthlyTotal: totals.subtotal,
        finalTotal: totals.total,
        discounts: draft.discounts,
        environment: draft.environment,
        operations: draft.operations,
        environmentalFeeAmount: totals.environmentalFeeAmount,
        discountAmount: totals.discountAmount,
        categoryTypes,
        daysLabels,
        frequencyLabels
    };
}


async function finalizePlan(draft) {
    const totals = calculateTotals({
        tasks: draft.tasks || [],
        discountPercent: draft.discounts?.discountPercent || 0,
        environmentalFeePercent: draft.environment?.environmentalFeePercent ?? 0
    });
    const customer = await customerService.getCustomerById(draft.customerId);

    const plan = await cleaningPlanService.createCleaningPlan({
        customerId: draft.customerId,
        locationId: draft.locationId || null,
        name: draft.name || ("Rengøringsplan - " + (customer ? customer.customerName : "")),
        description: draft.description || "",
        roomNotes: draft.roomNotes || [],
        hourlyRate: draft.hourlyRate,

        subtotalBeforeDiscount: totals.subtotal,
        discountPercent: totals.discountPercent,
        discountAmount: totals.discountAmount,
        environmentalFeePercent: totals.environmentalFeePercent,
        environmentalFeeAmount: totals.environmentalFeeAmount,
        indexRegulationPercent: draft.indexRegulationPercent ?? 0,
        totalMonthlyPrice: totals.total,
        paymentTerms: draft.operations?.paymentTerms,
        terminationNotice: draft.operations?.terminationNotice,
    });

    for (const t of draft.tasks) {
        await cleaningTaskService.createCleaningTask(plan._id, t);
    }

    await cleaningPlanService.recalculatePlanTotal(plan._id);

    return { plan };
}


function updateRoomNotes(draft, roomName, notesText) {
    draft.roomNotes = draft.roomNotes || [];

    const existing = draft.roomNotes.find(r => r.roomName === roomName);

    if (existing) {
        existing.notes = notesText ? (Array.isArray(notesText) ? notesText : notesText.split("\n")) : [];
    } else {
        draft.roomNotes.push({
            roomName,
            notes: notesText ? (Array.isArray(notesText) ? notesText : notesText.split("\n")) : []
        });
    }
}


module.exports = {
    initDraft,
    generateRooms,
    generateDraftTasks,
    addRoomToDraft,
    removeRoomFromDraft,
    updateRoomInDraft,
    reorderRoomsInDraft,
    addTaskToRoomInDraft,
    removeTaskFromDraft,
    updateTaskInDraft,
    addDayToDraft,
    removeDayFromDraft,
    setDaysForRoomInDraft,
    buildEditorViewModel,
    getBundleForRoom,
    updateBundle,
    updateAdjustments,
    buildOffer,
    finalizePlan,
    priceAllTasks,
    buildTaskViewModel,
    updateRoomNotes
};
