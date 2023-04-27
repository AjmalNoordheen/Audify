const Category = require('../model/category_model')
const productSchema = require('../model/product_model')
let message
let mess

// ======Render Add Category Page=========

const categoryload = async (req, res) => {
    try {
        const categoryList = await Category.find()
        res.render('add-category', { message, mess, categoryList })
        message = null
        mess = null
    } catch (error) {
        res.redirect('/admin/servererror')  
    }
}


//=============Verify Add Categories ===========

const addcategory = async (req, res) => {
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
        res.redirect('/admin/servererror')  
    }
}

// ========Delete category==========

const deleteCategory = async (req, res, ) => {
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
        res.redirect('/admin/servererror')  
    }
}



module.exports = {
    categoryload,
    addcategory,
    deleteCategory,

}