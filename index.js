const express = require('express')
const app = express()
const body_parser = require('body-parser')
const mongoose = require('mongoose')
const nocache=require("nocache")
const env = require('dotenv').config()
//=======For Connecting DB======

if (mongoose.connect(process.env.DB_CONNECTION_STRING)) {
    console.log('DB Connected')
} else {
    console.log("Error Connecting on DB")
}

app.use(nocache())
app.use(express.static('public'));
app.use(body_parser.json())
app.use(body_parser.urlencoded({extended:true}))

// For Users route
const user_route = require('./routes/user_route')
const admin_route=require('./routes/admin_route')
const error_route=require('./routes/404')



// For Admin's Route
app.use('/', user_route)
app.use('/admin',admin_route)
app.use('/',error_route)

// For 404 Rout


app.listen(process.env.Port, () => {
    console.log('Server Started....')
})

