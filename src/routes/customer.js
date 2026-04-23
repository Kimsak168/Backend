const express = require("express");
const router = express.Router();
const { Customer } = require("../../models");
const { route } = require("./auth");

router.get("/",  async (req, res) => {
    try {
        const customers = await Customer.findAll();

        res.json({
            messages: "customer add successfully",
            data : customers
        })
    } catch (error) {
        console.log("Error", error)
        res.json({
            messages : "Customer Not found"
        })
    }
})
router.put("/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const { firstName , lastName } = req.body;


        const customer = await Customer.findByPk(id)
        if (!customer) {
            res.json({
                messages : "Update Customer Successfully"
            })
        }
        await customer.update({
            firstName,
            lastName
        });


        res.json({
            messages: "Update successfully",
            data : customer
        })
    } catch (error) {
        console.log("Error ", error)
        res.json({
            messages:" Update Customer successfully"
        })
    }
})
router.delete("/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const deleteCustomer = await Customer.findByPk(id)
        if (!deleteCustomer) {
            messages : "Delete product Error"
        }
        await deleteCustomer.destroy();

        res.status(201).json({
            messages: "Delete customer successfully",
            data : deleteCustomer
        })

    } catch (error) {
        console.log("error", error);
        res.json({
            messages: "Delete customer Error"
        })
    }
})

module.exports = router;