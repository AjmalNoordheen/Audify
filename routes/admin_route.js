const express = require('express')
const admin_route = express()
const config = require('../config/config')
const body_parser = require('body-parser')
require('dotenv').config();
const serverError = require('../routes/500')

// ===============================================
const multer = require('multer')
const path=require('path')

const storage = multer.diskStorage({
  destination:function (req,file,cb){
    cb(null,path.join(__dirname,'../public/images/temp'))
  },
  filename:function(req,file,cb){
    cb(null,Date.now()+''+file.originalname)
  }
})

const upload = multer({storage:storage})

// ====================================================


admin_route.use(body_parser.json())
admin_route.use(body_parser.urlencoded({extended:true}))


const session=require('express-session')
admin_route.use(session({
    secret:process.env.sessionSecret,
    resave: false,
    saveUninitialized: true
  }));


const admin_controller=require('../controller/admin_control')
const admin_auth=require('../middleware/adminAuth')
const productController=require('../controller/product_controller')
const categoryControl=require('../controller/category_control')
const bannerController = require('../controller/banner_controller')

admin_route.set('view engine','ejs')
admin_route.set('views','./views/admin')

admin_route.get('/',admin_auth.isLogout,admin_controller.admin_login,serverError.errorServer)
admin_route.post('/',admin_controller.verify_admin,serverError.errorServer)
admin_route.get('/homepage',admin_auth.isLOgin,admin_controller.loginDashbord,serverError.errorServer)
admin_route.get('/logout',admin_controller.logout,serverError.errorServer)

admin_route.get('/product/add',admin_auth.isLOgin,productController.addproducts,serverError.errorServer)
admin_route.post('/product/add',upload.array('images',4),productController.verifyAdd,serverError.errorServer)
admin_route.route('/category/add').get(admin_auth.isLOgin,categoryControl.categoryload).post(categoryControl.addcategory,serverError.errorServer)
admin_route.get('/productList',admin_auth.isLOgin,productController.productList,serverError.errorServer)
admin_route.get('/userslist',admin_auth.isLOgin,admin_controller.usersList,serverError.errorServer)
admin_route.route('/editProduct').get(admin_auth.isLOgin,productController.loadEdit).post(upload.array('images',4),productController.editProducts,serverError.errorServer)
admin_route.get('/block_user',admin_controller.block_unblock,serverError.errorServer)
admin_route.get('/flagProduct',admin_auth.isLOgin,productController.flag,serverError.errorServer)
admin_route.get('/category/delete',admin_auth.isLOgin,categoryControl.deleteCategory,serverError.errorServer)
admin_route.get('/banner',admin_auth.isLOgin,bannerController.bannerPage,serverError.errorServer)
admin_route.post('/banner',upload.array('images',4),bannerController.addBanner,serverError.errorServer)
admin_route.get('/image/delete',admin_auth.isLOgin,productController.deleteImage,serverError.errorServer)
admin_route.get('/coupons/create',admin_auth.isLOgin,admin_controller.createCoupon,serverError.errorServer)
admin_route.post('/addcoupon',admin_controller.validateCoupon,serverError.errorServer)
admin_route.get('/delete/coupon',admin_auth.isLOgin,admin_controller.deleteCoupon,serverError.errorServer)
admin_route.get('/orders',admin_auth.isLOgin,admin_controller.userOrder,serverError.errorServer)
admin_route.get('/orderViews',admin_auth.isLOgin,admin_controller.orderView,serverError.errorServer)
admin_route.post('/deliverorder',admin_controller.deliverOrder,serverError.errorServer)
admin_route.post('/ordershipped',admin_controller.ordershipped,serverError.errorServer)
admin_route.get('/sales',admin_auth.isLOgin,admin_controller.loadSales,serverError.errorServer)
admin_route.post('/sales',admin_controller.sales,serverError.errorServer)
admin_route.get('/deleteBanner',admin_auth.isLOgin,bannerController.deleteBanner,serverError.errorServer)

admin_route.get('*',function(req,res){
    res.redirect('/admin')
})



module.exports=admin_route