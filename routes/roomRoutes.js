const express = require('express');
const Room = require('../module/Rooms/RoomModel'); // Model Room
const router = express.Router();

// API thêm phòng chiếu
router.post('/addRooms', async (req, res) => {
  const { name, totalSeat, roomShape, cinema_id, seatTypes } = req.body;

  try {
    // Tạo phòng chiếu mới
    const newRoom = new Room({
      name: name,
      totalSeat: totalSeat,
      roomShape: roomShape,
      cinema_id: cinema_id,
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
