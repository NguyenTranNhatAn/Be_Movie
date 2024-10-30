const express = require("express");
const router = express.Router();
const PaymentController = require("../module/Payment/Paymentcontronler");

// Định nghĩa route POST /payment
router.post("/", PaymentController.createPayment);

module.exports = router;
