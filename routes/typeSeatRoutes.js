//D:\Be_Movie\routes\typeSeatRoutes.js
const express = require('express');
const TypeSeat = require('../models/TypeSeat'); // Model TypeSeat
const router = express.Router();
var TypeseatControler = require('../module/TypeSeat/TypeseatController');
// API thêm loại ghế
router.post('/addTypeSeats', async (req, res) => {
  const { typeSeatName, cinemaId, typeSeatPrice } = req.body;

  try {
    // Tạo loại ghế mới
    const newTypeSeat = new TypeSeat({
      typeSeatName: typeSeatName,
      cinemaId: cinemaId,
      typeSeatPrice: typeSeatPrice
    });

    // Lưu loại ghế vào cơ sở dữ liệu
    const savedTypeSeat = await newTypeSeat.save();

    res.json({ message: 'TypeSeat added successfully', typeSeatId: savedTypeSeat._id });
  } catch (error) {
    res.status(500).json({ message: 'Error adding typeSeat', error });
  }
});
router.get('/getDelete', async function (req, res) {
  try {
      const typeseat = await TypeseatControler.getDelete()
      res.status(200).json(typeseat)

  } catch (error) {
      console.log(error);
      res.status(414).json({status:"false" } );
  }
})
router.get('/getAll', async function (req, res) {
  try {
      const typeseat = await TypeseatControler.getAll()
      res.status(200).json(typeseat)

  } catch (error) {
      console.log(error);
      res.status(414).json({status:"false" } );
  }
})
router.get('/getByCinemaId', async function (req, res) {
  try {
    const { cinemaId } = req.query;
      const typeseat = await TypeseatControler.getByCinemaId(cinemaId)
      res.status(200).json(typeseat)

  } catch (error) {
      console.log(error);
      res.status(414).json({status:"false" } );
  }
})
router.get('/getDeleteByCinema', async function (req, res) {
  try {
    const { cinemaId } = req.query;
      const typeseat = await TypeseatControler.getByCinemaIdDelete(cinemaId)
      res.status(200).json(typeseat)

  } catch (error) {
      console.log(error);
      res.status(414).json({status:"false" } );
  }
})
router.get('/getRemain', async function (req, res) {
  try {
    const { cinemaId } = req.query;
      const typeseat = await TypeseatControler.getCinemaRemain(cinemaId);
      if(typeseat.length!==0){
        res.status(200).json({status:true,typeseat})
      }
      else{
        res.status(200).json({status:false})
      }
     

  } catch (error) {
      console.log(error);
      res.status(414).json({status:"false" } );
  }
})
router.post('/delete', async function (req, res) {
  try {

      const { _id } = req.body;
      let typeseat;
      typeseat = await TypeseatControler.remove(_id);
      
      res.status(200).json({ status: 'true' ,message:'Xóa Thành công'})
  } catch (error) {
      console.log(error);
      res.status(414).json({ status: 'false',message:error.message });
  }
})
router.post('/revert', async function (req, res) {
  try {

      const { _id } = req.body;
      let typeseat;
      typeseat = await TypeseatControler.revert(_id);
      
      res.status(200).json({ status: 'true' ,message:'Hoàn xóa Thành công'})
  } catch (error) {
      console.log(error);
      res.status(414).json({ status: 'false',message:error.message });
  }
})
router.get('/getDetail', async function (req, res) {
  try {
      const {_id} =req.query
      const seatType = await TypeseatControler.getDetail(_id)
      res.status(200).json(seatType)

  } catch (error) {
      console.log(error);
      res.status(414).json({status:"false" } );
  }
})
router.post('/update', async function (req, res) {
  try {

      const {_id,typeSeatName,cinemaId,typeSeatPrice} = req.body;
      const movie= await TypeseatControler.update(_id,typeSeatName,cinemaId,typeSeatPrice)
     
      res.status(200).json({ status: 'true', movie:movie })
  } catch (error) {
      console.log(error);
      res.status(414).json({ status: 'false', error:'Không thể sửa chữa' });
  }
})
module.exports = router;
