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

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10)
    return passwordHash
  } catch (error) {

  }
}



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


// -------------------------------------------
// Load user Registration page..

const user_register = async (req, res, next) => {
  try {
    res.render('registration', { message })
    message = null
  } catch (error) {
    next()
  }
}
// --------------------------------------

// User Registration

const insertUser = async (req, res, next) => {
  try {
    const existEmail = req.body.email
    const emailData = await user.findOne({ email: existEmail })

    if (req.body.name == "" && req.body.email == "" && req.body.mobile == "" && req.body.password == "") {
      message = 'Please fill All the fields'
      res.redirect('/register')
      return false;
    } else if (req.body.name == "") {
      message = 'Name field Empty'
      res.redirect('/register')
      return false;
    } else if (req.body.email == "") {
      message = 'Please enter Your Email'
      res.redirect('/register')
      return false;
    } else if (req.body.mobile == "") {
      message = 'Please enter Your Mobile Number'
      res.redirect('/register')
      return false;
    } else if (req.body.password == "") {
      message = 'Please Enter Password'
      res.redirect('/register')
      return false;
    } else if (req.body.mobile.length != 10) {
      message = "Invalid mobile NUmber"
      res.redirect('/register')
      return false;
    } else if (req.body.password.length < 8) {
      message = 'Password Must Contain 8 characters'
      res.redirect('/register')
      return false;
    } else if (emailData) {
      message = 'Email Already Exist'
      res.redirect('/register')
      return false;
    } else {


      const spassword = await securePassword(req.body.password)
      const User = new user({
        name: req.body.name,
        email: req.body.email,
        mobile: req.body.mobile,
        password: spassword,
        is_admin: 0

      })
      console.log(User)
      const userData = await User.save()



      if (userData) {

        sendVerifyMail(req.body.name, req.body.email, userData._id)
        message = 'your registration Succesfully finished, Please Verify Your E-mail'
        console.log('registration succesful')
        res.redirect('/login')
        return true;
      } else {
        res.render('registration', { message: 'Registration Failed' })
        return false;
      }

    }
  } catch (error) {
    next()
  }
}

// ---------------------------------------------------------------------

// For verify mail 

const verifyMail = async (req, res, next) => {
  try {
    const updateInfo = await user.updateOne({ _id: req.query.id }, { $set: { is_verified: 1 } })
    res.render('email-verified')

  } catch (error) {
    next()
  }
}

// --------------------------------------------------------------------

// user login method

const loginLoad = async (req, res, next) => {
  try {

    res.render('login', { message })
    message = null

  } catch (error) {
    next()
  }
}

// -------------------------------------------------------------------------

// User Login Verification Method

const verifyLogin = async (req, res, next) => {

  try {
    const userEmail = req.body.email
    const userPassword = req.body.password

    const userData = await user.findOne({ email: userEmail })

    if (userData) {
      const passwordMatch = await bcrypt.compare(userPassword, userData.password)
      if (passwordMatch) {
        if (userData.is_verified === 0) {

          message = "Please Verify your Email"
          res.redirect('/login')

        } else if (userData.is_blocked === 1) {
          message = "Blocked User cant be Login"
          res.redirect('/login')
        } else {
          req.session.user_id = userData._id
          res.redirect('/homepage')
        }
      } else {

        message = 'Email and password is inCorrect'
        res.redirect('/login')
      }
    } else {

      message = 'Email and password is inCorrect'
      res.redirect('/login')
    }

  } catch (error) {
    next()
  }

}

// -------------------------------------------------------------

// For HomePage

const loadHome = async (req, res, next) => {
  try {
    const userId = req.query.id
    const bannerData = await banner.find()
    const productData = await product.find()
    const categories = await category.find()
    const session = req.session.user_id
    const userdetails = await user.findOne({ _id: userId })

    res.render('samplehome', { session, productData, categories, userdetails, bannerData })
  } catch (error) {
    next()
  }
}

// --------------------------------------------------------------

// LogOut From Homepage

const logOut = (req, res, next) => {
  try {
    req.session.user_id = null
    res.redirect('/')
  } catch (error) {
    next()
  }
}



// =========Full Details of single product============

const singleView = async (req, res, next) => {
  try {
    const session = req.session.user_id
    const product_id = req.query.id
    let singleProduct = await product.findOne({ _id: product_id }).populate('category')
    const products = await product.find()
    let categories = await category.find()
    message = null
    res.render('singleProduct', { singleProduct, categories, message, mess, session ,products})
  } catch (error) {
    next()
  }
}

