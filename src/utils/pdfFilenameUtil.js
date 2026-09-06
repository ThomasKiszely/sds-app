function makePdfFilename(type, customerName) {
    const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // Fjern ulovlige tegn fra kundenavn
    const safeCustomer = customerName
        .replace(/[^a-zA-Z0-9æøåÆØÅ ]/g, "")
        .trim();

    return `SDS-${type} - ${safeCustomer} - ${date}.pdf`;
}

module.exports = { makePdfFilename };
