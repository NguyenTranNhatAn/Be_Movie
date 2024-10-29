var express = require('express');
var router = express.Router();
var BrandController = require('../module/Brand/BrandController')

router.post('/add', async function(req, res, next) {
    try {
        const {name,logo,descripton}=req.body;
        const brand = await BrandController.add(name,logo,descripton);
        res.status(200).json(brand)
    } catch (error) {
        res.status(414).json({status:"false" } );
    }
  });

  router.get('/getAll', async function (req, res) {
    try {
        const brand = await BrandController.getAll()
        res.status(200).json(brand)

    } catch (error) {
        console.log(error);
        res.status(414).json({status:"false" } );
    }
})
module.exports = router;