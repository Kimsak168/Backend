require("dotenv").config();
const express = require('express');
const fileUpload = require('express-fileupload');
const app = express();
const cors = require("cors");
const db = require('./models');
const requestLogger = require('./requestLogger');
const port = 3000;

const path = require('path')
const orderRoutes = require('./src/routes/order')
const authRouter = require('./src/routes/auth');
const customerRoute = require('./src/routes/customer');
const authMiddleware = require("./src/middleware/authMiddleware")
const productRoutes = require('./src/routes/product');
const paymentRoutes = require('./src/routes/payment');



app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Matches your preferred import style
const { Category, Product, Customer, Order, OrderDetail } = require('./models');
const { Model, or, col, Op } = require('sequelize');

db.sequelize
    .authenticate()
    .then(() => console.log('Connection has been established successfully.'))
    .catch(err => console.error('Unable to connect to the database:', err));
app.use(
    fileUpload({
        limits: { fileSize: 30 * 1024 * 1024 },
        createParentPath: true,
    })
);
app.use(
    "/uploads/products",
    express.static(path.join(process.cwd(), "uploads/products"))
);

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/customers" , customerRoute);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/payments", paymentRoutes);

app.use(fileUpload());

app.get('/', (req, res) => {
    res.send('You get all notifications');
});
app.post("/api/v1/categories", async (req, res) => {
    try {
        const { name, isActive } = req.body;
        // FIXED: Changed 'category' to 'Category'
        const created = await Category.create({ name, isActive });
        res.json({
            message: "Category created successfully",
            data: created
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/api/v1/categories", async (req, res) => {
    try {
        const search = req.query.search || "";
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const whereCondition = {};

        if (search) {
            whereCondition.name = {
                [Op.iLike]: `%${search}%`,
            };
        }

        const { count, rows } = await Category.findAndCountAll({
            where: whereCondition,
            include: [
                {
                    model: Product,
                    as: "products",
                },
            ],
            limit,
            offset,
            order: [["id", "DESC"]],
            distinct: true,
        });

        const totalPages = Math.ceil(count / limit);

        res.json({
            message: "You get all categories",
            data: rows,
            pagination: {
                totalItems: count,
                currentPage: page,
                totalPages,
                limit,
                prevPage: page > 1 ? page - 1 : null,
                nextPage: page < totalPages ? page + 1 : null,
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/api/v1/categories/list", async (req, res) => {
    try {
        const categories = await Category.findAll({
            order: [["id", "DESC"]],
        });

        res.json({
            message: "Category fetched successfully",
            data: categories,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put("/api/v1/categories/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { name, isActive } = req.body;

        // FIXED: Changed 'category' to 'Category'
        const updated = await Category.findByPk(id);

        if (!updated) {
            return res.status(404).json({ message: "Category not found" });
        }

        await updated.update({ name, isActive });
        res.json({
            message: "Category updated successfully",
            data: updated
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete("/api/v1/categories/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // FIXED: Changed 'category' to 'Category'
        const deleted = await Category.findByPk(id);
        if (!deleted) {
            return res.status(404).json({ message: "Category not found" });
        }

        await deleted.destroy();
        res.json({
            message: "Category deleted successfully",
            data: deleted
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- PRODUCTS ---

app.post("/api/v1/products", async (req, res) => {
    try {
        const { name, description, color, price, qty, categoryId, isActive } = req.body;
        const createProduct = await Product.create({
            name, description, color, price, qty, categoryId, isActive
        });

        res.status(201).json({
            message: "Product created successfully",
            data: createProduct
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to create product",
            error: error.message
        });
    }
});
app.put("/api/v1/products/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const { name, description, color, price, qty } = req.body;

        // product is defined here
        const product = await Product.findByPk(id);

        if (!product) {
            return res.status(404).json({
                message: "Product Not Found"
            });
        }

        await product.update({ name, description, color, price, qty });

        // This is safe because it's inside the 'try' and AFTER finding the product
        return res.json({
            message: "Update successfully",
            data: product
        });

    } catch (error) {
        console.log("Error ", error);
        // IMPORTANT: Only use 'error', NOT 'product' here.
        return res.status(500).json({
            message: "Internal Server Error",
            details: error.message
        });
    }
});
app.delete("/api/v1/products/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const { name, description, color, price, qty } = req.body;
        const deleteProduct = await Product.findByPk(id);

        if (!deleteProduct) {
            return res.status(404).json({
                message: "Product Not Delete"
            });
        }

        await deleteProduct.destroy();

        // This is safe because it's inside the 'try' and AFTER finding the product
        return res.json({
            message: "Delete successfully",
            data: deleteProduct
        });

    } catch (error) {
        console.log("Error ", error);
        return res.status(500).json({
            message: "Internal Server Error",
            details: error.message
        });
    }
});

app.post("/api/v1/orders", async (req, res) => {
    try {
        const { items, discount } = req.body;
        // const customer = await Customer.findByPk(customerId);
        // if (!customer) {
        //     return res.status(404).json({ message: "Customer not found" });
        // }
        const OrderDetailData = [];
        let total = 0;

        for (const item of items) {
            const { productId, qty } = item;
            const product = await Product.findByPk(productId);

            if (!product) {
                return res.status(404).json({
                    message: `Product with ID ${productId} not found`,
                });
            }

            const amount = product.price * qty;
            total += amount;

            OrderDetailData.push({
                productId,
                productName: product.name,
                productPrice: product.price,
                qty,
                amount,
            });
        }
        const orderNumber = generateInvoiceNumber();
        const createdOrder = await Order.create({
            customerId: 0,
            orderNumber: orderNumber,
            total: total - (discount || 0),
            discount: discount || 0,
            orderDate: new Date(),
            location: "N/A"
        });
        const orderDetailRecords = OrderDetailData.map(item => ({
            ...item,
            orderId: createdOrder.id
        }));

        await OrderDetail.bulkCreate(orderDetailRecords);
        const completedOrder = await Order.findByPk(createdOrder.id, {
            include: [
                // { model: Customer, as: "Customer" },
                { model: OrderDetail, as: "OrderDetails" }
            ]
        });

        return res.status(201).json({
            message: "Order created successfully",
            data: completedOrder
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
});
function generateInvoiceNumber() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");

    return `INV-${year}${month}${day}-${hours}${minutes}`;
}


app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
