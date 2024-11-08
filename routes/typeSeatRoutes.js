//D:\Be_Movie\routes\typeSeatRoutes.js
const express = require('express');
const TypeSeat = require('../models/TypeSeat'); // Model TypeSeat
const router = express.Router();

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

module.exports = router;
