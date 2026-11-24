// Undgå at søgeord bliver fortolket som regex-syntaks (ReDoS / uventede matches)
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
module.exports = {
    escapeRegExp,
}