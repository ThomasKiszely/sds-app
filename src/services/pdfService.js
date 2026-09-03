const ejs = require("ejs");
const path = require("path");
const puppeteer = require("puppeteer");

async function generateOfferPdf(offer, tasks, customer, address, signatureLink) {
    const templatePath = path.join(__dirname, "../views/pdf/offerPdf.ejs");

    const html = await ejs.renderFile(templatePath, {
        offer,
        tasks,
        customer,
        street: address.street,
        zip: address.zip,
        city: address.city,
        signatureLink
    });

    const browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox"]
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true
    });

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

module.exports = {
    generateOfferPdf,
    generateContractPdf
};

