const user = require('../model/user_model')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const product = require('../model/product_model')
const category = require('../model/category_model')
const session = require('express-session')
const { db } = require('../model/user_model')
const couponSchema = require('../model/couponSchema')
const banner = require('../model/banner_model')
const orderschema = require('../model/order_model')
const Razorpay = require('razorpay')

const instance = new Razorpay({
  key_id: "rzp_test_11rW0kKCpHkgkC",
  key_secret: "OtVJ0In2eNGw7AD8UThg52m6",
});



let message
let mess
let is_show
// =====CheckOut Page==========

const CheckOut = async (req, res, next) => {
  try {

    const user_id = req.session.user_id
    const addressId = req.query.id
    const order = req.session.order
    is_show = 1

    const coupon = await couponSchema.find({ ref: '1' })
    const cartDetails = await user.findOne({ _id: user_id }).populate('cart.products')
    const userDetails = await user.findOne({ _id: user_id })


    let addressDetails
    if (!req.query.check) {
      addressDetails = userDetails.address.filter((value) => {
        return value._id == addressId
      })
    } else {
      addressDetails = userDetails.address.filter((value) => {
        return value._id == addressId
      })
    }

    res.render("checkout", { cartDetails, session: user_id, addressDetails, userDetails, is_show, coupon, order })

  } catch (error) {
    next()
  }
}
// =======Place Order==========
const placeorder = async (req, res, next) => {

  try {
    const id = req.session.user_id
    const userSchema = await user.findOne({ _id: id })
    let total = userSchema.discountedTotal
    const grand = req.query.grand
    if (total === null || total == 0) {
      total = grand
    }
    userSchema.discountedTotal = 0
    await userSchema.save()

    const userid = req.session.user_id
    const orderDate = new Date()
    const orderArrivingDate = new Date()
    orderArrivingDate.setDate(orderDate.getDate() + 7)


    const payment = req.body
    const { name, house, mobile, email, town, district, state, pincode } = req.body
    if (payment.placeorder == 'cod') {
      const cartdata = await user.findOne({ _id: userid }).populate('cart.products')
      const orderitem = cartdata.cart.map((value) => {
        return {
          product: value.products._id, price: value.products
            .price, quantity: value.quantity, date: orderDate, totalPrice: value.totalprice, arrivingDate: orderArrivingDate
        }
      })
      const grandtotal = cartdata.cart.map((value) => {
        return value.totalprice
      }).reduce((a, b) => {
        return a = a + b
      })

      const order = orderschema({
        user: userid,
        order: orderitem,
        subTotal: grand,
        grandTotal: total,
        address: [{
          name: name,
          houseName: house,
          mobileNo: mobile,
          email: email,
          townCity: town,
          district: district,
          state: state,
          pincode: pincode
        }],
        paymentMethod: req.body.placeorder,

      })


      const saveorder = await order.save()
      const orderid = await orderschema.findOne({ _id: saveorder._id }).populate('order.product')
      cartdata.cart = []
      const Ucart = await cartdata.save()
      orderitem.forEach(async (element) => {
        const products = await product.findById({ _id: element.product })
        const inventoryUpdate = await product.updateOne({ _id: element.product }, { $set: { quantity: Number(products.quantity) - Number(element.quantity) } })
      })
      res.redirect(`/orderSuccess?id=${orderid._id}`)


    } else if (payment.placeorder == 'razorpay') {
      const cartData = await user.findOne({ _id: userid }).populate('cart.products')
      const orderItem = cartData.cart.map((value) => {
        return {
          product: value.products._id,
          price: value.products.price,
          quantity: value.quantity,
          totalprice: value.totalprice,
          date: orderDate,
          arrivingDate: orderArrivingDate
        }
      })
      const grandTot = cartData.cart.map((value) => {
        return value.total
      }).reduce((a, b) => {
        return a = a + b
      })

      // create a Razorpay order
      const options = {
        amount: total * 100, // amount in paisa (multiply by 100)
        currency: "INR", // currency code
        receipt: "order_" + orderDate.getTime(), // unique order ID
      }
      const order = await instance.orders.create(options)
      req.session.order = order
      req.session.orderDatas = {
        amount: total * 100,
        currency: "INR",
        orderId: order.id,
        address: {
          name: name,
          house: house,
          mobileNo: mobile,
          email: email,
          townCity: town,
          district: district,
          state: state,
          pincode: pincode
        },
        order: orderItem,
        grandTotal: total,
        subTotal: grandTot,
        paymentMethod: req.body.placeorder
      };

      res.redirect("/checkout?orderId=" + order.id)


    } else {
      res.redirect("/checkout")
    }
  } catch (error) {
    next()
    res.status(500).send("Server Error");
  }
}

