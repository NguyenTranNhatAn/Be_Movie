const express = require('express');
const router = express.Router();
const mongoose = require('mongoose'); // Thêm dòng này để require mongoose
const Playtime = require('../models/Playtime');
const Movie = require('../module/Movies/MovieModel');
const Cinema = require('../module/Cinemas/CinemaModel');
const Room = require('..//module/Rooms/RoomModel');
const ObjectId = mongoose.Types.ObjectId; // Sử dụng ObjectId từ mongoose

// API lấy tất cả suất chiếu theo movie_id
// router.get('/playtimes/:movieId', async (req, res) => {
//     const { movieId } = req.params;
//     try {
//         // Tìm các suất chiếu có movie_id tương ứng
//         const playtimes = await Playtime.find({ movie_id: movieId })
//             .populate('cinema_id', 'name address') // Lấy thông tin rạp chiếu (tên, địa chỉ)
//             .populate('room_id', 'name roomShape') // Lấy thông tin phòng chiếu (tên, số ghế)
//             .populate('movie_id', 'name duration'); // Lấy thông tin phim (tên, thời lượng)

//         if (!playtimes || playtimes.length === 0) {
//             return res.status(404).json({ message: 'Không tìm thấy suất chiếu cho phim này' });
//         }

//         res.status(200).json(playtimes);
//     } catch (error) {
//         res.status(500).json({ message: 'Lỗi hệ thống', error });
//     }
// });
// API hiển thị danh sách lịch chiếu theo movie_id
router.get('/playtimes/:movie_id', async (req, res) => {
    try {
        const { movie_id } = req.params; // Lấy movie_id từ URL

        // Tìm tất cả lịch chiếu có movie_id xác định
        const playtimes = await Playtime.find({ movie_id })
            .populate('movie_id', 'name duration') // Lấy thông tin tên và thời lượng phim
            .populate('cinema_id', 'name address') // Lấy tên và địa chỉ của rạp chiếu
            .populate('room_id', 'name roomShape') // Lấy tên và số ghế của phòng chiếu
            .exec();

        // Kiểm tra nếu không có lịch chiếu nào
        if (!playtimes.length) {
            return res.status(404).json({ message: 'Không tìm thấy lịch chiếu cho movie_id đã cung cấp' });
        }

        res.status(200).json(playtimes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi hiển thị lịch chiếu', error: error.message });
    }
});

// Route để thêm một suất chiếu mới
// router.post('/playtimes', async (req, res) => {
//     try {
//         const newPlaytime = new Playtime(req.body);
//         await newPlaytime.save();
//         res.status(201).json({ message: 'Thêm suất chiếu thành công', data: newPlaytime });
//     } catch (error) {
//         res.status(400).json({ message: 'Có lỗi xảy ra', error });
//     }
// });
// API thêm một suất chiếu mới
// API thêm một suất chiếu mới
router.post('/add-playtime', async (req, res) => {
    try {
        const { movie_id, cinema_id, room_id, format, dates } = req.body;

        // Kiểm tra xem phim có tồn tại không
        const movieExists = await Movie.findById(movie_id);
        if (!movieExists) {
            return res.status(400).json({ message: 'Không tìm thấy phim với ID đã cung cấp' });
        }

        // Kiểm tra xem tất cả các rạp chiếu có tồn tại không
        for (const cinemaId of cinema_id) {
            const cinemaExists = await Cinema.findById(cinemaId);
            if (!cinemaExists) {
                return res.status(400).json({ message: `Không tìm thấy rạp chiếu với ID ${cinemaId}` });
            }
        }

        // Kiểm tra xem tất cả các phòng chiếu có tồn tại không
        for (const roomId of room_id) {
            const roomExists = await Room.findById(roomId);
            if (!roomExists) {
                return res.status(400).json({ message: `Không tìm thấy phòng chiếu với ID ${roomId}` });
            }
        }

        // Tạo một tài liệu lịch chiếu mới
        const newPlaytime = new Playtime({
            movie_id,
            cinema_id,
            room_id,
            format,
            dates
        });

        // Lưu lịch chiếu vào cơ sở dữ liệu
        const savedPlaytime = await newPlaytime.save();
        res.status(201).json({
            message: 'Lịch chiếu đã được thêm thành công',
            playtime: savedPlaytime
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi thêm lịch chiếu', error: error.message });
    }
});





module.exports = router;
