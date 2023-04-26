const product = require('../model/product_model')
const Category = require('../model/category_model')
const userSchema = require('../model/user_model')
const sharp = require('sharp')
const fs = require('fs')
let message
let images = []
let mess
// For render Addproduct Page

const addproducts = async (req, res, next) => {
    try {
        const listCategories = await Category.find()
        res.render('addproduct', { message, listCategories, mess })
        message = null
        mess = null
    } catch (error) {
        next()
    }
}


//========  Verifying for Adding Products ==========

const verifyAdd = async (req, res, next) => {
    try {
        const verifyName = await product.findOne({ name: req.body.name })
        if (verifyName) {
            mess = 'Product Already Exists'
            res.redirect('/admin/product/add')
        } else if (req.body.name === "" || req.body.category == "" || req.body.price == "" || req.body.quantity == "" || req.body.description == "" || req.body.brand == "" || !req.files || req.files.length < 4) {
            mess = "Please Fill all the Feilds and upload 4 photos"
            res.redirect('/admin/product/add')
        } else {
            const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']//valid image extensions
            for (let i = 0; i < req.files.length; i++) {
                const extension = req.files[i].filename.split('.').pop().toLowerCase() //Get the File Extention
                if (validExtensions.includes(extension)) {
                    //check if the file extions is valid
                    let image = req.files.map((file) => file);
                    for (i = 0; i < req.files.length; i++) {
                      let path = image[i].path;
                      const processImage = new Promise((resolve, reject) => {
                        sharp(path)
                        .rotate()
                        .resize(500, 500)
                        .toFile("public/images/" + image[i].filename, (err) => {
                          sharp.cache(false);
                          if (err) {
                            console.log(err);
                            reject(err);
                          } else {
                            resolve();
                          }
                        });
                    });
                    processImage
                      .then(() => {
                        fs.unlink(path, (err) => {
                          if (err) {
                            console.log(err);
                          } else {
                            console.log(`Deleted file: ${path}`);
                          }
                        });
                      })
                        .catch((err) => {
                          console.log(err);
                        });
                
                    }                 
                }

            }
       
                const category = await Category.findOne({ name: req.body.category })

                const newproduct = new product({
                    name: req.body.name,
                    model: req.body.model,
                    category: category._id,
                    quantity: req.body.quantity,
                    price: req.body.price,
                    description: req.body.description,
                    brand: req.body.brand,
                    images:req.files.map((file) => file.filename)                })

                const productData = await newproduct.save()
                if (productData) {
                    message = "Product Added SuccesFully *"
                    res.redirect('/admin/product/add')
                }
            }
        
    } catch (error) {
        console.log(error);
    }

}

// ======List Products===========

const productList = async (req, res, next) => {
    try {
        const productlist = await product.find().populate('category')
        res.render('productList', { productData: productlist })
    } catch (error) {
        next()
    }
}

// ===========Displaying Product Editing Page======

const loadEdit = async (req, res, next) => {
    try {
        const productId = req.query.id
        const productdata = await product.findOne({ _id: productId }).populate('category')
        const category = await Category.find({})
        res.render('edit_product', { product: productdata, message, categories: category })
        message = null
    } catch (error) {
        next()
    }
}


// =========Edit Productz==========
const editProducts = async (req, res, next) => {
    try {

        const { name, category, price, quantity, description, brand } = req.body
        const productId = req.query.id
        const newCategory = await Category.findOne({ name: category })


        if (req.files) {
            if (req.files.length > 0) {
                let image = req.files.map((file) => file);
               
                for (i = 0; i < req.files.length; i++) {
                  let path = image[i].path;
                  const processImage = new Promise((resolve, reject) => {
                    sharp(path)
                    .rotate()
                    .resize(500, 500)
                    .toFile("public/images/" + image[i].filename, (err) => {
                      sharp.cache(false);
                      if (err) {
                        console.log(err);
                        reject(err);
                      } else {
                        console.log(`Processed file: ${path}`);
                        resolve();
                      }
                    });
                });
                processImage
                  .then(() => {
                    fs.unlink(path, (err) => {
                      if (err) {
                        console.log(err);
                      } else {
                        console.log(`Deleted file: ${path}`);
                      }
                    });
                  })
                    .catch((err) => {
                      console.log(err);
                    });
            
                }                 
            }
           
        }
        let images =req.files.map((file) => file.filename)
        
            const editedProduct = await product.findOne({ _id: productId })
            console.log('djkdhb',editedProduct,images);
        editedProduct.name = name;
        editedProduct.price = price;
        editedProduct.quantity= quantity; 
        editedProduct.brand= brand; 
        editedProduct.description= description; 
        editedProduct.category= newCategory._id;
        editedProduct.images = editedProduct.images.concat(images);
        console.log('djkdhb');
        const log =  await editedProduct.save()

        res.redirect('/admin/productList')

    } catch (error) {
        next()
    }
}


// ==========flag Products========
const flag = async (req, res, next) => {
    try {
        const Product_id = req.query.id
        const flagData = await product.findById({ _id: Product_id })

        if (flagData.is_flagged == 0) {
            const deleteInfo = await product.updateOne({ _id: Product_id }, { $set: { is_flagged: 1 } })
            res.redirect('/admin/productList')
        }
    } catch (error) {
        next()
    }
}

// =========

const deleteImage = async (req, res, next) => {
    try {

        const image_id = req.query.id
        const product_Id = req.query.product
        console.log(product_Id);
        const productdata = product.findOne({ _id: product_Id }).populate('category')
        const category = Category.find()
        await product.updateOne({ _id: product_Id }, { $pull: { images: image_id } })
        res.redirect('/admin/editProduct?id=' + product_Id);

        res.render('edit_product', { product: productdata, message, categories: category })

        console.log(productDetails)
    } catch (error) {
        next()
    }
}






// await user.updateOne(
//     { _id: UserId },
//     { $pull: { cart: { product: productId } } }
//   );


// ========

module.exports = {
    addproducts,
    verifyAdd,
    productList,
    editProducts,
    loadEdit,
    flag,
    deleteImage,



}