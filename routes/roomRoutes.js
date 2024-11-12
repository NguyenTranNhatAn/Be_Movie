const express = require('express');
const mongoose = require('mongoose');

const Room = require('../module/Rooms/RoomModel'); // Model Room
const router = express.Router();

// API thêm phòng chiếu
router.post('/addRooms', async (req, res) => {
  const { name, totalSeat, roomShape, cinemaId, seatTypes } = req.body;

  try {
    // Tạo phòng chiếu mới
    const newRoom = new Room({
      name: name,
      totalSeat: totalSeat,
      roomShape: roomShape,
      cinemaId: cinemaId,
      seatTypes: seatTypes // Tham chiếu đến các loại ghế đã có
    });

    // Lưu phòng chiếu vào cơ sở dữ liệu
    const savedRoom = await newRoom.save();

    res.json({ message: 'Room added successfully', roomId: savedRoom._id });
  } catch (error) {
    res.status(500).json({ message: 'Error adding room', error });
  }
});

module.exports = router;