// ========render cart page=========

const cartPage = async (req, res, next) => {
  try {
    const userId = req.session.user_id
    if (userId) {

      const is_cart = await user.findOne({ _id: userId })


      const cartdetails = await user.findOne({ _id: userId }).populate('cart.products')
      res.render('cart', { cartdetails, message, session: userId })
      message = null



    } else {
      message = 'please Login and continue...'
      res.redirect('/login')
    }

  } catch (error) {
    next()
  }
}


// ========Cart Function=========
const reloadcart = async (req, res, next) => {
  try {
    productId = req.query.id
    const userid = req.session.user_id
    const categories = category.find()
    if (!userid) {
      message = 'please login and continue... '
      res.redirect('/login')
      return false
    } else {

      const cartId = await user.findOne({ _id: userid, 'cart.products': productId })
      const stockCheck = await product.findOne({ _id: productId })

      if (stockCheck.quantity > 0) {
        if (cartId) {
          const count = await user.updateOne({ _id: userid, 'cart.products': productId }, { $inc: { 'cart.$.quantity': 1 } })
          const productData = await product.findOne({ _id: productId })
          const incrementOne = await user.findOne({ _id: userid, 'cart.products': productId })
          let productDetails = incrementOne.cart.filter((value) => {
            return value.products == productId
          }, 0)
          const totalFind = productDetails[0].quantity * productData.price
          const total = await user.updateOne({ _id: userid, 'cart.products': productId }, { $set: { 'cart.$.totalprice': totalFind } })
          const itemData2 = await user.findOne({ _id: userid, 'cart.products': productId })
          const grandTotal = itemData2.cart.map((k) => {
            return k.totalprice
          }).reduce((a, b) => {
            return a = a + b
          })
          itemData2.cart.forEach(async (element) => {
            const updatedGrandTotal = await user.updateOne({ _id: userid, 'cart.products': element.products }, { $set: { 'cart.$.grandTotal': grandTotal } })

          })
          res.redirect('/cart')
          return true
        } else {
          const incrementOne = await user.findOne({ _id: userid })
          const productData = await product.findOne({ _id: productId })

          await user.updateOne({ _id: userid }, {
            $push: {
              cart: {
                products: productData._id,
                quantity: 1,
                totalprice: productData.price,
                grandTotal: productData.price
              }
            }
          })
          const cartDetails = await user.findOne({ _id: userid })
          const grandTotal = cartDetails.cart.map((value) => {
            return value.totalprice
          }).reduce((first, otherTotals) => {
            return first = first + otherTotals
          })
          cartDetails.cart.forEach(async (value) => {
            await user.updateOne({ _id: userid, 'cart.products': value.products }, { $set: { 'cart.$.grandTotal': grandTotal } })
          })
        }
        const productData = await product.findOne({ _id: productId })
        mess = 'succesfully added to Cart'
        // res.render('singleProduct',{singleProduct:productData,categories,message,mess,session:userid})
        res.redirect('/cart')
        message = null
        mess = null

      } else {
        message = 'Sorry,Out of Stock!!!'
        res.redirect('/shop')
      }
    }
  } catch (error) {
    next()
  }
}

// ========Increment======
const increment = async (req, res, next) => {
  try {
    const id = req.body.id;
    const user_id = req.session.user_id;

    const count = await user.updateOne(
      { _id: user_id, "cart.products": id },
      { $inc: { "cart.$.quantity": 1 } }
    );
    const productData = await product.findOne({ _id: id });
    const incrementOne = await user.findOne({
      _id: user_id,
      "cart.products": id,
    });
    let productDetails = incrementOne.cart.filter((value) => {
      return value.products == id;
    });
    const totalFind = productDetails[0].quantity * productData.price;
    const total = await user.updateOne(
      { _id: user_id, "cart.products": id },
      { $set: { "cart.$.totalprice": totalFind } }
    );
    const itemData2 = await user.findOne({
      _id: user_id,
      "cart.products": id,
    });
    const grandTotal = itemData2.cart
      .map((k) => {
        return k.totalprice;
      })
      .reduce((a, b) => {
        return (a = a + b);
      });
    itemData2.cart.forEach(async (element) => {
      const updatedGrandTotal = await user.updateOne(
        { _id: user_id, "cart.products": element.products },
        { $set: { "cart.$.grandTotal": grandTotal } }
      );
    });


    const productData1 = await product.findOne({ _id: id })
    const cartData = await user.findOne({ _id: user_id, 'cart.products': id })
    const cartData2 = cartData.cart.filter((value) => {
      return value.products == id
    })
    const totalFind1 = cartData2[0].quantity * productData1.price
    const total1 = await user.updateOne({ _id: user_id, 'cart.products': id }, { $set: { 'cart.$.totalprice': totalFind1 } })
    const setOne1 = await user.findOne({ _id: user_id, 'cart.products': id })
    const findTotal = setOne1.cart.map((value) => {
      return value.totalprice
    }).reduce((a, b) => {
      return a = a + b
    })
    const quantity = setOne1.cart.filter((value) => {
      return value.products == id
    })

    const x = quantity[0].quantity

    res.json({ cartData2, totalFind, findTotal, id, x });
  } catch (error) {
    next()
  }
};

