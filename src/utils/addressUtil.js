// utils/addressUtil.js

function normalizeAddress(addr) {
    if (!addr || typeof addr !== "string") return addr;

    addr = addr.trim();

    // Hvis der allerede er komma → gør ingenting
    if (addr.includes(",")) {
        return addr;
    }

    // Split på mellemrum
    const parts = addr.split(/\s+/);

    // Find første tal (postnummer)
    const zipIndex = parts.findIndex(p => /^\d+$/.test(p));

    // Hvis ingen postnummer → gør ingenting
    if (zipIndex === -1) {
        return addr;
    }

    // Street = alt før postnummer
    const street = parts.slice(0, zipIndex).join(" ");

    // Zip + city = alt efter street
    const zipCity = parts.slice(zipIndex).join(" ");

    // Indsæt komma
    return `${street}, ${zipCity}`;
}

function parseAddress(fullAddress) {
    if (!fullAddress || typeof fullAddress !== "string") {
        return { street: "", zip: "", city: "" };
    }

    // Først: normaliser adressen (tilføj komma hvis nødvendigt)
    fullAddress = normalizeAddress(fullAddress).trim();

    let street = "";
    let zip = "";
    let city = "";

    // Split på komma (nu er vi sikre på at der er et)
    const parts = fullAddress.split(",");
    street = parts[0].trim();

    const zipCityParts = parts[1].trim().split(/\s+/);

    // Hvis første ord er tal → zip
    if (zipCityParts.length > 0 && /^\d+$/.test(zipCityParts[0])) {
        zip = zipCityParts[0];
        city = zipCityParts.slice(1).join(" ");
    } else {
        // Ingen zip → alt er city
        city = zipCityParts.join(" ");
    }

    return { street, zip, city };
}

module.exports = { normalizeAddress, parseAddress };
