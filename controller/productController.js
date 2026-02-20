import Product from "../model/productModel.js";

export const addProduct = async (req, res) => {
    const userId = req.user.sub;
    const { productName, originalPrice, productPrice, category } = req.body;
    try {
        if (!productName || !originalPrice || !productPrice || !category) {
            return res.status(400).json({ message: "Product Name And Product Price Are Required" })
        }
        const exitstinProduct = await Product.findOne({
            productName
        });

        if (exitstinProduct) {
            return res.status(409).json({ message: "Product Already Exists" });
        }

        const newProduct = new Product({
            productName,
            originalPrice,
            productPrice,
            category,
            userId
        });

        await newProduct.save();

        return res.status(201).json({
            message: "Product Added Successfully",
            data: newProduct
        });

    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message, stack: error.stack });

    }
}

export const getAllProducts = async (req, res) => {
    try {

        const userId = req.user.sub;

        const products = await Product
            .find()
            .populate("category");

        return res.status(200).json(products);

    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};


export const getSingleProduct = async (req, res) => {
    try {

        const { id } = req.params;
        const userId = req.user.sub;

        const product = await Product.findOne({
            _id: id,
            userId
        }).populate("category");

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        return res.status(200).json(product);

    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};

export const getProductsByCategory = async (req, res) => {
    try {

        const { categoryId } = req.params;

        const products = await Product.find({
            category: categoryId,
        }).populate("category");

        if (products.length === 0) {
            return res.status(404).json({
                message: "No products found for this category"
            });
        }

        return res.status(200).json({ message: "Product Fetched successfully", products });

    } catch (error) {
        return res.status(500).json({
            message: "Server error"
        });
    }
};


export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.sub;

        const { productName, originalPrice, productPrice, category } = req.body;

        const updateFields = {};

        if (productName) updateFields.productName = productName;
        if (originalPrice) updateFields.originalPrice = originalPrice;
        if (productPrice) updateFields.productPrice = productPrice;
        if (category) updateFields.category = category;


        if (productName) {
            const existingProduct = await Product.findOne({
                productName,
                userId,
                _id: { $ne: id }
            });

            if (existingProduct) {
                return res.status(409).json({
                    message: "Product already exists"
                });
            }
        }

        const updatedProduct = await Product.findOneAndUpdate(
            { _id: id, userId },
            { $set: updateFields },
            { new: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        return res.status(200).json({
            message: "Product updated successfully",
            data: updatedProduct
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Server error"
        });
    }
};



export const deleteProduct = async (req, res) => {
    try {

        const { id } = req.params;
        const userId = req.user.sub;

        const deletedProduct = await Product.findOneAndDelete({
            _id: id,
            userId
        });

        if (!deletedProduct) {
            return res.status(404).json({ message: "Product not found" });
        }

        return res.status(200).json({
            message: "Product deleted successfully"
        });

    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};
