//D:\Be_Movie\routes\zaloPayRoutes.js
const express = require('express');
const router = express.Router();
const axios = require('axios').default;
const CryptoJS = require('crypto-js');
const moment = require('moment');
const qs = require('qs');

const config = {
  app_id: process.env.ZALOPAY_APP_ID,
  key1: process.env.ZALOPAY_KEY1,
  key2: process.env.ZALOPAY_KEY2,
  endpoint: 'https://sb-openapi.zalopay.vn/v2/create',
};

// API để tạo đơn hàng
router.post('/payment', async (req, res) => {
  const embed_data = {
    redirecturl: 'https://your-redirect-url.com',
  };

  const items = [];
  const transID = Math.floor(Math.random() * 1000000);

  const order = {
    app_id: config.app_id,
    app_trans_id: `${moment().format('YYMMDD')}_${transID}`,
    app_user: 'user123',
    app_time: Date.now(),
    item: JSON.stringify(items),
    embed_data: JSON.stringify(embed_data),
    amount: req.body.amount || 50000,
    callback_url: 'https://c070-171-252-189-233.ngrok-free.app/callback', // Thay URL này bằng URL ngrok mới
    description: `Thanh toán đơn hàng #${transID}`,
    bank_code: '',
  };

  const data = `${order.app_id}|${order.app_trans_id}|${order.app_user}|${order.amount}|${order.app_time}|${order.embed_data}|${order.item}`;
  order.mac = CryptoJS.HmacSHA256(data, config.key1).toString();

  try {
    const result = await axios.post(config.endpoint, null, { params: order });
    return res.status(200).json(result.data);
  } catch (error) {
    console.error('Error creating order:', error);
    return res.status(500).json({ error: 'Failed to create order', details: error.message });
  }
});

// API callback để xử lý phản hồi từ ZaloPay
router.post('/callback', (req, res) => {
  let result = {};
  try {
    const dataStr = req.body.data;
    const reqMac = req.body.mac;

    const mac = CryptoJS.HmacSHA256(dataStr, config.key2).toString();

    if (reqMac !== mac) {
      result.return_code = -1;
      result.return_message = 'MAC not matched';
    } else {
      result.return_code = 1;
      result.return_message = 'success';
      console.log('Transaction successful:', JSON.parse(dataStr));
    }
  } catch (ex) {
    console.error('Callback error:', ex);
    result.return_code = 0;
    result.return_message = ex.message;
  }

  res.json(result);
});

module.exports = router;
