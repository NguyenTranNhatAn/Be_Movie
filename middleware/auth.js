// // D:\Be_Movie\middleware\auth.js
// const jwt = require('jsonwebtoken');

// const auth = (req, res, next) => {
//     const token = req.header('Authorization')?.replace('Bearer ', '');

//     if (!token) {
//         return res.status(401).json({ message: 'Token không hợp lệ.' });
//     }

//     try {
//         const verified = jwt.verify(token, process.env.JWT_SECRET);
//         req.user = verified; // Lưu thông tin người dùng vào req
//         next();
//     } catch (error) {
//         res.status(401).json({ message: 'Token không hợp lệ.' });
//     }
// };

// module.exports = auth;
