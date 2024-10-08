var express = require('express');
var router = express.Router();
var UserController = require('../module/Users/UserController')
/* GET users listing. */

router.post('/api/register', async function (req, res) {
  try {

    const { name, phone, email, password } = req.body;
    var status="true";
    var mess;
  
  
    user = await UserController.register(name, phone ,email, password);

 
    res.status(200).json({ status: status,mess:mess })
  } catch (error) {
    mess ='Đăng kí không thành công'
    console.log(error);
    res.status(414).json({ status: 'false', user: user, mess:mess });
  }
})
router.post('/api/login', async function (req, res) {
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
    res.status(414).json({ status: 'false', user: user });
  }
})

module.exports = router;
