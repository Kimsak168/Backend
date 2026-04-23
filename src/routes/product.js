const express = require('express');
const router = express.Router();
const path = require('path');
const { v4: uuidv4 } = require("uuid");
const { ProductImage, Product, Category } = require("../../models");
const fs = require('fs')
const { Op } = require("sequelize");

router.get("/", async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        let whereCondition = {};
        if (req.query.search) {
            whereCondition.name = {
                [Op.iLike]: `%${req.query.search}%`,
            };
        }

        if (req.query.categoryId) {
            whereCondition.categoryId = {
                [Op.eq]: req.query.categoryId,
            }
        }

        const offset = (page - 1) * limit;
        const { rows: products, count: total } = await Product.findAndCountAll({
            where: whereCondition,
            limit,
            offset,
            include: [
                {
                    model: Category,
                    as: "category",
                    attributes: ["id", "name"]
                },
                {
                    model: ProductImage,
                    as: "productImage",
                    attributes: ["id", "productId", "imageUrl", "fileName"]
                }
            ],
        });
        const totalPages = Math.ceil(total / limit);

        res.json({
            message: "Product fetched successfully",
            data: products,
            pagination: {
                currentPage: page,
                limit,
                total,
                nextPage: page < totalPages ? page + 1 : null,
                prevPage: page > 1 ? page - 1 : null,
            },
        });
    } catch (error) {
        console.log("Creating product error:", error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
});
router.post('/:id/upload', async (req, res) => {
    try {

        const { file } = req.files;
        const productId = req.params.id;
        const product = await Product.findByPk(productId)

        if (!product) {
            res.json({
                message: `Product id=${productId} not Found`
            })
        }
        const fileName = `${uuidv4()}${path.extname(file.name)}`;
        const uploadPath = path.join(process.cwd(), "uploads/products", fileName);
        await file.mv(uploadPath);

        const domain = `${req.protocol}://${req.get("host")}`;
        const imageUrl = `${domain}/uploads/products/${fileName}`;

        const saveImage = await ProductImage.create({
            productId,
            imageUrl,
            fileName: file.name
        })
        res.json({
            message: "Product image uploaded successfully",
            data: saveImage
        });
    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Ensure the path matches the structure: /api/v1/products/:id/image/:imageId/download
// Note the colons (:) before id and imageId
router.get('/:id/image/:imageId/download', async (req, res) => {
    try {
        const { imageId } = req.params;
        const image = await ProductImage.findByPk(imageId);

        // 1. If record isn't in DB, stop and return 404
        if (!image) {
            return res.status(404).json({
                message: `ProductImage id=${imageId} Not found`
            });
        }

        // 2. Logic for converting saved URL to local file path
        const urlParts = image.imageUrl.split('/');
        const fileName = urlParts.pop();
        // We assume files are in 'uploads/products/' relative to your project root
        const filePath = path.join(process.cwd(), 'uploads', 'products', fileName);

        // 3. Fix the logic check: If it does NOT exist, return error
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                message: "Physical file not found on the server"
            });
        }

        // 4. Send the file. No res.json() after this!
        return res.download(filePath, image.fileName);

    } catch (error) {
        console.error('Download Error: ', error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
router.delete("/images/:imageId", async (req, res) => {
    const { imageId } = req.params;

    const image = await ProductImage.findOne({
        where: {
            id: imageId
        }
    })

    if (!image) {
        return res.status(404).json({
            message: `Product Image id=${imageId} not found`
        })
    }

    // remove image from folder uploads
    const fileName = image.imageUrl.split("/").pop()

    const filePath = path.join(process.cwd(), "uploads/products", fileName)

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
    }

    // remove data from db
    await image.destroy()

    return res.json({
        message: "Product Image deleted successfully"
    })

});

module.exports = router;