//==========Decrement function=======

const decrement = async (req, res, next) => {
  try {
    const id = req.body.id;
    const user_id = req.session.user_id;
    const count = await user.updateOne(
      { _id: user_id, "cart.products": id },
      { $inc: { "cart.$.quantity": -1 } }
    );
    const productData = await product.findOne({ _id: id });
    const incrementOne = await user.findOne({
      _id: user_id,
      "cart.products": id,
    });
    let productDetails = incrementOne.cart.filter((value) => {
      return value.products == id;
    });
    const totalFind = productDetails[0].quantity * productData.price;
    const total = await user.updateOne(
      { _id: user_id, "cart.products": id },
      { $set: { "cart.$.totalprice": totalFind } }
    );
    const itemData2 = await user.findOne({
      _id: user_id,
      "cart.products": id,
    });
    const grandTotal = itemData2.cart
      .map((k) => {
        return k.totalprice;
      })
      .reduce((a, b) => {
        return (a = a + b);
      });
    itemData2.cart.forEach(async (element) => {
      const updatedGrandTotal = await user.updateOne(
        { _id: user_id, "cart.products": element.products },
        { $set: { "cart.$.grandTotal": grandTotal } }
      );
    });


    const productData1 = await product.findOne({ _id: id })
    const cartData = await user.findOne({ _id: user_id, 'cart.products': id })
    const cartData2 = cartData.cart.filter((value) => {
      return value.products == id
    })
    const totalFind1 = cartData2[0].quantity * productData1.price
    const total1 = await user.updateOne({ _id: user_id, 'cart.products': id }, { $set: { 'cart.$.totalprice': totalFind1 } })
    const setOne1 = await user.findOne({ _id: user_id, 'cart.products': id })
    const findTotal = setOne1.cart.map((value) => {
      return value.totalprice
    }).reduce((a, b) => {
      return a = a + b
    })
    const quantity = setOne1.cart.filter((value) => {
      return value.products == id
    })
    const y = quantity[0].quantity
    res.json({ cartData2, totalFind, findTotal, id, y });
  } catch (error) {
    next()
  }
};
// =======Delete Items in Cart========


const deleteCart = async (req, res, next) => {
  try {
    const productId = req.query.id;
    console.log(productId + '========')
    const userId = req.session.user_id
    const cartData = await user.findOne({ _id: userId }).populate('cart.products')
    const grand = cartData.cart[0].products.price * cartData.cart[0].quantity
    const grandTot = cartData.cart[0].grandTotal - grand

    await user.updateOne({ _id: userId, 'cart.products': productId }, { $set: { 'cart.$.grandTotal': grandTot } })
    if (userId) {
      const responseData = {
        grandTotal: grandTot,
        success: true,
        message: "product removed from the cart"
      };
      res.json({ responseData });
      await user.updateOne(
        { _id: userId },
        { $pull: { cart: { products: productId } } }
      );

      const cartData = await user.findOne({ _id: userId })
      const grandTotal = cartData.cart.map((value) => {
        return value.totalprice
      }).reduce((firstTotal, otherTotals) => {
        return firstTotal = firstTotal + otherTotals
      })
      cartData.cart.forEach(async (value) => {
        await user.updateOne({ _id: userId, 'cart.products': value.products }, { $set: { 'cart.$.grandTotal': grandTotal } })
      })
    } else {
      mes = "please Login for continue";
      res.redirect("/login");
    }
  } catch (error) {
    next()
  }
}

// ======Whish List========

