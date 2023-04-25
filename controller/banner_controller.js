const banner = require('../model/banner_model')
let message
// =======Render Banner========

const bannerPage = async (req, res, next) => {
    try {
        const bannerDetails = await banner.find()
        res.render('banner', { message, bannerDetails })
        message = null
    } catch (error) {
        next()
    }
}


// =======Add Banner======

const addBanner = async (req, res, next) => {
    try {
        let images = []
        for (let i = 0; i < req.files.length; i++) {
            images[i] = req.files[i].filename
        }
        const title = req.body.name
        const sub = req.body.subtitle
        description = req.body.description
        const detailSave = new banner({
            title: title,
            images: images,
            subtitle: sub,
            description: description
        })
        const bannerDetails = await detailSave.save()
        if (bannerDetails) {
            message = 'Successfully Added'
            res.redirect('/admin/banner')
        }
    } catch (error) {
        next()
    }
}

// =====Delete Banner=======
const deleteBanner = async (req, res, next) => {
    try {
        bannerId = req.query.delete
        await banner.deleteOne({ _id: bannerId })
        res.redirect('/admin/banner')
    } catch (error) {
        next()
    }
}


module.exports = { bannerPage, addBanner, deleteBanner }