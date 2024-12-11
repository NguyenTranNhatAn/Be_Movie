var express = require('express');
var router = express.Router();
var CinemaController = require('../module/Cinemas/CinemaController')

router.post('/add', async function (req, res, next) {
    try {
        const { name, address, brandId } = req.body;
        const cinema = await CinemaController.add(name, address, brandId);
        res.status(200).json(cinema)
    } catch (error) {
        res.status(414).json({ status: "false" });
    }
});
router.post('/update', async function (req, res) {
    try {

        const {_id,name,address,brandId} = req.body;
        const cinema = await CinemaController.update(_id,name,address,brandId)

        res.status(200).json({ status: 'true', cinema: cinema })
    } catch (error) {
        console.log(error);
        res.status(414).json({ status: 'false', error: error.message });
    }
})
router.get('/getAll', async function (req, res) {
    try {
        const cinema = await CinemaController.getAll()
        res.status(200).json(cinema)

    } catch (error) {
        console.log(error);
        res.status(414).json({ status: "false" });
    }
})
router.get('/getDelete', async function (req, res) {
    try {
        const cinema = await CinemaController.getDelete()
        res.status(200).json(cinema)

    } catch (error) {
        console.log(error);
        res.status(414).json({ status: "false" });
    }
})
router.post('/delete', async function (req, res) {
    try {

        const { _id } = req.body;
        let cinema;
        cinema = await CinemaController.remove(_id);
        res.status(200).json({ status: 'true', message: 'Xóa Thành công' })
    } catch (error) {
        console.log(error);
        res.status(414).json({ status: 'false', message: error.message });
    }
})
router.post('/revert', async function (req, res) {
    try {

        const { _id } = req.body;
        let cinema;
        cinema = await CinemaController.revert(_id);
        res.status(200).json({ status: 'true', message: 'Hoàn xóa Thành công' })
    } catch (error) {
        console.log(error);
        res.status(414).json({ status: 'false', message: error.message });
    }
})
router.get('/getByBrand', async function (req, res) {
    try {
        const { brandId } = req.query;
        const cinema = await CinemaController.findByBrand(brandId)
        res.status(200).json(cinema)

    } catch (error) {
        console.log(error);
        res.status(414).json({ status: "false" });
    }
})
router.get('/getById', async function (req, res) {
    try {
        const { _id } = req.query;
        const cinema = await CinemaController.getById(_id)
        res.status(200).json(cinema)

    } catch (error) {
        console.log(error);
        res.status(414).json({ status: "false" });
    }
})
module.exports = router;