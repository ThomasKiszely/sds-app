//Obs bliver ikke brugt pt. Kun til fx queries e.l.

function containsMongoOperators(obj) {
    const forbidden = ["$gt", "$lt", "$ne", "$in", "$nin", "$where", "$regex"];

    const check = (value) => {
        if (typeof value === "object" && value !== null) {
            for (const key in value) {
                if (forbidden.includes(key)) return true;
                if (check(value[key])) return true;
            }
        }
        return false;
    };

    return check(obj);
}

module.exports = {
    containsMongoOperators
};