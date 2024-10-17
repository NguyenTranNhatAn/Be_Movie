var express = require('express');
var router = express.Router();
var UserController = require('../module/Users/UserController');
var UserModel = require('../module/Users/UserModel');
var nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');

// Nodemailer setup
let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'danhluong2k4@gmail.com',
    pass: 'ukbx zbqk uspj xfxu'
  }
});

// Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Register API with OTP
router.post('/register', async (req, res) => {
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
module.exports = router;
