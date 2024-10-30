const PaymentModel = require("./PaymentModel");

// Xử lý yêu cầu thanh toán
async function createPayment(req, res) {
  const { amount, description } = req.body;

  try {
    const paymentResult = await PaymentModel.createOrder(amount, description);
    res.status(200).json({ success: true, data: paymentResult });
  } catch (error) {
    console.error("Payment error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { createPayment };
