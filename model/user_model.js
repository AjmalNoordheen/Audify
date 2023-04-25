const mongoose = require('mongoose')

const user_Schema=new mongoose.Schema({
    
    name: {
        type: String,
        required: true,
    },

    email: {
        type: String,
        required: true,
    },
    mobile:{
        type:Number,
        required:true,
    },
    password:{
        type:String,
        required:true,
    },
    is_admin:{
        type:Number,
        require:true,
    },
    is_verified:{
        type:Number,
        default:0,
    },
    is_blocked:{
        type:Number,
        default:0
    },
    is_show:{
        type:Number,
        default:0
    },
    discountedTotal:{
        type:Number
    },
    cart:[{
        products:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'product',
            required:true
        },
        quantity:{
            type:Number,
            required:true
        },
        totalprice:{
            type:Number,
            required:true
        },
        grandTotal:{
            type:Number,
            required:true
        }
    }], 
    whishList:[{
        product:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'product',
            required:true
        }
    }],
    address:[{
        name:{
            type:String,
            required:true
        },
        houseName:{
            type:String,
            required:true
        },
        townCity:{
            type:String,
            required:true
        },
        district:{
            type:String,
            required:true
        },
        state:{
            type:String,
            required:true
        },
        pincode:{
            type:String,
            required:true
        },
        mobileNo:{
            type:Number,
            required:true
        },
        email:{
            type:String,
            required:true
        }


    }]

})

const Schema= mongoose.model('user',user_Schema)
module.exports=Schema