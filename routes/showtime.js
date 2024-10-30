var express = require('express');
var router = express.Router();
var ShowtimeController = require('../module/Showtimes/ShowtimeController')

router.post('/add', async function(req, res, next) {
    try {
        const {movieId, roomId, startTime, endTime, day, Room_Shape,}=req.body;
        const showtime = await ShowtimeController.add(movieId, roomId, startTime, endTime, day, Room_Shape,);
        res.status(200).json(showtime)
    } catch (error) {
        res.status(414).json({status:"false" ,error:error} );
    }
  });

  router.get('/getAll', async function (req, res) {
    try {
        const showtime = await ShowtimeController.getAll()
        res.status(200).json(showtime)

    } catch (error) {
        console.log(error);
        res.status(414).json({status:"false" } );
    }
})
module.exports = router;