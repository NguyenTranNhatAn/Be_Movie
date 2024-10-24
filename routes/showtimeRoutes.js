const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ShowTime = require('../models/ShowTime'); // Đường dẫn đến mô hình ShowTime
const Room = require('../module/Rooms/RoomModel'); // Đường dẫn đến mô hình Room
const SeatType = require('../models/TypeSeat'); // Đường dẫn đến mô hình SeatType


// API thêm suất chiếu và sao chép roomShape từ Room
router.post('/addShowTimes', async (req, res) => {
    const { movieId, roomId, startTime, endTime, day } = req.body;  // Sử dụng đúng tên trường

    try {
        // Tìm phòng chiếu để lấy roomShape
        const room = await Room.findById(roomId);

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        // Tạo suất chiếu mới và sao chép layout ghế
        const newShowtime = new ShowTime({
            movieId: movieId,
            roomId: roomId,
            startTime: startTime,
            endTime: endTime,
            day: day,
            Room_Shape: room.roomShape  // Sao chép roomShape từ phòng chiếu
        });

        // Lưu suất chiếu vào cơ sở dữ liệu
        const savedShowtime = await newShowtime.save();

        res.json({ message: 'Showtime added successfully', showtimeId: savedShowtime._id });
    } catch (error) {
        res.status(500).json({ message: 'Error adding showtime', error });
    }
});

// API hiển thị layout ghế của suất chiếu
router.get('/:showtimeId', async (req, res) => {
    const { showtimeId } = req.params;

    // Kiểm tra tính hợp lệ của ObjectId trước khi tìm kiếm
    if (!mongoose.Types.ObjectId.isValid(showtimeId)) {
        return res.status(400).json({ message: 'Invalid Showtime ID' });
    }

    try {
        const showtime = await ShowTime.findById(showtimeId);

        if (!showtime) {
            return res.status(404).json({ message: 'Showtime not found' });
        }

        // Trả về layout ghế (Room_Shape)
        res.json({
            Room_Shape: showtime.Room_Shape,
            showtimeId: showtime._id,
            movieId: showtime.movieId,
            startTime: showtime.startTime,
            endTime: showtime.endTime,
            day: showtime.day,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching showtime data', error });
    }
});

// API cập nhật trạng thái ghế sau khi thanh toán
// API cập nhật trạng thái ghế sau khi thanh toán
router.put('/bookSeats', async (req, res) => {
    const { showtimeId, seats } = req.body;
    console.log("Received seats:", seats); // Thêm log này để kiểm tra

    if (!mongoose.Types.ObjectId.isValid(showtimeId)) {
        return res.status(400).json({ message: 'Invalid Showtime ID' });
    }

    try {
        const showtime = await ShowTime.findById(showtimeId);

        if (!showtime) {
            return res.status(404).json({ message: 'Showtime not found' });
        }

        // Cập nhật trạng thái ghế trong layout Room_Shape
        let updatedShape = showtime.Room_Shape.split('/');
        console.log('Original Room_Shape:', updatedShape); // Log để kiểm tra dữ liệu hiện tại

        seats.forEach(seat => {
            const { row, col } = seat;
            console.log(`Updating seat at row ${row}, col ${col}`); // Log thông tin từng ghế

            let rowSeats = updatedShape[row].split('');
            rowSeats[col] = 'U'; // Cập nhật trạng thái ghế thành "U" (đã đặt)
            updatedShape[row] = rowSeats.join('');
        });

        showtime.Room_Shape = updatedShape.join('/');
        console.log('Updated Room_Shape:', showtime.Room_Shape); // Log sau khi cập nhật

        // Lưu lại các thay đổi
        await showtime.save();

        res.json({ success: true, message: 'Seats booked successfully' });
    } catch (error) {
        console.error('Error updating seats:', error);
        res.status(500).json({ message: 'Error updating seats', error });
    }
});


module.exports = router;