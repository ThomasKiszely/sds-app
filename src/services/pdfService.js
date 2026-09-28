const ejs = require("ejs");
const path = require("path");
const fs = require("fs");
const puppeteer = require("puppeteer");
const { parseAddress } = require("../utils/addressUtil");

const logoDataUri = "data:image/png;base64," +
    fs.readFileSync(path.join(__dirname, "../../public/images/sds-logo-red.png")).toString("base64");

const DEFAULT_SENDER_ADDRESS = "Maglemølle 25, 4700 Næstved";
const DEFAULT_SENDER_PHONE = "72 41 10 01";

// Puppeteers header-/footerTemplate er rå HTML (ikke EJS), så alt der
// interpoleres ind skal escapes manuelt for at undgå HTML/script-injection
// via fx en brugers adresse- eller telefonfelt.
function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

const brandHeaderTemplate = `
    <div style="width:100%; margin:0 20mm; text-align:right;">
        <img src="${logoDataUri}" style="height:58px; width:auto; margin-top:6px;">
    </div>
`;

function buildBrandedPdfOptions({ address, phoneNumber } = {}) {
    const safeAddress = escapeHtml(address || DEFAULT_SENDER_ADDRESS);
    const safePhone = escapeHtml(phoneNumber || DEFAULT_SENDER_PHONE);

    const footerTemplate = `
        <div style="width:100%; margin:0 20mm; display:flex; align-items:center; justify-content:center; gap:8px; font-family:Calibri, Arial, sans-serif; font-size:8px; color:#333;">
            <img src="${logoDataUri}" style="height:18px; width:auto; flex:0 0 auto;">
            <div>Service Division Sjælland &middot; ${safeAddress} &middot; Tlf.: ${safePhone}</div>
        </div>
    `;

    return {
        format: "A4",
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: brandHeaderTemplate,
        footerTemplate,
        margin: { top: "32mm", bottom: "28mm", left: "20mm", right: "20mm" }
    };
}

async function generateOfferPdf(offer) {
    const templatePath = path.join(__dirname, "../views/offers/offerPdf.ejs");

    const sender = offer.snapshot?.sender;
    const senderAddress = parseAddress(sender?.address || DEFAULT_SENDER_ADDRESS);

    const html = await ejs.renderFile(templatePath, {
        offer,
        snapshot: offer.snapshot,
        senderAddress
    });

    const browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: "domcontentloaded" });

    const pdfBuffer = await page.pdf(buildBrandedPdfOptions({
        address: sender?.address,
        phoneNumber: sender?.phoneNumber
    }));

    await browser.close();
    return pdfBuffer;
}

async function generateContractPdf(snapshot, paymentTerms, paymentTermLabels) {
    const templatePath = path.join(__dirname, "../views/contracts/pdf/contractPdf.ejs");

    const html = await ejs.renderFile(templatePath, { snapshot, paymentTerms, paymentTermLabels });

    const browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox"]
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
            top: "20mm",
            bottom: "20mm",
            left: "15mm",
            right: "15mm"
        }
    });

    await browser.close();
    return pdfBuffer;
}

async function generatePlanPdf(data) {
    const templatePath = path.join(__dirname, "../views/plans/planPdf.ejs");

    const html = await ejs.renderFile(templatePath, data);

    const browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: "domcontentloaded" });

    const pdfBuffer = await page.pdf(buildBrandedPdfOptions({
        address: data.sender?.address,
        phoneNumber: data.sender?.phoneNumber
    }));

    await browser.close();
    return pdfBuffer;
}


module.exports = {
    generateOfferPdf,
    generateContractPdf,
    generatePlanPdf
};
