import Category from "../model/categoryModel.js";
import Product from "../model/productModel.js";

export const addCategory = async (req, res) => {

    const userId = req.user.sub
    const { categoryName } = req.body;

    try {
        if (!categoryName) {
            return res.status(400).json({ message: "Category Name Required" })
        }
        const exitstinCategory = await Category.findOne({
            categoryName
        });


        if (exitstinCategory) {
            return res.status(409).json({ message: "Category Already Exists" });
        }

        const newCategory = new Category({
            categoryName,
            userId
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

export const getAllCategories = async (req, res) => {
    try {

        const categories = await Category.find();

        return res.status(200).json(categories);

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

        const { id } = req.params;
        const userId = req.user.sub;

        const category = await Category.findOne({
            _id: id,
            userId
        });

        if (!category) {
            return res.status(404).json({
                message: "Category Not Found"
            });
        }


        const existingProduct = await Product.findOne({
            category: id,
            userId
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

        const { id } = req.params;
        const userId = req.user.sub;
        const { categoryName } = req.body;

        const existingCategory = await Category.findOne({
            categoryName,
            userId,
            _id: { $ne: id }
        });

        if (existingCategory) {
            return res.status(409).json({
                message: "Category Already Exists"
            });
        }

        const updatedCategory = await Category.findOneAndUpdate(
            { _id: id, userId },
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

        const { id } = req.params;
        const userId = req.user.sub;

        const category = await Category.findOne({
            _id: id,
            userId
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

