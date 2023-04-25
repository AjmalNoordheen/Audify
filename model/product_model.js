const mongoose=require('mongoose')


const productSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    category:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:'category'
    },
    price:{
        type:Number,
        required:true
        },
    images:{
        type:Array,
        required:true
    },
    
    quantity:{
        type:Number,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    brand:{
        type:String,
        required:true
    },
    is_flagged:{
        type:Number,
        default:0
    }
})

const productModel= mongoose.model('product',productSchema)
module.exports=productModel