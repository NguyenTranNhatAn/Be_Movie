// routes/roomRoutes.js
const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

// Hàm phân tích layout ghế và tạo ghế
const addSeatsToRoom = async (roomId, seatLayout) => {
    const rows = seatLayout.split('/');
    let seatIndex = 1;

    // Loại ghế được định nghĩa dựa trên ký tự trong layout
    const seatTypes = {
        'U': 'T', // Ghế thường (T)
        'A': 'V', // Ghế VIP (V)
        'R': 'D', // Ghế đôi (D)
    };

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        const row = rows[rowIndex];
        for (let colIndex = 0; colIndex < row.length; colIndex++) {
            const seatChar = row[colIndex];
            if (seatChar !== '_') {  // Bỏ qua ký tự trống
                const seatTypeKey = seatTypes[seatChar]; // Lấy loại ghế từ ký tự trong layout
                // Tìm loại ghế tương ứng trong bảng TypeSeat
                const typeSeat = await TypeSeat.findOne({ typeSeatName: seatTypeKey });
                if (typeSeat) {
                    const seatNumber = `${String.fromCharCode(65 + rowIndex)}${colIndex + 1}`;
                    const seat = new Seat({
                        seatID: `S${seatIndex++}`,
                        roomID: roomId,
                        seatNumber: seatNumber,
                        status: 'A', // Trạng thái mặc định là Available (chưa đặt)
                        typeSeatId: typeSeat._id, // Liên kết loại ghế
                    });
                    await seat.save(); // Lưu ghế vào database
                }
            }
        }
    }
}


// API thêm phòng mới
router.post('/addRoom', async (req, res) => {
    const { roomID, roomName, totalSeats, cinemaId, roomShape } = req.body;

    try {
        // Kiểm tra xem cinema có tồn tại không
        const cinema = await Cinema.findById(cinemaId);
        if (!cinema) {
            return res.status(404).json({ message: 'Cinema not found' });
        }

        // Tạo phòng mới
        const newRoom = new Room({
            roomID,
            roomName,
            totalSeats,
            cinemaId,
            roomShape
        });

        const savedRoom = await newRoom.save();

        // Phân tích layout ghế và thêm ghế
        await addSeatsToRoom(savedRoom._id, roomShape);

        res.status(201).json({ message: 'Room and seats added successfully', room: savedRoom });
    } catch (error) {
        res.status(500).json({ message: 'Error adding room', error: error.message });
    }
});

module.exports = router;