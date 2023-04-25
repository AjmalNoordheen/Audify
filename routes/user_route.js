const express=require('express')
const user_route=express()
const session=require('express-session')
const config=require('../config/config')
const product_controller = require('../controller/product_controller')
const orderController = require('../controller/orderController')
require('dotenv').config();
const serverError = require('../routes/500')

user_route.use(session({
    secret: process.env.sessionSecret,
    resave: false,
    saveUninitialized: true
  }));
  

const auth=require('../middleware/auth')
const user_control=require('../controller/user_control')
const otpverify=require('../controller/otpVerification')

user_route.set('view engine','ejs')
user_route.set('views','./views/users')

user_route.get('/register',auth.isLogoutSession, user_control.user_register)
user_route.post('/register',user_control.insertUser)

user_route.get('/verify',user_control.verifyMail)

user_route.get('/login',auth.isLogoutSession, user_control.loginLoad)
// user_route.get('/login',auth.isLogoutSession, user_control.loginLoad)
user_route.post('/login',user_control.verifyLogin)

user_route.get('/',auth.is_blocked,user_control.loadHome)
user_route.get('/homepage',auth.is_blocked,user_control.loadHome)
user_route.get('/logout',auth.isLoginSession,user_control.logOut)

//========For Otp========

user_route.get('/otp',auth.isLogoutSession,otpverify.otplogin)
user_route.post('/otp',otpverify.otpPage)
user_route.post('/otpPage',otpverify.verifyotp)
user_route.post('/resendOtp',otpverify.resendOTP)
// ====Product Routes=======
user_route.get('/singleView',auth.is_blocked,user_control.singleView,serverError.errorServer)

user_route.get('/cart',auth.isLoginSession,auth.is_blocked,user_control.cartPage,serverError.errorServer)
user_route.get('/carter',auth.isLoginSession,auth.is_blocked,user_control.reloadcart,serverError.errorServer)
user_route.post('/cart',user_control.reloadcart,serverError.errorServer)

user_route.post('/increment',user_control.increment,serverError.errorServer)
user_route.post('/decrement',user_control.decrement,serverError.errorServer)
user_route.post('/cart/delete',user_control.deleteCart,serverError.errorServer)

user_route.get('/whishlist',auth.isLoginSession,auth.is_blocked,user_control.loadWhishlist,serverError.errorServer)
user_route.get('/addtoWhishlist',auth.isLoginSession,auth.is_blocked,user_control.addToWhishlist,serverError.errorServer)
user_route.get('/wishlist/delete',auth.isLoginSession,user_control.deleteWishlist,serverError.errorServer)
user_route.get('/checkout',auth.isLoginSession,auth.is_blocked,orderController.CheckOut,serverError.errorServer)


//////////---USER PROFILe---////
user_route.get('/profile',auth.is_blocked,auth.isLoginSession,orderController.userProfile,serverError.errorServer)
user_route.post('/editprofile',orderController.editProfile,serverError.errorServer)
user_route.get('/verify',auth.isLoginSession,auth.is_blocked,orderController.verifyMail,serverError.errorServer)

// =====User Addresss======
user_route.get('/userAddress',auth.isLoginSession,auth.is_blocked,orderController.userAddress,serverError.errorServer)
user_route.get('/addAddress',auth.isLoginSession,auth.is_blocked,orderController.addAddressPage,serverError.errorServer)
user_route.post('/addAddress',orderController.fillAddress,serverError.errorServer)
user_route.get('/deleteAddress',auth.is_blocked,orderController.deleteAddress,serverError.errorServer)
user_route.get('/editAddress',auth.is_blocked,orderController.editAddressPage,serverError.errorServer )
user_route.post('/editAddress',orderController.editAddress,serverError.errorServer)

// ======Ordres====
user_route.post('/ordersuccess',orderController.placeorder,serverError.errorServer)
user_route.get('/orders',auth.is_blocked,orderController.myOrders,serverError.errorServer)
user_route.get("/razorpay",auth.is_blocked,orderController.razorpay,serverError.errorServer)
user_route.get("/orderSuccess",auth.is_blocked,orderController.orderSuccess,serverError.errorServer)
user_route.get('/orderView',auth.isLoginSession,auth.is_blocked,orderController.orderView,serverError.errorServer)
user_route.post('/cancelOrder',orderController.cancelOrder,serverError.errorServer)


user_route.post('/coupon',auth.is_blocked,orderController.useCoupon,serverError.errorServer)
user_route.get('/shop',auth.is_blocked,user_control.renderShop,serverError.errorServer)
user_route.post('/returnOrder',orderController.returnOrder,serverError.errorServer)
// ===pagination===
user_route.post('/pagination',user_control.pagination)
user_route.post('/categoryfilter',user_control.categoryfilter)
module.exports=user_route