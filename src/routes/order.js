const express = require('express');
const { Order , OrderDetail , Customer } = require("./../../models");
const { route } = require("./auth");
const { Model } = require('sequelize');
// From src/routes/order.js to Utils/generateOrderDoc.js
const generateDoc = require('../Utils/generateOrderDoc');
const router = express.Router();


router.put("./", async(req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const id = req.params.id
        const { customerId, location, item, discount } = req.body
        const updateOrder = await Order.findByPk(id)

        if (!updateOrder) {
            await transaction.rollback();
            Message : " Order can not Update"
        }

        let total = 0;
        let updatedDetailData = [];

        for(const item of items){
            const { productId, qty } = items;
        }
    } catch (error) {
        console.log("ERROR", error)
        res.json({
            Message : "Product Error"
        })
    }
})
router.get('/:orderId/generate-docx', async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findByPk(orderId, {
    include: [
        {
            model: Customer,
            as: "Customer" // Changed 'customer' to 'Customer'
        },
        {
            model: OrderDetail,
            as: "OrderDetails"
        }
    ]
        });
        const buffer = generateDoc(order)
        // const buffer =  generateDoc(order)
        res.setHeader(
        "Content-Disposition",
        `attachment; filename=order-${order.orderNumber}.docx`,
    );
    res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );

    res.send(buffer);
    } catch (error) {
        console.log("Error", error)
        res.status(500).json({
            Message: "Server Error"
        })
    }
})
module.exports = router;