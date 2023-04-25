const mongoose = require('mongoose')

const banner_Schema = new mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    images:{
        type:Array,
        required:true
    },
    subtitle:{
        type:String,
        required:true
    },
    description:{
        type:String
    }
})

const BannerModel =  mongoose.model('bannerModel',banner_Schema)
module.exports = BannerModel