// utils/addressUtil.js

// Danske postnumre er præcis 4 cifre
const ZIP_PATTERN = /^\d{4}$/;

// Indsætter komma før postnummer, så "Vej 1 4700 Næstved" → "Vej 1, 4700 Næstved".
// Adresser der allerede har komma, eller som ikke har et 4-cifret postnummer, returneres uændret.
function normalizeAddress(addr) {
    if (!addr || typeof addr !== "string") return addr;

    addr = addr.trim();

    if (addr.includes(",")) {
        return addr;
    }

    const parts = addr.split(/\s+/);

    // Postnummeret er det sidste 4-cifrede ord (så husnumre som "1234" ikke forveksles)
    let zipIndex = -1;
    for (let i = parts.length - 1; i > 0; i--) {
        if (ZIP_PATTERN.test(parts[i])) {
            zipIndex = i;
            break;
        }
    }

    if (zipIndex === -1) {
        return addr;
    }

    const street = parts.slice(0, zipIndex).join(" ");
    const zipCity = parts.slice(zipIndex).join(" ");

    return `${street}, ${zipCity}`;
}

// Deler en adresse i street / zip / city. Fejler aldrig: manglende dele bliver tomme strenge.
function parseAddress(fullAddress) {
    if (!fullAddress || typeof fullAddress !== "string") {
        return { street: "", zip: "", city: "" };
    }

    const normalized = normalizeAddress(fullAddress).trim();

    const commaIndex = normalized.indexOf(",");
    if (commaIndex === -1) {
        return { street: normalized, zip: "", city: "" };
    }

    const street = normalized.slice(0, commaIndex).trim();
    const zipCityParts = normalized.slice(commaIndex + 1).trim().split(/\s+/).filter(Boolean);

    if (zipCityParts.length > 0 && ZIP_PATTERN.test(zipCityParts[0])) {
        return { street, zip: zipCityParts[0], city: zipCityParts.slice(1).join(" ") };
    }

    return { street, zip: "", city: zipCityParts.join(" ") };
}

// Kræver gade, 4-cifret postnummer og by (efter normalisering)
function hasZipAndCity(fullAddress) {
    if (!fullAddress || typeof fullAddress !== "string") return false;
    const { street, zip, city } = parseAddress(fullAddress);
    return Boolean(street && zip && city);
}

const ADDRESS_FORMAT_MESSAGE = "Adressen skal indeholde gade, postnummer (4 cifre) og by, fx 'Vejnavn 1, 4700 Næstved'";

module.exports = { normalizeAddress, parseAddress, hasZipAndCity, ADDRESS_FORMAT_MESSAGE };
