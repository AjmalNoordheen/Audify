const isLOgin=async (req,res,next)=>{

    try {
       
        if(req.session.admin_id)
        { next() }
        else{
            res.redirect('/admin/login')            
        }
        
    } catch (error) {
        console.log('err here');
    }
}

const isLogout=async(req,res,next)=>{
    try {
        if (req.session.admin_id) {
            res.redirect('/admin/homepage')
        }
        else next()

    } catch (error) {
        console.log('error in admin logittsdgsfd');
        
    }
}





module.exports={isLOgin,isLogout}