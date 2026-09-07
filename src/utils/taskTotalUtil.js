// utils/taskTotalUtil.js
function getTaskTotalPrice(taskOrPrices) {
    const monthlyPrice = Number(taskOrPrices.monthlyPrice ?? 0);
    const pricePerTime = Number(taskOrPrices.pricePerTime ?? 0);
    const customPrice = taskOrPrices.customPrice != null
        ? Number(taskOrPrices.customPrice)
        : null;

    if (monthlyPrice > 0) return monthlyPrice;
    if (pricePerTime > 0) return pricePerTime;
    if (customPrice != null && customPrice > 0) return customPrice;

    return 0;
}

module.exports = { getTaskTotalPrice };
