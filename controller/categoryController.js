import Category from "../model/categoryModel.js";
import Product from "../model/productModel.js";

export const addCategory = async (req, res) => {

    const shopId = req.user.shopId
    const { categoryName } = req.body;

    try {
        if (!categoryName) {
            return res.status(400).json({ message: "Category Name Required" })
        }
        const exitstinCategory = await Category.findOne({
            categoryName,
            shopId
        });


        if (exitstinCategory) {
            return res.status(409).json({ message: "Category Already Exists" });
        }

        const newCategory = new Category({
            categoryName,
            shopId
        });

        await newCategory.save();

        return res.status(201).json({
            message: "Category Added Successfully",
            data: newCategory
        });

    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message, stack: error.stack });

    }
}

export const getCategoriesWithoutPagination = async (req, res) => {
    try {

        const shopId = req.user.shopId;

        const categories = await Category
            .find({ shopId })
            .select("_id categoryName");

        return res.status(200).json({ categories });

    } catch (error) {

        return res.status(500).json({
            message: "Server ",
            stack: error.stack,
        });
    }
};

export const bulkDeleteCategories = async (req, res) => {
    try {
        const { ids } = req.body


        if (!ids || ids.length === 0) {
            return res.status(400).json({ message: "no category selected" })
        }
        const productExists = await Product.findOne({
            category: { $in: ids }
        })

        if (productExists) {
            return res.status(400).json({
                message: "Cannot delete category because products exist in this category"
            })
        }


        await Category.deleteMany({
            _id: { $in: ids }
        })
        return res.status(200).json({
            message: "Categories deleted successfully"
        })

    } catch (error) {
        return res.status(500).json({
            message: "Server Error"
        })

    }
}

export const getAllCategories = async (req, res) => {
    try {

        const shopId = req.user.shopId

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;

        const skip = (page - 1) * limit;

        const search = req.query.search || "";

        const query = {
            shopId: shopId,
            categoryName: { $regex: search, $options: "i" }
        }

        const categories = await Category
            .find(query)
            .skip(skip)
            .limit(limit);

        const totalCategory = await Category.countDocuments(query);

        return res.status(200).json({
            categories,
            currentPage: page,
            totalPages: Math.ceil(totalCategory / limit)
        });

    } catch (error) {
        return res.status(500).json({
            message: "Server Error"
        });
    }
};

// export const getProductsByCategory = async (req, res) => {

//     try {

//         const { categoryId } = req.params;
//         const userId = req.user.sub;

//         const products = await Product.find({
//             category: categoryId,
//             userId
//         }).populate("category");

//         if (products.length === 0) {
//             return res.status(404).json({
//                 message: "No products found for this category"
//             });
//         }

//         return res.status(200).json(products);

//     } catch (error) {
//         return res.status(500).json({
//             message: "Server Error"
//         });
//     }
// };

export const deleteCategory = async (req, res) => {

    try {
        const shopId = req.user.shopId;

        const { id } = req.params;

        const category = await Category.findOne({
            _id: id,
            shopId
        });

        if (!category) {
            return res.status(404).json({
                message: "Category Not Found"
            });
        }


        const existingProduct = await Product.findOne({
            category: id,
        });

        if (existingProduct) {
            return res.status(400).json({
                message: "Cannot delete category. Products exist under this category."
            });
        }


        await Category.findByIdAndDelete(id);

        return res.status(200).json({
            message: "Category Deleted Successfully"
        });

    } catch (error) {
        return res.status(500).json({
            message: "Server Error"
        });
    }
};

export const updateCategory = async (req, res) => {
    try {

        const shopId = req.user.shopId
        const { id } = req.params;
        const { categoryName } = req.body;

        const existingCategory = await Category.findOne({
            categoryName,
            shopId,
            _id: { $ne: id }
        });

        if (existingCategory) {
            return res.status(409).json({
                message: "Category Already Exists"
            });
        }

        const updatedCategory = await Category.findOneAndUpdate(
            { _id: id, shopId },
            { categoryName },
            { new: true }
        );

        if (!updatedCategory) {
            return res.status(404).json({
                message: "Category Not Found"
            });
        }

        return res.status(200).json({
            message: "Category Updated Successfully",
            data: updatedCategory
        });

    } catch (error) {
        return res.status(500).json({
            message: "Server Error"
        });
    }
};


export const getSingleCategory = async (req, res) => {

    try {
        const shopId = req.user.shopId
        const { id } = req.params;

        const category = await Category.findOne({
            _id: id,
            shopId
        });

        if (!category) {
            return res.status(404).json({
                message: "Category Not Found"
            });
        }

        return res.status(200).json({ message: "Category Fetched", category });

    } catch (error) {
        return res.status(500).json({
            message: "Server Error"
        });
    }
};

