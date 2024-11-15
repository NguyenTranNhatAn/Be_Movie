var express = require('express');
var router = express.Router();
var UserController = require('../module/Users/UserController');
const jwt = require('jsonwebtoken');
var UserModel = require('../module/Users/UserModel');
var nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');

// Nodemailer setup
let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'nan22052004@gmail.com',
    pass: 'ukbx zbqk uspj xfxu'
  }
});

// Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
router.get('/getAll', async function (req, res) {
  try {
      const user = await UserController.getAll()
      res.status(200).json( user )

  } catch (error) {
      console.log(error);
      res.status(414).json({ user: { name: null, cat_id: null } });
  }
})
router.post('/register', async function (req, res) {
  try {
    const { name, phone, email, password,address } = req.body;
  var status="true";
  var mess;
  user = await UserController.register(name, phone ,email, password,address);
  res.status(200).json({ status: status,user:user })
  } catch (error) {
    mess ='Đăng kí không thành công'
    console.log(error);
    res.status(414).json({status:"false" } ); 
  }
  

})
// Register API with OTP
router.post('/registerDanh', async (req, res) => {
  try {
    const { name, email, phone, password, address } = req.body;
    let otp = generateOTP();

    // Check if the user already exists
    let existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // 2. Hash mật khẩu
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    // Create a new user
    let newUser = new UserModel({
      name,
      email,
      phone,
      password: hash,
      address,
      otp
    });

    await newUser.save();

    // Send OTP email
    let mailOptions = {
      from: 'danhluong2k4@gmail.com',
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
router.post('/verify_otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    let user = await UserModel.findOne({ email, otp });

    if (!user) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    user.isVerified = true;
    await user.save();

    return res.status(200).json({ message: 'OTP verified successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});




/* GET users listing. */




router.post('/login', async function (req, res) {
  try {

    const { email, password } = req.body;
    var user;
    user = await UserController.login(email, password);
    if (!user) {
      res.status(414).json({ status: 'false', user: user })
    }
    else {
      res.status(200).json({ status: 'true', user: user })
    }

  } catch (error) {
    console.log(error);
    res.status(414).json({ status: "false" });
  }
})

router.post('/update', async function (req, res) {
  try {

    const { _id, name, email, address, phone } = req.body;
    let user;
    user = await UserController.update(_id, name, email, address, phone);
    res.status(200).json({ status: 'true', user: user })
  } catch (error) {
    console.log(error);
    res.status(414).json({ status: 'false' });
  }
})
router.post('/updateUser', async function (req, res) {
  try {
    const { _id, name, email, address, phone } = req.body;

    // Gọi hàm updateUser từ controller
    const user = await UserController.updateUser(_id, name, email, address, phone);

    return res.status(200).json({ status: true, user: user });
  } catch (error) {
    console.log(error);
    // Trả về lỗi nếu có vấn đề xảy ra trong quá trình cập nhật
    return res.status(500).json({ status: false, error: error.message });
  }
});
router.get('/getWishList', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
      return res.status(401).json({ message: 'Token không hợp lệ.' });
  }

  try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await UserModel.findById(decoded.id).select('-password'); // Không trả mật khẩu
      if (!user) {
          return res.status(404).json({ message: 'Người dùng không tồn tại.' });
      }
      const wishlist = await UserController.getWishList(decoded.id)
      console.log(wishlist)
      res.status(200).json(wishlist.wishlist)

  } catch (error) {
      res.status(500).json({ message: 'Có lỗi xảy ra.', error: error.message });
  }
});
module.exports = router;
