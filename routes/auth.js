// routes/user.js
const express = require('express');
const bcrypt = require('bcryptjs');
const twilio = require('twilio'); // Thêm dòng này để import Twilio
const User = require('../module/Users/UserModel');
const router = express.Router();

// // Cấu hình Twilio
// const accountSid = 'AC347e48c86c7627644cad8f7f7d7078da'; // Thay thế với Account SID của bạn
// const authToken = 'b3aa72f3a46436044e26a28004666be6'; // Thay thế với Auth Token của bạn
// const twilioClient = twilio(accountSid, authToken);

// // Hàm gửi SMS
// async function sendSMS(phone, message) {
//     try {
//         const messageResponse = await twilioClient.messages.create({
//             body: message,
//             from: '+18018459679', // Số điện thoại Twilio của bạn
//             to: phone,
//         });
//         return messageResponse;
//     } catch (error) {
//         console.error('Lỗi khi gửi tin nhắn:', error);
//         throw error;
//     }
// }

// // API gửi OTP
// router.post('/register', async (req, res) => {
//     const { phone } = req.body;

//     // Tạo mã OTP
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();

//     try {
//         // Gửi OTP qua SMS
//         const smsResponse = await sendSMS(phone, `Mã OTP của bạn là: ${otp}`);
        
//         if (smsResponse.sid) {
//             res.status(200).json({ message: 'OTP đã được gửi!', otp: otp }); // Gửi lại OTP cho dễ kiểm tra
//         } else {
//             res.status(400).json({ message: 'Không thể gửi OTP.', error: smsResponse.error });
//         }
//     } catch (error) {
//         res.status(500).json({ message: 'Có lỗi xảy ra.', error: error.message });
//     }
// });

module.exports = router;
