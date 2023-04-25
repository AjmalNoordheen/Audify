const express = require("express");
const router = express();

router.set('view engine','ejs')
router.set('views','./views/users')

const errorServer = router.get('/error',(req,res) => res.render('500Error'));

module.exports ={errorServer};