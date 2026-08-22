const puppeteer = require("puppeteer");
const ejs = require("ejs");
const path = require("path");
const customerService = require("./customerService");

async function generateOfferPdf(offer, tasks, signatureLink) {
    const templatePath = path.join(__dirname, "../views/offers/offerPdf.ejs");

    const customer = await customerService.getCustomerById(offer.customerId);

    const html = await ejs.renderFile(templatePath, {
        offer,
        customer,
        tasks,
        subtotal: offer.subtotalBeforeDiscount,
        discountPercent: offer.discountPercent,
        discountAmount: offer.discountAmount,
        environmentalFee: offer.environmentalFee,
        environmentalFeeAmount: offer.environmentalFeeAmount,
        total: offer.totalPrice,
        signatureLink
    });

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true
    });

    await browser.close();

    return pdfBuffer;
}


module.exports = { generateOfferPdf };
