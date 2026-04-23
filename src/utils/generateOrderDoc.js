const fs = require("fs");
const path = require("path");
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const dayjs = require("dayjs");
const { disconnect } = require("cluster");




const generateDoc = (order) => {
    console.log("Order", order);

    const templatePath = path.join(
        __dirname,
        "../templates/Invoice.docx",
    );

    const content = fs.readFileSync(templatePath, "binary");
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
    });
    doc.render({
        orderNumber: order.orderNumber,
        orderDate: dayjs(order.orderDate).format("DD-MM-YYYY"),
        firstName: order.Customer.firstName,
        lastName: order.Customer.lastName,
        discount: order.discount,
        total: order.total,
        items: order.OrderDetails
    });

    const buffer = doc.getZip().generate({
        type: "nodebuffer",
        compression: "DEFLATE",
    });

    return buffer;
};
module.exports = generateDoc;