var express = require('express');
var router = express.Router();
var BrandController = require('../module/Brand/BrandController')

router.post('/add', async function (req, res, next) {
    try {
        const { name, logo, description } = req.body;
        console.log(description)
        const brand = await BrandController.add(name, logo, description);
        res.status(200).json(brand)
    } catch (error) {
        res.status(414).json({ status: "false" });
    }
});
router.post('/update', async function (req, res) {
    try {

        const { _id, name, logo, description } = req.body;
        const brand = await BrandController.update(_id, name, logo, description)

        res.status(200).json({ status: 'true', brand: brand })
    } catch (error) {
        console.log(error);
        res.status(414).json({ status: 'false', error: error.message });
    }
})
router.get('/delete', async function (req, res) {
    try {

        const { _id } = req.query;
        let brand;
        brand = await BrandController.remove(_id);
        res.status(200).json({ status: 'true' ,message:'Xóa Thành công'})
    } catch (error) {
        console.log(error);
        res.status(414).json({ status: 'false',message:error.message});
    }
})
router.get('/getAll', async function (req, res) {
    try {
        const brand = await BrandController.getAll()
        res.status(200).json(brand)

    } catch (error) {
        console.log(error);
        res.status(414).json({ status: "false" });
    }
})
module.exports = router;