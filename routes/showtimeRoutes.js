// routes/showtimeRoutes.js
const express = require('express');
const mongoose = require('mongoose');


const router = express.Router();

// API thêm hoặc cập nhật showtime mới
router.post('/updateShowTime', async (req, res) => {
    const { showTimeId, movieId, roomId, startTime, endTime, day, selectedSeats } = req.body;

    try {
        // Kiểm tra xem phòng có tồn tại không
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        // Sao chép layout ghế từ room
        const roomSeats = room.roomShape;

        // Lấy tất cả ghế đã đặt cho showtime này
        const currentShowTime = await ShowTime.findOne({ showTimeId });
        if (!currentShowTime) {
            return res.status(404).json({ message: 'Showtime not found' });
        }

        // Cập nhật trạng thái ghế cũ về trạng thái có sẵn
        const oldSelectedSeats = currentShowTime.selectedSeats || []; // Danh sách ghế đã chọn trước đó
        for (const seatNumber of oldSelectedSeats) {
            const seat = await Seat.findOne({ seatNumber: seatNumber, roomID: roomId });
            if (seat) {
                seat.status = 'A'; // Đặt lại trạng thái ghế thành Available (A)
                await seat.save();
            }
        }

        // Cập nhật trạng thái ghế mới thành đã đặt
        for (const seatNumber of selectedSeats) {
            const seat = await Seat.findOne({ seatNumber: seatNumber, roomID: roomId });
            if (seat) {
                seat.status = 'B'; // Cập nhật trạng thái ghế thành đã đặt (B)
                await seat.save();
            }
        }

        // Cập nhật showtime
        currentShowTime.movieId = movieId;
        currentShowTime.roomId = roomId;
        currentShowTime.startTime = startTime;
        currentShowTime.endTime = endTime;
        currentShowTime.day = day;
        currentShowTime.roomSeats = roomSeats;
        currentShowTime.selectedSeats = selectedSeats; // Cập nhật danh sách ghế đã chọn mới

        const updatedShowTime = await currentShowTime.save();

        res.status(200).json({ message: 'Showtime updated successfully', showTime: updatedShowTime });
    } catch (error) {
        res.status(500).json({ message: 'Error updating showtime', error: error.message });
    }
});
//lấy layout ghế
router.get('/layout', async (req, res) => {
    try {
        const showTime = await ShowTime.findById(req.query.showTimeId); // Lấy showtime theo ID
        if (!showTime) {
            return res.status(404).json({ message: 'Showtime not found' });
        }
        res.json(showTime);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching showtime', error: error.message });
    }
});
// Lưu ghế đã chọn
router.post('/save', async (req, res) => {
    const { selectedSeats } = req.body;

    // Xử lý lưu ghế vào cơ sở dữ liệu, có thể liên kết với showTime
    try {
        // Logic lưu ghế vào cơ sở dữ liệu
        res.status(200).json({ message: 'Seats saved successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error saving seats', error: error.message });
    }
});
module.exports = router;
