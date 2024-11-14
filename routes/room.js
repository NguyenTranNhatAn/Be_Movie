var express = require('express');
var router = express.Router();
var RoomController = require('../module/Rooms/RoomController')

router.post('/add', async function(req, res, next) {
    try {
        const {name,totalSeat,roomShape,cinema_id}=req.body;
        const room = await RoomController.add(name,totalSeat,roomShape,cinema_id,se);
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
  router.get('/getDelete', async function (req, res) {
    try {
        const room = await RoomController.getDelete()
        res.status(200).json(room)

    } catch (error) {
        console.log(error);
        res.status(414).json({status:"false" } );
    }
})
router.get('/getByCinema', async function (req, res) {
    try {
        const { cinemaId } = req.query;
        const room = await RoomController.listByCinema(cinemaId)
        res.status(200).json(room)

    } catch (error) {
        console.log(error);
        res.status(414).json({status:"false" } );
    }
})
router.post('/delete', async function (req, res) {
    try {
  
        const { _id } = req.body;
        let room;
        room = await RoomController.remove(_id);
        
        res.status(200).json({ status: 'true' ,message:'Xóa Thành công'})
    } catch (error) {
        console.log(error);
        res.status(414).json({ status: 'false',message:error.message });
    }
  })
router.post('/revert', async function (req, res) {
    try {
  
        const { _id } = req.body;
        let room;
        room = await RoomController.revert(_id);
        
        res.status(200).json({ status: 'true' ,message:'Hoàn xóa Thành công'})
    } catch (error) {
        console.log(error);
        res.status(414).json({ status: 'false',message:error.message });
    }
  })
  router.post('/update', async function (req, res) {
    try {
  
        const {_id,name,roomShape,cinemaId,totalSeat} = req.body;
        
        const room= await RoomController.update(_id,name,roomShape,cinemaId,totalSeat)
       
        res.status(200).json({ status: 'true', room:room })
    } catch (error) {
        console.log(error);
        res.status(414).json({ status: 'false', error:'Không thể sửa chữa' });
    }
  })
module.exports = router;