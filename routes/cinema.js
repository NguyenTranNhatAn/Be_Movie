var express = require('express');
var router = express.Router();
var CinemaController = require('../module/Cinemas/CinemaController')

router.post('/add', async function(req, res, next) {
    try {
        const {name,address,brandId}=req.body;
        const cinema = await CinemaController.add(name,address,brandId);
        res.status(200).json(cinema)
    } catch (error) {
        res.status(414).json({status:"false" } );
    }
  });

  router.get('/getAll', async function (req, res) {
    try {
        const cinema = await CinemaController.getAll()
        res.status(200).json(cinema)

    } catch (error) {
        console.log(error);
        res.status(414).json({status:"false" } );
    }
})
router.get('/getByBrand', async function (req, res) {
    try {
        const { brandId } = req.query;
        const cinema = await CinemaController.findByBrand(brandId)
        res.status(200).json(cinema)

    } catch (error) {
        console.log(error);
        res.status(414).json({status:"false" } );
    }
})
module.exports = router;