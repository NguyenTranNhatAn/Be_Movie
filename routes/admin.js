const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../module/Admin/AdminModel');
const router = express.Router();
var nodemailer = require('nodemailer');
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'nan22052004@gmail.com',
      pass: 'ukbx zbqk uspj xfxu'
    }
  });
// Đăng nhập API
router.post('/login', async (req, res) => {
    const { phone, password } = req.body;

    try {
        const admin = await Admin.findOne({ phone });
        if (!Admin) {
            return res.status(400).json({ message: 'Số điện thoại không tồn tại.' });
        }

        // Kiểm tra mật khẩu
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu không đúng.' });
        }

        // Tạo JWT token
        const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

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
router.get('/admin-info', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Token không hợp lệ.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await Admin.findById(decoded.id).select('-password'); // Không trả mật khẩu
        if (!admin) {
            return res.status(404).json({ message: 'Người dùng không tồn tại.' });
        }
        res.status(200).json(admin);
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
        // Giải mã token để lấy admin ID
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await Admin.findById(decoded.id);
        if (!Admin) {
            return res.status(404).json({ message: 'Người dùng không tồn tại.' });
        }

        // Kiểm tra mật khẩu cũ
        const isMatch = await bcrypt.compare(oldPassword, admin.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu cũ không đúng.' });
        }

        // Mã hóa mật khẩu mới
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Cập nhật mật khẩu mới
        admin.password = hashedNewPassword;
        await admin.save();
        res.status(200).json({ message: 'Đổi mật khẩu thành công!' });
    } catch (error) {
        res.status(500).json({ message: 'Có lỗi xảy ra.', error: error.message });
    }
});
// Generate OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let otp = generateOTP();

    // Check if the user already exists
    let existingUser = await Admin.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // 2. Hash mật khẩu
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    // Create a new user
    let newUser = new Admin({
      name,
      email,
      password: hash,
      otp
    });

    await newUser.save();

    // Send OTP email
    let mailOptions = {
      from: 'nan22052004@gmail.com',
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is ${otp}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).json({ message: 'Error sending OTP email' });
      } else {
        return res.status(200).json({ message: 'Registration successful, OTP sent!' });
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});
module.exports = router;
