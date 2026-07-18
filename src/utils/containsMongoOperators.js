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