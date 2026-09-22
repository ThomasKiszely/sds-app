// services/newPlanService.js

const cleaningPlanService = require("./cleaningPlanService");
const cleaningTaskService = require("./cleaningTaskService");
const cleaningTaskTemplateService = require("./cleaningTaskTemplateService");
const customerService = require("./customerService");
const locationService = require("./locationService");
const systemSettingsService = require("./systemSettingsService");
const roomTemplateService = require("./roomTemplateService");
const cleaningPlanRepo = require("../data/cleaningPlanRepo");
const cleaningTaskRepo = require("../data/cleaningTaskRepo");
const cleaningTaskTemplateRepo = require("../data/cleaningTaskTemplateRepo");

const { categoryTypes, categoryLabels } = require("../utils/categoryEnum");
const { days, daysLabels } = require("../utils/dayEnum");
const { frequencies, frequencyLabels } = require("../utils/frequencyEnum");
const { units, unitsLabels } = require("../utils/unitEnum");
const { paymentTerms, paymentTermLabels } = require("../utils/paymentTerms");
const { terminationNotice, terminationNoticeLabels } = require("../utils/terminationNotice");
const { calculateTaskPrice, calculateTotals } = require("./priceService");
const { calculateProgramCodeForRoom } = require("../utils/programCodeUtil");
const { groupSdsTasksByRoom } = require("../utils/groupedUtil");

/**
 * Byg Viewmodel til Editoren for en eksisterende CleaningPlan i DB
 */
