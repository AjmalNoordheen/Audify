
const User = require('../model/user_model')
const bcrypt = require('bcrypt')
const couponSchema = require('../model/couponSchema')
const orderschema = require('../model/order_model')
let message

const admin_login = async (req, res, next) => {
  try {
    res.render('login', { message })
    message = null
  } catch (error) {
    next()
  }
}



// Admin Verification


const verify_admin = async (req, res, next) => {
  try {

    const adminMail = req.body.email
    const adminPassword = req.body.password

    const userData = await User.findOne({ email: adminMail })
    if (userData) {

      const passwordMatch = await bcrypt.compare(adminPassword, userData.password)
      if (passwordMatch) {

        if (userData.is_admin === 0) {
          message = 'not an Admin'
          res.redirect('/admin/login')
        } else {
          req.session.admin_id = userData._id
          res.redirect('/admin/homepage')
        }
      } else {
        message = 'email or Password is Incorrect'
        res.redirect('/admin/login')


      }
    } else {
      message = 'Email or Password is incorrect'
      res.redirect('/admin/login')
    }

  } catch (error) {
    next()
  }
}


// =========Dash bord=========
const loginDashbord = async (req, res, next) => {
  try {
    const adminData = await User.findOne({ is_admin: 1 });
    const userData = await User.find({ is_admin: 0 })
    const usersLength = userData.length
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);

    const yearAgo = new Date(today);
    yearAgo.setFullYear(today.getFullYear() - 1);

    const dailySalesReport = await orderschema.aggregate([
      {
        $match: {
          "order.status": "OrderDelivered",
          "order.deliveredDate": { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
        },
      },
      { $unwind: "$order" },
      {
        $match: {
          "order.status": "OrderDelivered",
          "order.deliveredDate": { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$order.deliveredDate" } },
          totalSales: { $sum: "$grandTotal" },
          totalItemsSold: { $sum: "$order.quantity" },
        },
      },
      { $sort: { _id: 1 } },
    ]);



    const weeklySalesReport = await orderschema.aggregate([
      {
        $match: {
          "order.status": "OrderDelivered",
          "order.deliveredDate": { $gte: weekAgo, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
        },
      },
      { $unwind: "$order" },
      {
        $match: {
          "order.status": "OrderDelivered",
          "order.deliveredDate": { $gte: weekAgo, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$order.deliveredDate" } },
          totalSales: { $sum: "$grandTotal" },
          totalItemsSold: { $sum: "$order.quantity" },
        },
      },
      { $sort: { _id: 1 } },
    ]);


    const yearlySalesReport = await orderschema.aggregate([
      {
        $match: {
          "order.status": "OrderDelivered",
          "order.deliveredDate": { $gte: yearAgo, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
        },
      },
      { $unwind: "$order" },
      {
        $match: {
          "order.status": "OrderDelivered",
          "order.deliveredDate": { $gte: yearAgo, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$order.deliveredDate" } },
          totalSales: { $sum: "$grandTotal" },
          totalItemsSold: { $sum: "$order.quantity" },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    ////////////////////////////////// linechart//////////////////////////////////////////////////////

    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const monthlyStart = new Date(currentYear, currentMonth, 1).toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const monthlyEnd = new Date(currentYear, currentMonth, daysInMonth);
    const monthlySalesData = await orderschema.find({
      'order.deliveredDate': {
        $gte: monthlyStart,
        $lte: monthlyEnd,
      },
    });

    const dailySalesDetails = []
    for (let i = 2; i <= daysInMonth + 1; i++) {
      const date = new Date(currentYear, currentMonth, i)
      const salesOfDay = monthlySalesData.filter((orders) => {
        return new Date(orders.order[0].deliveredDate).toDateString() === date.toDateString()
      })
      const totalSalesOfDay = salesOfDay.reduce((total, order) => {
        return total + order.grandTotal;
      }, 0);
      let productCountOfDay = 0;
      salesOfDay.forEach((order) => {
        productCountOfDay += order.order[0].quantity;
      });



      dailySalesDetails.push({ date: date, totalSales: totalSalesOfDay, totalItemsSold: productCountOfDay });
    }


    const order = await orderschema.aggregate([
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: null,
          codCount: {
            $sum: {
              $cond: { if: { $eq: ["$_id", "cod"] }, then: "$count", else: 0 }
            }
          },
          razorpayCount: {
            $sum: {
              $cond: { if: { $eq: ["$_id", "razorpay"] }, then: "$count", else: 0 }
            }
          },
          // walletCount: {
          //   $sum: {
          //     $cond: { if: { $eq: [ "$_id", "wallet" ] }, then: "$count", else: 0 }
          //   }
          // }
        }
      },
      {
        $project: {
          _id: 0,
          codCount: 1,
          razorpayCount: 1
          //, walletCount: 1
        }
      }
    ]);

    res.render("homepage", {
      dailySalesReport,
      weeklySalesReport,
      yearlySalesReport,
      message,
      usersLength,
      dailySalesDetails,
      order
    }),
      (message = null);

  } catch (error) {
    next()
  }
}





// LOGOUT Admin

const logout = async (req, res, next) => {

  try {
    req.session.admin_id = null
    res.redirect('/admin')
  } catch (error) {
    next()
  }

}

//====Load UsersList Page======

const usersList = async (req, res, next) => {
  try {
    const users = await User.find({ is_admin: 0 })
    console.log(users);

    res.render('UsersList', { userDetails: users })
  } catch (error) {
    next()
  }
}

// Block or Unblock User
// ================================
const block_unblock = async (req, res, next) => {
  try {
    userId = req.query.id
    const userData = await User.findById({ _id: userId })
    if (userData.is_blocked == 0) {
      await User.updateOne({ _id: userId }, { $set: { is_blocked: 1 } })
      res.redirect('/admin/usersList')
    } else {
      await User.updateOne({ _id: userId }, { $set: { is_blocked: 0 } })
      res.redirect('/admin/usersList')
    }

  } catch (error) {
    next()
  }
}

// ======create Coupon Page ========

const createCoupon = async (req, res, next) => {
  try {

    const couponDetails = await couponSchema.find({})
    res.render('createCoupon', { couponDetails, message })
    message = null

  } catch (error) {
    next()
  }
}


// =====Add coupon======
const validateCoupon = async (req, res, next) => {
  try {
    const { couponId, expiryDate, minAmount, maxAmount, discount, maxdiscount, couponName } = req.body
    const couponDetails = await couponSchema.findOne({ couponId: couponId })
    const DuplicateName = await couponSchema.findOne({ couponName: couponName })
    if (couponDetails || DuplicateName) {
      message: 'coupon alreday exists with this Name or Code'
      res.redirect('/admin/coupons/create')
    } else {


      const couponData = new couponSchema({
        couponName: couponName,
        couponId: couponId,
        expiryDate: expiryDate,
        maxAmount: maxAmount,
        minAmount: minAmount,
        discount: discount,
        max_discount: maxdiscount,
        status: 'Active'
      })
      const details = await couponData.save()

      res.redirect('/admin/coupons/create')
    }


  } catch (error) {
    next()
  }
}

// ====Delete Coupon======

const deleteCoupon = async (req, res, next) => {
  try {
    const couponId = req.query.id
    await couponSchema.deleteOne({ _id: couponId })
    res.redirect('/admin/coupons/create')
  } catch (error) {
    next()
  }
}

// ========USer Orders page=========

const userOrder = async (req, res, next) => {
  try {
    let currentPage = 1
    if (req.query.currentpage) {
      currentPage = req.query.currentpage
    }
    const limit = 7
    offset = (currentPage - 1) * limit
    const orderdetails = await orderschema.find({})
    const orderData = await orderschema.find({}).sort({ _id: -1 }).skip(offset).limit(limit)
    const totalOrders = orderdetails.length
    const totalPage = Math.ceil(totalOrders / limit)
    console.log(offset, totalOrders, totalPage, orderData.length, orderData);

    res.render("orderList", { orderData, currentPage, totalPage })

  } catch (error) {
    next()
    res.status(500).send("Server Error");
  }
}
// ========OrderView Page=========

const orderView = async (req, res, next) => {
  try {
    const orderId = req.query.id
    const orderData = await orderschema.findOne({ _id: orderId }).populate('order.product')
    res.render("ordersView", { orderData })

  } catch (error) {
    next()
    res.status(500).send("Server Error");
  }
}


const deliverOrder = async (req, res, next) => {
  try {

    const id = req.query.id
    const Data = await orderschema.findOne({ _id: id })
    const deliverdOrder = new Date() + 7
    const ids = Data.order.map((value) => {
      return value._id
    })

    ids.forEach(async (element) => {
      console.log('success')
      await orderschema.updateOne({ _id: id, 'order._id': element }, { $set: { 'order.$.status': 'OrderDelivered', 'order.$.deliveredDate': deliverdOrder } })
    })
    const data = Data.order.map((value) => {
      return value.status

    })

    const responseData = {
      success: true,
      status: "OrderDelivered"
    };
    res.json(responseData);
  }

  catch (error) {
    next()
  }
}


const ordershipped = async (req, res, next) => {
  try {

    const id = req.query.id
    const Data = await orderschema.findOne({ _id: id })
    const ids = Data.order.map((value) => {
      return value._id
    })

    ids.forEach(async (element) => {
      await orderschema.updateOne({ _id: id, 'order._id': element }, { $set: { 'order.$.status': 'OrderShipped' } })
    })
    const data = Data.order.map((value) => {
      return value.status

    })

    const responseData = {
      success: true,
      status: "OrderShipped"
    };
    res.json(responseData)

  }

  catch (error) {
    next()
  }
}

// =======Sales Report========

const loadSales = async (req, res) => {
  try {

    const filterData = await orderschema.find({ order: { $elemMatch: { status: "OrderDelivered" } } }).populate('order.product')
    res.render("salesReport", { filterData })
  } catch (error) {
    next()
    res.status(500).send("Server Error");
  }
}

const sales = async (req, res) => {
  try {
    const { first, last } = req.body;
    const filterData = await orderschema.find({
      'order.status': "OrderDelivered",
      'order.date': { $gte: first, $lte: last }
    }).populate('order.product')
    res.render("salesReport", { filterData });

  } catch (error) {
    next()
    res.status(500).send("Server Error");
  }
}




module.exports = {
  admin_login,
  verify_admin,
  loginDashbord,
  logout,
  usersList,
  block_unblock,
  createCoupon,
  validateCoupon,
  deleteCoupon, userOrder,
  orderView, deliverOrder,
  ordershipped, loadSales, sales
}