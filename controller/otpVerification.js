const User = require('../model/user_model')

//========== For Otp Login========
let message

let TWILIO_SERVICE_SID = 'VA5d2a80ca95f2fd364727f10a92cb3d38'
let authToken = '4aba6ba91b22a33521a2df6a579a93d5'
let accountSid = 'AC3edb3a3e94b50e8593d2cce73c1bd2ee'
const client = require("twilio")(accountSid, authToken);

const otplogin = async (req, res) => {
     try {

          res.render('otpLogin', { message })
          message = null
     } catch (error) {
          res.redirect('/admin/servererror')  
     }
}

//======== For Otp Number Sending=====

const otpPage = async (req, res) => {
     try {
          const number = req.body.mobile
          const findMobile = await User.findOne({ mobile: number })
          if (!findMobile) {
               message = "can't find an account with this Number "
               res.redirect('/otp')

          } else {
               req.session.number = number
               const verification = await client.verify.v2
                    .services(TWILIO_SERVICE_SID)

                    .verifications.create({ to: `+91${number}`, channel: "sms" });
               res.render('otpPage', { message: 'Otp Succefully Send ' })
               message = null
          }

     } catch (error) {
          res.redirect('/admin/servererror')  
     }
}

// ========Render otpPage======

// const otpPageLoad=async(req,res)=>{
//      try {
//           res.render('otpPage',{message})
//      } catch (error) {
//         console.log(error)  
//      }
// }
// =================Verify Otp=======

const verifyotp = async (req, res) => {
     const { otp } = req.body
     const mobile = req.session.number
     const userData = await User.findOne({ mobile: mobile })
     try {
          const verification_check = await
               client.verify.v2.services(TWILIO_SERVICE_SID)
                    .verificationChecks.create({ to: `+91${mobile}`, code: otp })
                    .then(async (verification_check) => {
                         if (verification_check.status == 'approved') {
                              req.session.user_id = userData._id
                              res.redirect('/')
                         } else {
                              message = 'Invalid Otp'
                              res.render('otpPage', { message })
                              message = null
                         }

                    }).catch((err) => {
                         res.redirect('/admin/servererror')  
                    })
     } catch (error) {
          res.redirect('/admin/servererror')  
     }
}




// Resend otp=========
const resendOTP = async (req, res) => {
     const mobile = req.session.number
     try {
          const userData = await User.findOne({ mobile: mobile })
          const verification = await client.verify.v2
               .services(TWILIO_SERVICE_SID)
               .verifications.create({ to: `+91${mobile}`, channel: "sms" })
               .then(async (verification_check) => {
                    if (verification_check.status == 'approved') {
                         req.session.user_id = userData._id
                         res.redirect('/')
                    } else {
                         message = 'Invalid Otp'
                         res.render('otpPage', { message })
                         message = null
                    }

               })
     } catch (err) {
          res.redirect('/admin/servererror')  
     }
};



module.exports = { otplogin, otpPage, verifyotp, resendOTP }