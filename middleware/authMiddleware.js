const jwt = require('jsonwebtoken');
const User = require('../module/Users/UserModel'); // Đảm bảo đường dẫn chính xác

// Middleware xác thực người dùng
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access Denied! No token provided.' });
  }

  try {
    // Verify token
    console.log("Received token:", token); // In ra token để kiểm tra
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("Decoded user ID from token:", decoded.userId); // Đặt sau khi giải mã token

    // Tìm người dùng với ID đã được giải mã từ token
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại.' });
    }

    req.user = user; // Lưu người dùng đã xác thực vào req để sử dụng sau này
    next(); // Chuyển sang middleware/handler tiếp theo
  } catch (error) {
    console.error("Token verification failed:", error.message); // In lỗi chi tiết để dễ dàng debug
    return res.status(403).json({ message: 'Invalid token!' });
  }
};

module.exports = authenticateToken;