const razorpay = async (req, res) => {
  const orderDatas = req.session.orderDatas
  const userId = req.session.user_id
  const order = new orderschema({
    user: userId,
    order: orderDatas.order,
    paymentId: orderDatas.orderId,
    grandTotal: orderDatas.grandTotal,
    subTotal: orderDatas.subTotal,
    address: [orderDatas.address],
    paymentMethod: orderDatas.paymentMethod,

  });
  const save = await order.save();
  const orderData = await orderschema.findOne({ _id: save._id }).populate('order.product')
  const cartData = await user.findOne({ _id: userId }).populate('cart.products')
  cartData.cart = [];
  const Ucart = await cartData.save()

  orderData.order.forEach(async (element) => {
    const products = await product.findOne({ _id: element.product._id })
    const inventoryUpdate = await product.updateOne({ _id: element.product._id }, { $set: { quantity: Number(products.quantity) - Number(element.quantity) } })
  })

  res.json({ orderData })


}

const orderSuccess = async (req, res, next) => {
  try {
    req.session.order = null
    const orderId = req.query.id
    const orderid = await orderschema.findOne({ _id: orderId }).populate("order.product")
    res.render("ordersucess", { orderid, session: req.session.user_id })


  } catch (error) {
    next()
    res.status(500).send("Server Error");
  }
}

// =======Orders Listed Page========

const myOrders = async (req, res, next) => {
  try {
    const userId = req.session.user_id
    const User = await user.findById({ _id: userId })
    const orderDatas = await orderschema.find({ user: User._id }).sort({ _id: -1 }).populate('order.product')
    res.render("myOrders", { orderDatas, session: userId })


  } catch (error) {
    next()
    res.status(500).send("Server Error");
  }
}


// ======for Single view of the order======
const orderView = async (req, res, next) => {
  try {
    const session = req.session.user_id
    orderId = req.query.id
    orderData = await orderschema.findById({ _id: orderId }).populate('order.product')
    const price = orderData.order[0].product.price
    const quantity = orderData.order[0].quantity
    total = price * quantity
    res.render("orderView", { orderData, session, total })

  } catch (error) {
    next()
    res.status(500).send("Server Error");
  }
}


// =======Cancel Order=====

const cancelOrder = async (req, res, next) => {
  try {

    const id = req.query.id
    const Data = await orderschema.findOne({ _id: id })
    const ids = Data.order.map((value) => {
      return value._id
    })

    ids.forEach(async (element) => {
      await orderschema.updateOne({ _id: id, 'order._id': element }, { $set: { 'order.$.status': 'OrderCancelled' } })
    })

    const cancelProduct = await orderschema.findOne({})
    const data = Data.order.map((value) => {
      return value.status

    })

    const responseData = {
      success: true,
      status: "OrderCancelled"
    };
    res.json(responseData);
  }

  catch (error) {
    next()
  }
}


// ========Return Order==========

const returnOrder = async (req, res, next) => {
  try {
    const id = req.query.id
    const Data = await orderschema.findOne({ _id: id })
    const ids = Data.order.map((value) => {
      return value._id
    })

    ids.forEach(async (element) => {
      await orderschema.updateOne({ _id: id, 'order._id': element }, { $set: { 'order.$.status': 'OrderReturned' } })
    })


    const data = Data.order.map((value) => {
      return value.status

    })

    const responseData = {
      success: true,
      status: "OrderReturned"
    };
    res.json(responseData)

  } catch (error) {
    next()
    res.status(500).send("Server Error");
  }
}




