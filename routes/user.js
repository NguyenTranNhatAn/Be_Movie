var express = require('express');
var router = express.Router();
var UserController = require('../module/Users/UserController')
/* GET users listing. */

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
router.post('/login', async function (req, res) {
  try {

    const { email, password } = req.body;
    var user;
    user = await UserController.login(email, password);
    if(!user)
    {
      res.status(414).json({ status: 'false', user: user })
    }
    else{
      res.status(200).json({ status: 'true', user: user })
    }
   
  } catch (error) {
    console.log(error);
    res.status(414).json({status:"false" } );
  }
})

router.post('/update', async function (req, res) {
  try {

      const {_id,name,email,address,phone} = req.body;
      let user;
      user = await UserController.update(_id,name,email,address,phone);
      res.status(200).json({ status: 'true',user:user})
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