async function buildExistingPlanViewModel(planId) {
    const plan = await cleaningPlanService.findCleaningPlanById(planId);
    if (!plan) {
        throw new Error("Rengøringsplan blev ikke fundet.");
    }

    const systemSettings = await systemSettingsService.getSettings();
    const rawTasks = await cleaningTaskRepo.findByPlanId(planId);

    let customer = null;
    if (plan.customerId) {
        try {
            customer = await customerService.getCustomerById(plan.customerId);
        } catch (e) {
            console.error("Kunne ikke hente kunde:", e.message);
        }
    }

    let location = null;
    if (plan.locationId) {
        try {
            location = await locationService.getLocationById(plan.locationId);
        } catch (e) {
            console.error("Kunne ikke hente lokation:", e.message);
        }
    }

    const roomTemplates = await roomTemplateService.getAllRoomTemplates();
    const taskTemplates = await cleaningTaskTemplateService.listTemplates();

    const hourlyRate = plan.hourlyRate || systemSettings?.hourlyRate || 350;

    // Berig opgaver med beregnede priser og indeks
    const tasks = rawTasks.map((t, idx) => {
        const plain = typeof t.toObject === 'function' ? t.toObject() : { ...t };
        const prices = calculateTaskPrice(plain, hourlyRate);
        return { ...plain, ...prices, _idx: idx };
    });

    const discountPercent = plan.discountPercent || 0;
    const environmentalFeePercent = plan.environmentalFeePercent != null
        ? plan.environmentalFeePercent
        : (systemSettings ? systemSettings.environmentalFee : 4);

    const totals = calculateTotals({
        tasks,
        discountPercent,
        environmentalFeePercent
    });

    // Grupper opgaver pr. rum
    const roomsMap = {};

    // Initialiser fra plan.roomNotes (hvis der er tomme lokaler oprettet)
    (plan.roomNotes || []).forEach(rn => {
        if (rn.roomName) {
            roomsMap[rn.roomName] = {
                name: rn.roomName,
                baseName: rn.roomName.replace(/\s+\d+$/, ""),
                size: 20,
                templateId: null,
                tasks: [],
                daily: null,
                floor: null,
                inventory: null,
                sds: [],
                otherTasks: [],
                totalPrice: 0,
                days: []
            };
        }
    });

    const generalTasks = [];

    tasks.forEach(t => {
        if (t.roomName) {
            if (!roomsMap[t.roomName]) {
                roomsMap[t.roomName] = {
                    name: t.roomName,
                    baseName: t.roomName.replace(/\s+\d+$/, ""),
                    size: t.amount || 20,
                    templateId: null,
                    tasks: [],
                    daily: null,
                    floor: null,
                    inventory: null,
                    sds: [],
                    otherTasks: [],
                    totalPrice: 0,
                    days: []
                };
            }

            const rm = roomsMap[t.roomName];
            rm.tasks.push(t);

            if (t.category === categoryTypes.daily) {
                rm.daily = t;
                rm.sds.push(t);
                if (t.amount > 0) rm.size = t.amount;
            } else if (t.category === categoryTypes.floor) {
                rm.floor = t;
                rm.sds.push(t);
                if (t.amount > 0) rm.size = t.amount;
            } else if (t.category === categoryTypes.inventory) {
                rm.inventory = t;
                rm.sds.push(t);
                if (t.amount > 0) rm.size = t.amount;
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

    // Beregn programkoder for lokaler
    Object.values(roomsMap).forEach(rm => {
        rm.sds.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
        rm.programCode = calculateProgramCodeForRoom(rm.sds);
    });

    const grouped = groupSdsTasksByRoom(tasks);

    return {
        baseUrl: `/newPlan/${plan._id}`,
        isEditing: true,
        planId: plan._id.toString(),
        plan,
        draft: {
            planId: plan._id.toString(),
            customerId: plan.customerId?._id || plan.customerId,
            locationId: plan.locationId?._id || plan.locationId,
            hourlyRate: plan.hourlyRate,
            discounts: { discountPercent: plan.discountPercent || 0 },
            environment: { environmentalFeePercent: plan.environmentalFeePercent },
            operations: {
                paymentTerms: plan.paymentTerms || paymentTerms.netto30,
                terminationNotice: plan.terminationNotice || terminationNotice.month3
            },
            roomNotes: plan.roomNotes || []
        },
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
        discounts: { discountPercent: plan.discountPercent || 0 },
        environment: { environmentalFeePercent: plan.environmentalFeePercent ?? (systemSettings?.environmentalFee || 4) },
        operations: {
            paymentTerms: plan.paymentTerms || paymentTerms.netto30,
            terminationNotice: plan.terminationNotice || terminationNotice.month3
        },
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

/**
 * Tilføj lokale til en eksisterende plan i DB
 */
async function addRoomToPlan(planId, { templateId, name: customName, size: customSize }) {
    const plan = await cleaningPlanService.findCleaningPlanById(planId);
    if (!plan) throw new Error("Plan blev ikke fundet.");

    const existingTasks = await cleaningTaskRepo.findByPlanId(planId);
    const existingRoomNames = new Set([
        ...existingTasks.map(t => t.roomName).filter(Boolean),
        ...(plan.roomNotes || []).map(rn => rn.roomName).filter(Boolean)
    ]);

    let tpl = null;
    if (templateId) {
        const roomTemplates = await roomTemplateService.getAllRoomTemplates();
        tpl = roomTemplates.find(t => t._id.toString() === templateId.toString());
    }

    const baseName = (customName && customName.trim()) || (tpl ? tpl.name : "Nyt lokale");
    const size = customSize != null && !isNaN(customSize) && Number(customSize) > 0
        ? Number(customSize)
        : (tpl ? tpl.defaultSize : 20);

    // Find unikt lokalenavn
    let roomName;
    if (!existingRoomNames.has(`${baseName} 1`) && !existingRoomNames.has(baseName)) {
        roomName = `${baseName} 1`;
    } else {
        let count = 1;
        while (existingRoomNames.has(`${baseName} ${count}`)) {
            count++;
        }
        roomName = `${baseName} ${count}`;
    }

    // Registrer i roomNotes
    const roomNotes = plan.roomNotes || [];
    if (!roomNotes.some(r => r.roomName === roomName)) {
        roomNotes.push({ roomName, notes: [] });
        await cleaningPlanRepo.updateById(planId, { roomNotes });
    }

    // Hvis skabelonen har SDS opgaveskabeloner, opret opgaverne i DB
    if (tpl && tpl.taskTemplateId) {
        const { daily, floor, inventory } = tpl.taskTemplateId || {};
        const ids = [daily, floor, inventory].filter(Boolean);

        if (ids.length > 0) {
            const sdsTemplates = await cleaningTaskTemplateService.getByIds(ids);

            for (const sdsTpl of sdsTemplates) {
                let autoDays = [];
                if (sdsTpl.category === categoryTypes.daily) {
                    autoDays = [days.monday, days.tuesday, days.wednesday, days.thursday, days.friday];
                } else if (sdsTpl.category === categoryTypes.inventory) {
                    autoDays = [days.tuesday, days.thursday];
                } else {
                    autoDays = [days.friday];
                }

                await cleaningTaskService.createCleaningTask(planId, {
                    templateId: sdsTpl._id,
                    name: sdsTpl.name,
                    description: sdsTpl.description,
                    category: sdsTpl.category,
                    unit: sdsTpl.unit,
                    durationPerUnit: sdsTpl.durationPerUnit,
                    frequency: "weekly",
                    days: autoDays,
                    amount: size,
                    roomName,
                    customPrice: sdsTpl.customPrice ?? null
                });
            }
        }
    }

    await cleaningPlanService.recalculatePlanTotal(planId);
    return { roomName, size };
}

/**
 * Fjern lokale fra eksisterende plan i DB
 */
async function removeRoomFromPlan(planId, roomName) {
    if (!roomName) return;

    const tasks = await cleaningTaskRepo.findByPlanId(planId);
    const roomTasks = tasks.filter(t => t.roomName === roomName);

    for (const t of roomTasks) {
        await cleaningTaskRepo.deleteById(t._id);
    }

    const plan = await cleaningPlanRepo.findById(planId);
    if (plan && plan.roomNotes) {
        const updatedNotes = plan.roomNotes.filter(rn => rn.roomName !== roomName);
        await cleaningPlanRepo.updateById(planId, { roomNotes: updatedNotes });
    }

    await cleaningPlanService.recalculatePlanTotal(planId);
}

/**
 * Opdater lokale (navn og/eller størrelse) i DB
 */
async function updateRoomInPlan(planId, { oldRoomName, newRoomName, size }) {
    const tasks = await cleaningTaskRepo.findByPlanId(planId);

    const targetOldName = oldRoomName || newRoomName;
    const targetNewName = (newRoomName && newRoomName.trim()) || targetOldName;
    const parsedSize = size != null && !isNaN(size) ? Number(size) : null;

    for (const t of tasks) {
        if (t.roomName === targetOldName) {
            const updates = {};
            if (targetNewName !== targetOldName) {
                updates.roomName = targetNewName;
            }
            if (parsedSize != null && [categoryTypes.daily, categoryTypes.floor, categoryTypes.inventory].includes(t.category)) {
                updates.amount = parsedSize;
            }

            if (Object.keys(updates).length > 0) {
                await cleaningTaskRepo.updateById(t._id, updates);
            }
        }
    }

    // Opdater også roomNotes
    const plan = await cleaningPlanRepo.findById(planId);
    if (plan && plan.roomNotes && targetNewName !== targetOldName) {
        const rn = plan.roomNotes.find(r => r.roomName === targetOldName);
        if (rn) {
            rn.roomName = targetNewName;
            await cleaningPlanRepo.updateById(planId, { roomNotes: plan.roomNotes });
        }
    }

    await cleaningPlanService.recalculatePlanTotal(planId);
}

/**
 * Reorder lokaler i plan
 */
async function reorderRoomsInPlan(planId, order) {
    if (!order) return;
    const parsedOrder = Array.isArray(order) ? order : JSON.parse(order || "[]");
    if (!Array.isArray(parsedOrder) || parsedOrder.length === 0) return;

    const plan = await cleaningPlanRepo.findById(planId);
    if (!plan) return;

    const currentNotes = plan.roomNotes || [];
    const orderedNotes = [];

    parsedOrder.forEach(rName => {
        const existing = currentNotes.find(rn => rn.roomName === rName);
        if (existing) {
            orderedNotes.push(existing);
        } else {
            orderedNotes.push({ roomName: rName, notes: [] });
        }
    });

    currentNotes.forEach(rn => {
        if (!orderedNotes.some(o => o.roomName === rn.roomName)) {
            orderedNotes.push(rn);
        }
    });

    await cleaningPlanRepo.updateById(planId, { roomNotes: orderedNotes });
}

/**
 * Tilføj opgave til eksisterende plan i DB
 */
async function addTaskToPlan(planId, { templateId, roomName }) {
    const tpl = await cleaningTaskTemplateRepo.findTemplateById(templateId);
    if (!tpl) throw new Error("Opgaveskabelon ikke fundet.");

    const targetRoom = roomName || "";
    let roomSize = 1;
    let autoDays = [];

    if (targetRoom) {
        const existingTasks = await cleaningTaskRepo.findByPlanId(planId);
        const roomTasks = existingTasks.filter(t => t.roomName === targetRoom);
        const sdsTask = roomTasks.find(t => [categoryTypes.daily, categoryTypes.floor, categoryTypes.inventory].includes(t.category));
        roomSize = sdsTask ? sdsTask.amount : 20;

        const distinctDays = [...new Set(roomTasks.flatMap(t => t.days || []))];
        autoDays = distinctDays.length > 0 ? distinctDays : [days.monday, days.wednesday, days.friday];
    } else {
        autoDays = [days.monday];
    }

    const isConsumable = tpl.category === categoryTypes.consumables;

    await cleaningTaskService.createCleaningTask(planId, {
        templateId: tpl._id,
        name: tpl.name,
        description: tpl.description || "",
        category: tpl.category,
        unit: tpl.unit,
        durationPerUnit: isConsumable ? 0 : (tpl.durationPerUnit || 0),
        frequency: isConsumable ? "none" : (tpl.frequency || "weekly"),
        days: isConsumable ? [] : autoDays,
        amount: isConsumable ? 1 : roomSize,
        roomName: targetRoom,
        customPrice: tpl.pricePerUnit ?? tpl.customPrice ?? null
    });

    await cleaningPlanService.recalculatePlanTotal(planId);
}

/**
 * Slet opgave fra DB
 */
async function removeTaskFromPlan(planId, { taskId, taskIndex }) {
    let resolvedTaskId = taskId;

    if (!resolvedTaskId && taskIndex != null) {
        const tasks = await cleaningTaskRepo.findByPlanId(planId);
        const idx = Number(taskIndex);
        if (tasks[idx]) {
            resolvedTaskId = tasks[idx]._id;
        }
    }

    if (resolvedTaskId) {
        await cleaningTaskService.deleteCleaningTask(resolvedTaskId);
        await cleaningPlanService.recalculatePlanTotal(planId);
    }
}

/**
 * Opdater opgave i DB (mængde, frekvens, tid, pris)
 */
async function updateTaskInPlan(planId, { taskId, taskIndex, amount, frequency, durationPerUnit, customPrice }) {
    let resolvedTaskId = taskId;

    if (!resolvedTaskId && taskIndex != null) {
        const tasks = await cleaningTaskRepo.findByPlanId(planId);
        const idx = Number(taskIndex);
        if (tasks[idx]) {
            resolvedTaskId = tasks[idx]._id;
        }
    }

    if (!resolvedTaskId) return;

    const updates = {};
    if (amount != null && !isNaN(amount)) updates.amount = Number(amount);
    if (frequency != null) updates.frequency = frequency;
    if (durationPerUnit != null && !isNaN(durationPerUnit)) updates.durationPerUnit = Number(durationPerUnit);
    if (customPrice != null && !isNaN(customPrice)) updates.customPrice = Number(customPrice);

    await cleaningTaskService.updateCleaningTask(resolvedTaskId, updates);
    await cleaningPlanService.recalculatePlanTotal(planId);
}

/**
 * Tilføj dag til alle opgaver i et lokale
 */
async function addDayToRoomInPlan(planId, { roomName, day }) {
    if (!roomName || !day) return;

    const tasks = await cleaningTaskRepo.findByPlanId(planId);
    const roomTasks = tasks.filter(t => t.roomName === roomName);

    for (const t of roomTasks) {
        const currentDays = Array.isArray(t.days) ? [...t.days] : [];
        if (!currentDays.includes(day)) {
            currentDays.push(day);
            await cleaningTaskRepo.updateById(t._id, { days: currentDays });
        }
    }

    await cleaningPlanService.recalculatePlanTotal(planId);
}

/**
 * Sæt præcise dage for et lokale
 */
async function setDaysForRoomInPlan(planId, { roomName, days: daysInput }) {
    if (!roomName) return;

    const daysArray = Array.isArray(daysInput)
        ? daysInput
        : JSON.parse(daysInput || "[]");

    const tasks = await cleaningTaskRepo.findByPlanId(planId);
    const roomTasks = tasks.filter(t => t.roomName === roomName);

    for (const t of roomTasks) {
        await cleaningTaskRepo.updateById(t._id, { days: daysArray });
    }

    await cleaningPlanService.recalculatePlanTotal(planId);
}

/**
 * Tilføj dag til en specifik opgave
 */
async function addDayToTaskInPlan(planId, { taskId, taskIndex, templateId, roomName, day }) {
    if (!day) return;

    let targetTask = null;
    if (taskId) {
        targetTask = await cleaningTaskRepo.findById(taskId);
    }

    if (!targetTask && taskIndex != null) {
        const tasks = await cleaningTaskRepo.findByPlanId(planId);
        targetTask = tasks[Number(taskIndex)];
    }

    if (!targetTask && templateId) {
        const tasks = await cleaningTaskRepo.findByPlanId(planId);
        targetTask = tasks.find(t => (t.roomName || '') === (roomName || '') && t.templateId?.toString() === templateId.toString());
    }

    if (targetTask) {
        const currentDays = Array.isArray(targetTask.days) ? [...targetTask.days] : [];
        if (!currentDays.includes(day)) {
            currentDays.push(day);
            await cleaningTaskRepo.updateById(targetTask._id, { days: currentDays });
            await cleaningPlanService.recalculatePlanTotal(planId);
        }
    }
}

/**
 * Fjern dag fra en specifik opgave eller lokale
 */
async function removeDayFromPlan(planId, { taskId, taskIndex, templateId, roomName, day }) {
    if (!day) return;

    let targetTask = null;
    if (taskId) {
        targetTask = await cleaningTaskRepo.findById(taskId);
    }

    if (!targetTask && taskIndex != null) {
        const tasks = await cleaningTaskRepo.findByPlanId(planId);
        targetTask = tasks[Number(taskIndex)];
    }

    if (!targetTask && templateId) {
        const tasks = await cleaningTaskRepo.findByPlanId(planId);
        targetTask = tasks.find(t => (t.roomName || '') === (roomName || '') && t.templateId?.toString() === templateId.toString());
    }

    if (targetTask) {
        const currentDays = Array.isArray(targetTask.days) ? [...targetTask.days] : [];
        const updatedDays = currentDays.filter(d => d !== day);
        await cleaningTaskRepo.updateById(targetTask._id, { days: updatedDays });
        await cleaningPlanService.recalculatePlanTotal(planId);
    } else if (roomName) {
        // Fjern fra alle opgaver i lokalet
        const tasks = await cleaningTaskRepo.findByPlanId(planId);
        const roomTasks = tasks.filter(t => t.roomName === roomName);

        for (const t of roomTasks) {
            const currentDays = Array.isArray(t.days) ? [...t.days] : [];
            const updatedDays = currentDays.filter(d => d !== day);
            await cleaningTaskRepo.updateById(t._id, { days: updatedDays });
        }
        await cleaningPlanService.recalculatePlanTotal(planId);
    }
}

/**
 * Gem overordnede justeringer (rabat, miljøtillæg, betalingsvilkår)
 */
async function saveSummaryAdjustmentsInPlan(planId, body) {
    const plan = await cleaningPlanRepo.findById(planId);
    if (!plan) throw new Error("Plan ikke fundet.");

    const updates = {};
    if (body.discountPercent != null) updates.discountPercent = Number(body.discountPercent);
    if (body.environmentalFeePercent != null) updates.environmentalFeePercent = Number(body.environmentalFeePercent);
    if (body.paymentTerms) updates.paymentTerms = body.paymentTerms;
    if (body.terminationNotice) updates.terminationNotice = body.terminationNotice;

    await cleaningPlanRepo.updateById(planId, updates);
    await cleaningPlanService.recalculatePlanTotal(planId);
}

/**
 * Opdater bemærkninger til et lokale
 */
async function updateRoomNotesInPlan(planId, roomName, notesText) {
    if (!roomName) return;

    const plan = await cleaningPlanRepo.findById(planId);
    if (!plan) throw new Error("Plan ikke fundet.");

    const roomNotes = plan.roomNotes || [];
    const notesArray = notesText ? (Array.isArray(notesText) ? notesText : notesText.split("\n")) : [];

    const existing = roomNotes.find(r => r.roomName === roomName);
    if (existing) {
        existing.notes = notesArray;
    } else {
        roomNotes.push({ roomName, notes: notesArray });
    }

    await cleaningPlanRepo.updateById(planId, { roomNotes });
}

module.exports = {
    buildExistingPlanViewModel,
    addRoomToPlan,
    removeRoomFromPlan,
    updateRoomInPlan,
    reorderRoomsInPlan,
    addTaskToPlan,
    removeTaskFromPlan,
    updateTaskInPlan,
    addDayToRoomInPlan,
    setDaysForRoomInPlan,
    addDayToTaskInPlan,
    removeDayFromPlan,
    saveSummaryAdjustmentsInPlan,
    updateRoomNotesInPlan
};
