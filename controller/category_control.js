const Category = require('../model/category_model')
const productSchema = require('../model/product_model')
let message
let mess

// ======Render Add Category Page=========

const categoryload = async (req, res, next) => {
    try {
        const categoryList = await Category.find()
        res.render('add-category', { message, mess, categoryList })
        message = null
        mess = null
    } catch (error) {
        next()
    }
}


//=============Verify Add Categories ===========

const addcategory = async (req, res, next) => {
    try {
        const repeatCategory = await Category.findOne({ name: req.body.category })
        if (repeatCategory) {
            mess = 'Category already Exists'
            res.redirect('/admin/category/add')
        } else {
            const newCategory = new Category({
                name: req.body.category
            })

            const categoryData = newCategory.save()
            if (categoryData) {
                message = 'Succefully Added Category'
                res.redirect('/admin/category/add')
            }
        }

    } catch (error) {
        next()
    }
}

// ========Delete category==========

const deleteCategory = async (req, res, next) => {
    try {
        const category_Id = req.query.id
        console.log(category_Id)
        const productData = await productSchema.findOne({ category: category_Id })
        if (productData) {
            mess = "cant delete category because product already exists"
            res.redirect('/admin/category/add')
        } else {
            await Category.deleteOne({ _id: category_Id })
            message = 'Succesfully Deleted'
            res.redirect('/admin/category/add')
        }
    } catch (error) {
        next()
    }
}

// // Error 500 Page renderin:-

// const serverError = async(req,res)=>{
//     try {
//         res.render('500Error')
//     } catch (error) {
//         console.log(error)
//     }
// }

module.exports = {
    categoryload,
    addcategory,
    deleteCategory,

}