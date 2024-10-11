var express = require('express');
var router = express.Router();
var RoomController = require('../module/Rooms/RoomController')

router.post('/add', async function(req, res, next) {
    try {
        const {name,totalSeat,roomShape,cinema_id}=req.body;
        const room = await RoomController.add(nname,totalSeat,roomShape,cinema_id);
        res.status(200).json(cinema)
    } catch (error) {
        res.status(414).json({ cinema: { name: null, parentId: null } });
    }
  });

  router.get('/getAll', async function (req, res) {
    try {
        const room = await RoomController.getAll()
        res.status(200).json(room)

    } catch (error) {
        console.log(error);
        res.status(414).json({ room: { name: null, parentId: null } });
    }
})
module.exports = router;