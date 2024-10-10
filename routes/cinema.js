var express = require('express');
var router = express.Router();
var CinemaController = require('../module/Cinemas/CinemaController')

router.post('/add', async function(req, res, next) {
    try {
        const {name,address}=req.body;
        const cinema = await CinemaController.add(name,address);
        res.status(200).json(cinema)
    } catch (error) {
        res.status(414).json({ cinema: { name: null, parentId: null } });
    }
  });
module.exports = router;