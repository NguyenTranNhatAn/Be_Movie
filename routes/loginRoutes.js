// D:\Be_Movie\routes\loginRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../module/Users/UserModel');
const router = express.Router();


// Đăng nhập API
router.post('/login', async (req, res) => {
    const { phone, password } = req.body;

    try {
        // Tìm người dùng dựa trên số điện thoại
        const user = await User.findOne({ phone });
        if (!user) {
            return res.status(400).json({ message: 'Số điện thoại không tồn tại.' });
        }

        // Kiểm tra mật khẩu
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu không đúng.' });
        }

        // Tạo JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ message: 'Đăng nhập thành công!', token });
    } catch (error) {
        res.status(500).json({ message: 'Có lỗi xảy ra.', error: error.message });
    }
});

// Đăng xuất API
router.post('/logout', (req, res) => {
    // Đăng xuất chỉ cần xóa token trên client
    res.status(200).json({ message: 'Đăng xuất thành công!' });
});
// Lấy thông tin người dùng
router.get('/user-info', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Token không hợp lệ.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password'); // Không trả mật khẩu
        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại.' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Có lỗi xảy ra.', error: error.message });
    }
});
// API Đổi Mật Khẩu
router.post('/change-password', async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Bạn cần đăng nhập để thực hiện thao tác này.' });
    }

    try {
        // Giải mã token để lấy user ID
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại.' });
        }

        // Kiểm tra mật khẩu cũ
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu cũ không đúng.' });
        }

        // Mã hóa mật khẩu mới
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Cập nhật mật khẩu mới
        user.password = hashedNewPassword;
        await user.save();
        res.status(200).json({ message: 'Đổi mật khẩu thành công!' });
    } catch (error) {
        res.status(500).json({ message: 'Có lỗi xảy ra.', error: error.message });
    }
});
module.exports = router;