// =====coupon=====
const useCoupon = async (req, res, next) => {
  try {
    const couponId = req.body.couponId;
    const subTotal = req.body.subtotal;
    const couponData = await couponSchema.findOne({ couponId: couponId });
    const userid = req.session.user_id;

    if (couponData) {
      const min = couponData.minAmount;
      const max = couponData.maxAmount;
      const Avg = (min + max) / 2;
      let discount = couponData.discount;
      const maxDiscount = couponData.max_discount;
      let discountSubtotal;
      let messa;

      const checkUser = await couponSchema.findOne({ ref: userid, couponId: couponId });
      if (checkUser) {
        let wrong = 1;
        discountSubtotal = subTotal;
        discount = (discount - discount);
        messa = 'already used';
        res.status(200).send({ messa, wrong, discountSubtotal, discount });
      } else {
        const couponDate = new Date(couponData.expiryDate)
        // // console.log(couponDate,new Date())
        const currentDate = new Date()


        if (currentDate < couponDate) {
          if (min <= subTotal) {
            if (subTotal <= Avg) {
              discountSubtotal = (subTotal * (1 - (couponData.discount) / 100)).toFixed(0);
              let userSchema = await user.findByIdAndUpdate(userid, { discountedTotal: discountSubtotal });
              messa = 'added';
              res.status(200).send({ discountSubtotal, discount, messa });
            } else {
              discountSubtotal = (subTotal * (1 - (couponData.max_discount) / 100)).toFixed(0);
              let userSchema = await user.findByIdAndUpdate(userid, { discountedTotal: discountSubtotal });
              messa = 'added';
              res.status(200).send({ discountSubtotal, maxDiscount, messa });
            }
          } else {
            messa = 'Min Amount for this coupon is ' + couponData.minAmount;
            discountSubtotal = subTotal;
            discount = "0"
            res.status(200).send({ messa, discountSubtotal, discount });
          }
        } else {
          const updateCoupon = await couponSchema.updateOne({ couponId: couponId }, { $set: { status: 'Expired' } })
          console.log(updateCoupon);
          messa = 'Coupon Expired';
          discountSubtotal = subTotal;
          discount = '0'
          res.status(200).send({ messa, discountSubtotal, discount });
        }
      }
      const usedCoupon = await couponSchema.findOneAndUpdate({ couponId: couponId }, { $set: { ref: userid } });
    } else {
      // Handle case when couponData is null
      console.log('Coupon data not found');
      res.status(404).send({ message: 'Coupon not found' });
    }
  } catch (error) {
    next()
    res.status(500).send({ message: 'Internal server error' });
  }
};

//   =========User Profile Page Rendering=======

const userProfile = async (req, res, next) => {
  try {
    const session = req.session.user_id
    if (session) {
      const userData = await user.findOne({ _id: session })
      is_show = 0
      res.render('userProfile', { session, user: userData, message })
      message = null
    } else {
      message = 'please Login for continue'
      res.redirect('/login')
    }

  } catch (error) {
    next()
  }
}
//------------------------------------------------------------------------------------------- 
// Function for sending Mail

const sendVerifyMail = async (name, email, user_id) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: 'ajmalnoordheenkn@gmail.com',
        pass: 'bsqzklfptirmwseo'
      }

    })

    const mailOptions = {
      from: 'ajmalnoordheenkn@gmail.com',
      to: email,
      subject: 'For Verificatoin Mail',
      html: '<p>Hii' + name + ',Please Click Here to <a href="http://localhost:5000/verify?id=' + user_id + '">Verify </a> Your mail </p>'

    }
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error.message)
      } else {
        console.log('Email has been Sent', info.response)
      }

    })

  } catch (error) {
    console.log(error.message)
  }
}


// ===== Edit User  profile========

