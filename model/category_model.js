const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({
    name:{
        uppercase:true,
        trim:true,
        type:String,
        required:true,
    
    }
})


const Schema= mongoose.model('category',categorySchema)
module.exports=Schema