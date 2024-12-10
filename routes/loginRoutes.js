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
router.get('/protect', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
  
    if (!token) {
      return res.status(401).json({ message: 'Token không được cung cấp' });
    }
  
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
      }
  
      // Nếu token hợp lệ, bạn có thể trả về thông tin người dùng hoặc thông điệp khác
      res.json({ message: 'Token hợp lệ', user });
    });
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
router.post('/edit-profile', async (req, res) => {
    const {name, email, address, phone } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Bạn cần đăng nhập để thực hiện thao tác này.' });
    }

    try {     
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại.' });
        }
        const checkEmail = await User.findOne({
            email: email,
            _id: { $ne: decoded.id }  // Loại trừ chính người dùng hiện tại
          });
        if (checkEmail) {
            return res.status(404).json({ message: 'Email đã được đăng kí.' });
        }
        const checkPhone = await User.findOne({
            phone: phone,
            _id: { $ne: decoded.id } 
          });
        if (checkPhone) {
            return res.status(404).json({ message: 'Số điện thoại đã được đăng kí.' });
        }
        user.name = name || user.name;
        user.email = email || user.email;
        user.address = address || user.address;
        user.phone = phone || user.phone;
        const newUser= await user.save()
        res.status(200).json({ message: 'Đổi thông tin thành công!', user:newUser});
    } catch (error) {
        res.status(500).json({ message: 'Có lỗi xảy ra.', error: error.message });
    }
});
module.exports = router;