const editProfile = async (req, res, next) => {
  try {
    const userid = req.session.user_id
    const { name, emails, phone } = req.body
    const emailData = await user.findOne({ email: emails })
    const updateProfile = await user.findByIdAndUpdate({ _id: userid }, { $set: { name: name, mobile: phone } })


    if (emails) {
      if (emailData) {
        message = 'email already exists'
        res.redirect('/profile')
        return true
      } else {
        const userData = await user.findOne({ _id: userid })
        res.redirect('/register')
        sendVerifyMail(req.body.name, req.body.email, userData._id)
        await user.findByIdAndUpdate({ _id: userid }, { $set: { email: emails, is_verified: 0 } })
        message = 'please verify your mail and login for continue'
        // res.redirect('/logout')

      }
    }
    res.redirect('/profile')
  } catch (error) {
    next()
  }
}
// -------------------------------------------------------------------------------------------------
// For verify mail 

const verifyMail = async (req, res, next) => {
  try {
    const updateInfo = await user.updateOne({ _id: req.query.id }, { $set: { is_verified: 1 } })
    res.render('email-verified')

  } catch (error) {
    next()
  }
}
// ===========================================================================================================

// ========User Address Page=========

const userAddress = async (req, res, next) => {
  try {


    const userid = req.session.user_id
    const User = await user.findOne({ _id: userid })
    res.render('address', { user: User, session: userid, message, is_show })
    message = null
  } catch (error) {
    next()
  }
}

// ===========Rendering Add Address Form=======
const addAddressPage = async (req, res, next) => {
  try {
    const session = req.session.user_id
    const User = await user.findOne({ _id: session })
    res.render('addAdress', { session, user: User, message })
    message = null
  } catch (error) {
    next()
  }
}
// ==========Add User Address=======
const fillAddress = async (req, res, next) => {
  try {
    const user_id = req.session.user_id
    const User = await user.findOne({ _id: user_id })
    const { name, house, towncity, district, state, pincode, mobile, email } = req.body
    if (user_id) {
      const addressDetails = await user.updateOne({ _id: user_id }, {
        $push: {
          address: {
            name: name,
            houseName: house,
            townCity: towncity,
            district: district,
            state: state,
            pincode: pincode,
            mobileNo: mobile,
            email: email
          }
        }
      })
    }
    message = 'succesfully added'
    res.redirect('/userAddress')

  } catch (error) {
    next()
  }
}

// =========Delete Address=====

const deleteAddress = async (req, res, next) => {
  try {
    const addressId = req.query.id
    const userId = req.session.user_id
    await user.updateOne({ _id: userId }, { $pull: { address: { _id: addressId } } })
    message = 'removed from the List'
    res.redirect('/userAddress')
  } catch (error) {
    next()
  }
}

// =======Render Edit Address Page======

const editAddressPage = async (req, res, next) => {
  try {
    const userId = req.session.user_id
    const addressId = req.query.id
    const index = req.query.index
    const User = await user.findOne({ _id: userId, 'address._id': addressId })
    const editaddress = User.address[index]
    res.render('editAddress', { user: User, session: userId, message, editaddress })


    message = null

  } catch (error) {
    next()
  }
}

// ========Edit Address=======

const editAddress = async (req, res, next) => {
  try {
    const addressId = req.query.id
    userId = req.session.user_id

    const { name, house, towncity, district, state, pincode, mobile, email } = req.body
    const updateAddress = await user.findOneAndUpdate({ _id: userId, 'address._id': addressId }, {
      $set: {
        'address.$': {
          name: name,
          houseName: house,
          townCity: towncity,
          district: district,
          state: state,
          pincode: pincode,
          mobileNo: mobile,
          email: email
        }
      }
    },
      { new: true })

    message = 'succesfully Updated'
    res.redirect('/userAddress')
  } catch (error) {
    next()
  }
}

module.exports = {
  placeorder, razorpay, orderSuccess,
  CheckOut, myOrders, orderView, cancelOrder,
  returnOrder, useCoupon, userProfile,
  userAddress, addAddressPage, fillAddress, deleteAddress, editAddressPage,
  editAddress, editProfile, verifyMail
}