const loadWhishlist = async (req, res, next) => {
  try {
    const userId = req.session.user_id
    if (userId) {
      const userShema = await user.findOne({ _id: userId }).populate('whishList.product')
      res.render('whishlist', { userShema, message, session: userId, mess })
      message = null
      mess = null
    } else {
      message = 'please login for continue....'
      res.redirect('/login')
    }
  } catch (error) {
    next()
  }
}
// =====Add to Whishlist=======
const addToWhishlist = async (req, res, next) => {
  try {
    const productId = req.query.id
    const userSession = req.session.user_id

    if (userSession) {
      const productSchema = await product.findOne({ _id: productId })
      const searchProduct = await user.findOne({ _id: userSession, 'whishList.product': productId })
      if (!searchProduct) {
        await user.updateOne({ _id: userSession }, {
          $push: {
            whishList: {
              product: productSchema._id
            }
          }
        })
        mess = 'sucessfully added to whishlist'
        res.redirect('/whishlist')

      } else {
        message = 'product already in the whishList'
        res.redirect('/whishList')
        console.log('wrong')
      }
    } else {
      message = 'please Login for continue'
      res.redirect('/login')
    }

  } catch (error) {
    next()
  }
}


// ======Delete from Wish List=======

const deleteWishlist = async (req, res, next) => {
  try {
    const productId = req.query.id;
    const session = req.session.user_id;

    if (session) {
      await user.updateOne(
        { _id: session },
        { $pull: { whishList: { product: productId } } }
      );
      const responseData = {
        success: true,
        message: 'removed sucssesfully'
      };
      res.json(responseData);
    } else {
      message = "please Login for continue";
      res.redirect("/login");
    }
  } catch (error) {
    next()
  }
};





// =======Render Shop Page=======

const renderShop = async (req, res, next) => {
  try {
    const session = req.session.user_id
    const products = await product.find({})
    const CategoryList = await category.find()
    res.render('shop', { session, products, message, CategoryList })
    message = null
  } catch (error) {
    next()
  }
}

// ======pagination =========

const pagination = async (req, res, next) => {
  try {
    const pageIndex = req.query.page;
    const limit = 1;
    const skip = (pageIndex - 1) * limit;
    const sort = parseInt(req.query.sort);

    let products_data;

    if (sort) {
      products_data = await product.find().sort({ price: sort }).skip(skip).limit(limit);
    } else {
      products_data = await product.find().skip(skip).limit(limit);
    }

    res.json(products_data);
  } catch (error) {
    next()
    res.status(500).send('Server Error');
  }
}
// =======Filter Cateory======

const categoryfilter = async (req, res, next) => {
  try {
    let productData;
    let products = [];
    let Categorys;
    let Data = [];

    const { categorys, search, sort } = req.body;
    const sortOption = sort === "priceHighToLow" ? { price: -1 } : { price: 1 };
    const query = {
      is_flagged: 0,
    };
    if (search) {
      console.log(1213243534);
      query.$or = [
        { brand: { $regex: ".*" + search + ".*", $options: "i" } },
        { name: { $regex: ".*" + search + ".*", $options: "i" } },
      ];
    }
    // if (filterprice && filterprice.length > 0) {
    //   if (filterprice.length == 2) {
    //     query.price = {
    //       $gte: Number(filterprice[0]),
    //       $lte: Number(filterprice[1]),
    //     };
    //   } else {
    //     query.price = { $gte: Number(filterprice[0]) };
    //   }
    // }
    if (categorys && categorys.length > 0) {
      query.category = { $in: categorys };
    }
    const totalCount = await product.countDocuments(query);
    productData = await product
      .find(query)
      .populate("category")
      .sort(sortOption);
    // Categorys = categorys.filter((value) => {
    //   return value !== null;
    // });
    console.log(totalCount);
    if (Categorys) {
      Categorys.forEach((element, i) => {
        products[i] = productData.filter((value) => {
          return value.category == element;
        });
      });
      products.forEach((value, i) => {
        Data[i] = value.filter((v) => {
          return v;
        });
      });
    } else {
      Data[0] = productData;
    }
    console.log(Data);
    res.json({ Data });
  } catch (error) {
    console.log(error.message);
    next(error.message);
  }
};

module.exports = {
  user_register, insertUser, loginLoad,
  verifyMail, verifyLogin, loadHome, logOut, reloadcart,
  cartPage, singleView, increment, decrement, loadWhishlist,
  addToWhishlist, deleteWishlist, deleteCart,
  renderShop, pagination, categoryfilter

}