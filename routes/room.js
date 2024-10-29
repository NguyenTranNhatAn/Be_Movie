var express = require('express');
var router = express.Router();
var RoomController = require('../module/Rooms/RoomController')

router.post('/add', async function(req, res, next) {
    try {
        const {name,totalSeat,roomShape,cinema_id}=req.body;
        const room = await RoomController.add(name,totalSeat,roomShape,cinema_id);
        res.status(200).json(room)
    } catch (error) {
        res.status(414).json({status:"false" } );
    }
  });

  router.get('/getAll', async function (req, res) {
    try {
        const room = await RoomController.getAll()
        res.status(200).json(room)

    } catch (error) {
        console.log(error);
        res.status(414).json({status:"false" } );
    }
})
module.exports = router;