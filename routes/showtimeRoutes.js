const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ShowTime = require('../models/ShowTime'); // Đường dẫn đến mô hình ShowTime
const Room = require('../module/Rooms/RoomModel'); // Đường dẫn đến mô hình Room
const SeatType = require('../models/TypeSeat'); // Đường dẫn đến mô hình SeatType
const Seat = require('../models/Seat');
// API thêm suất chiếu và sao chép roomShape từ Room
// API thêm suất chiếu và sao chép roomShape từ Room
router.post('/addShowTimes', async (req, res) => {
    const { movieId, roomId, startTime, endTime, day, seatTypes } = req.body;

    try {
        // Tìm phòng chiếu để lấy roomShape
        const room = await Room.findById(roomId);

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        // Đảm bảo các ObjectId trong seatTypes là hợp lệ
        const validSeatTypes = seatTypes.map(id => new mongoose.Types.ObjectId(id));


        // Tạo suất chiếu mới và sao chép layout ghế
        const newShowtime = new ShowTime({
            movieId: movieId,
            roomId: roomId,
            startTime: startTime,
            endTime: endTime,
            day: day,
            Room_Shape: room.roomShape,  // Sao chép roomShape từ phòng chiếu
            seatTypes: validSeatTypes // Liên kết với loại ghế (nếu có)
        });

        // Lưu suất chiếu vào cơ sở dữ liệu
        const savedShowtime = await newShowtime.save();

        res.json({ message: 'Showtime added successfully', showtimeId: savedShowtime._id });
    } catch (error) {
        console.error('Error adding showtime:', error);
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
        //const showtime = await ShowTime.findById(showtimeId).populate('seatTypes');
        // Sử dụng populate để lấy thông tin về TypeSeat
        const showtime = await ShowTime.findById(showtimeId).populate({
            path: 'seatTypes', // Đây là tên trường trong schema của ShowTime
            model: 'typeSeat', // Đảm bảo rằng model 'TypeSeat' khớp với tên bạn đã đăng ký
            select: 'typeSeatName typeSeatPrice' // Lấy các trường cần thiết
        });
        console.log('Seat Types Populated:', showtime.seatTypes); // Kiểm tra xem dữ liệu đã được populate hay chưa

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
            seatTypes: showtime.seatTypes // Thông tin về loại ghế
        });
    } catch (error) {
        console.error('Error fetching showtime data:', error); // Thêm log này
        res.status(500).json({ message: 'Error fetching showtime data', error });
    }
});



// API cập nhật trạng thái ghế sau khi thanh toán
router.put('/bookSeats', async (req, res) => {
    console.log('Received data:', req.body);
    const { showtimeId, seats, userId, dateBooked, timeBooked } = req.body;
    //kiểm tra ID của showtime hợp lệ 
    if (!mongoose.Types.ObjectId.isValid(showtimeId)) {
        return res.status(400).json({ message: 'Invalid Showtime ID' });
    }
    try {
        //Tìm showtime và ;ấy thoogn tin tham chiếu
        const showtime = await ShowTime.findById(showtimeId)
            .populate({
                path: 'roomId',
                populate: { path: 'cinema_id', model: 'cinema' }
            })


            .populate('movieId')
        if (!showtime) {
            return res.status(404).json({ message: 'Showtime not found' });
        }
        //cập nhật trạng thái ghế trong  Room_Shape
        let updatedShape = showtime.Room_Shape.split('/');
        const seatDetails = [];
        let totalPrice = 0;
        //Thu thập dữ liệu ghế mới để thêm vào bảng Seat
        const newSeats = [];
        seats.forEach(seat => {
            const { row, col, price, typeSeatName } = seat;
            if (row < updatedShape.length) {
                let rowSeats = updatedShape[row].split('');
                if (col < rowSeats.length) {
                    rowSeats[col] = 'U';//đánh dấu ghế đã đặt
                    updatedShape[row] = rowSeats.join('');

                    // Thêm chi tiết ghế vào mảng seatDetails
                    seatDetails.push({
                        seatNumber: `${row}-${col}`,
                        typeSeatName,
                        price
                    });
                    // Tính tổng giá
                    totalPrice += price;
                }
            }
        });

        //Cập nhật lại Room_Shape trong document showtime
        showtime.Room_Shape = updatedShape.join('/');
        await showtime.save();

        // Tạo tài liệu Seat mới cho toàn bộ giao dịch
        const seatBooking = new Seat({
            roomID: showtime.roomId._id,
            movieId: showtime.movieId._id,
            seats: seatDetails, // Lưu toàn bộ chi tiết ghế vào mảng seats
            totalPrice: totalPrice, // Tổng giá của tất cả ghế đã đặt
            dateBooked: dateBooked,    // Ngày mà người dùng chọn
            timeBooked: timeBooked,    // Giờ mà người dùng chọn
            userId // Lưu ID người dùng để biết ai đã đặt ghế
        });
        //Lưu vào bảng Seat
        await seatBooking.save();
        res.json({ success: true, message: 'Seats booked successfully' });

    } catch (error) {
        console.error('Error updating seats:', error);
        res.status(500).json({ message: 'Error updating seats', error });

    }
});
module.exports = router;
