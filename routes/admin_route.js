const express = require('express')
const admin_route = express()
const config = require('../config/config')
const body_parser = require('body-parser')
const adminControl = require('../controller/admin_control')

require('dotenv').config();

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

admin_route.get('/',admin_auth.isLogout,admin_controller.admin_login)
admin_route.post('/',admin_controller.verify_admin)
admin_route.get('/homepage',admin_auth.isLOgin,admin_controller.loginDashbord)
admin_route.get('/logout',admin_controller.logout)

admin_route.get('/product/add',admin_auth.isLOgin,productController.addproducts)
admin_route.post('/product/add',upload.array('images',4),productController.verifyAdd)
admin_route.route('/category/add').get(admin_auth.isLOgin,categoryControl.categoryload).post(categoryControl.addcategory)
admin_route.get('/productList',admin_auth.isLOgin,productController.productList)
admin_route.get('/userslist',admin_auth.isLOgin,admin_controller.usersList)
admin_route.route('/editProduct').get(admin_auth.isLOgin,productController.loadEdit).post(upload.array('images',2),productController.editProducts)
admin_route.get('/block_user',admin_controller.block_unblock)
admin_route.get('/flagProduct',admin_auth.isLOgin,productController.flag)
admin_route.get('/category/delete',admin_auth.isLOgin,categoryControl.deleteCategory)
admin_route.get('/banner',admin_auth.isLOgin,bannerController.bannerPage)
admin_route.post('/banner',upload.array('images',4),bannerController.addBanner)
admin_route.get('/image/delete',admin_auth.isLOgin,productController.deleteImage)
admin_route.get('/coupons/create',admin_auth.isLOgin,admin_controller.createCoupon)
admin_route.post('/addcoupon',admin_controller.validateCoupon)
admin_route.get('/delete/coupon',admin_auth.isLOgin,admin_controller.deleteCoupon)
admin_route.get('/orders',admin_auth.isLOgin,admin_controller.userOrder)
admin_route.get('/orderViews',admin_auth.isLOgin,admin_controller.orderView)
admin_route.post('/deliverorder',admin_controller.deliverOrder)
admin_route.post('/ordershipped',admin_controller.ordershipped)
admin_route.get('/sales',admin_auth.isLOgin,admin_controller.loadSales)
admin_route.post('/sales',admin_controller.sales)
admin_route.get('/deleteBanner',admin_auth.isLOgin,bannerController.deleteBanner)
admin_route.get('/servererror',adminControl.error500)
admin_route.get('*',function(req,res){
    res.redirect('/admin')
})



module.exports=admin_route