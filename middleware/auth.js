const isLoginSession=async (req,res,next)=>{
    try {
        if(req.session.user_id){
            next()
        }
       
        else{
            res.redirect('/login')
        }
       
    } catch (error) {
        console.log(error.message)
    }
}


const isLogoutSession=async (req,res,next)=>{
   try {
    if(req.session.user_id){
        res.redirect('/homepage')
    }else{
        next()
    }
    
   } catch (error) {
    console.log(error.message)
   }
}

const userschema = require('../model/user_model')

 const is_blocked = async(req,res,next)=>{
    try{
        const id = req.session.user_id
        const userdetails = await userschema.findOne({_id:id})
        if(userdetails){
            if(userdetails.is_blocked==1){
                res.redirect('/logout')
            }
            else{
                next()
            }
        }
        else{
            next()
        }
    }
    catch(error){
        console.log(error)
    }
 }

module.exports={
    isLoginSession,
    isLogoutSession,
    is_blocked
}
