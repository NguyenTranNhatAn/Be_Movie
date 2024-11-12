const express = require('express');
const router = express.Router();
const Playtime = require('../models/Playtime');

// API lấy tất cả suất chiếu theo movie_id
router.get('/playtimes/:movieId', async (req, res) => {
    const { movieId } = req.params;
    try {
        // Tìm các suất chiếu có movie_id tương ứng
        const playtimes = await Playtime.find({ movie_id: movieId })
            .populate('cinema_id', '') // Lấy thông tin rạp chiếu (tên, địa chỉ)
            .populate('room_id', '') // Lấy thông tin phòng chiếu (tên, số ghế)
            .populate('movie_id', 'name duration'); // Lấy thông tin phim (tên, thời lượng)
        console.log("hhhh", playtimes); // Log kết quả tìm kiếm
        if (!playtimes || playtimes.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy suất chiếu cho phim này' });
        }

        res.status(200).json(playtimes);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi hệ thống', error });
    }
});

// Route để thêm một suất chiếu mới
router.post('/playtimes', async (req, res) => {
    try {
        const newPlaytime = new Playtime(req.body);
        await newPlaytime.save();
        res.status(201).json({ message: 'Thêm suất chiếu thành công', data: newPlaytime });
    } catch (error) {
        res.status(400).json({ message: 'Có lỗi xảy ra', error });
    }
});

module.exports = router;
