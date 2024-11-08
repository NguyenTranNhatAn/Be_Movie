const express = require("express");
const router = express.Router();
const PayOS = require("@payos/node");
const Ticket = require("../models/Ticket"); // Đảm bảo đường dẫn tới mô hình Ticket
const QRCode = require("qrcode");
const payOS = new PayOS(
  process.env.PAYOS_CLIENT_ID,
  process.env.PAYOS_API_KEY,
  process.env.PAYOS_CHECKSUM_KEY
);
//API thanh toán payos với tạo ticket
//API thanh toán payos với tạo ticket
router.post("/create", async function (req, res) {
  const {
    description,
    returnUrl,
    cancelUrl,
    amount,
    showtimeId,
    seats,
    cinemaName,
    roomName,
    showTime,
    showDate,
    movieName,
    userId,
    movieId // Add movieId here
  } = req.body;

  // Tạo mã orderCode duy nhất cho giao dịch
  const orderCode = Number(String(new Date().getTime()).slice(-6));

  // Dữ liệu để tạo liên kết thanh toán trên PayOS
  const paymentData = {
    orderCode: orderCode,
    amount,
    description,
    cancelUrl,
    returnUrl
  };

  try {
    // Tạo liên kết thanh toán với PayOS
    const paymentLinkRes = await payOS.createPaymentLink(paymentData);

    // Tính tổng tiền và tạo thông tin ghế
    let totalPrice = 0;
    const seatDetails = seats.map(seat => {
      const { seatName, price } = seat;
      totalPrice += price;
      return `${seatName} ${price.toLocaleString()}₫`;
    });

    // Khởi tạo vé mới với trạng thái ban đầu là pending
    const newTicket = new Ticket({
      showtimeId,
      seatDetails,
      totalPrice,
      cinemaName,
      roomName,
      showTime,
      showDate,
      movieName,
      userId,
      movieId, // Add movieId here
      status: "pending",
      orderCode: orderCode
    });

    // Tạo mã QR cho vé
    const qrData = `Ticket ID: ${newTicket._id}, User: ${userId}, Movie: ${movieName}, Seats: ${seatDetails.join(', ')}`;
    newTicket.qrCode = await QRCode.toDataURL(qrData);

    // Lưu vé vào cơ sở dữ liệu
    const savedTicket = await newTicket.save();

    // Trả về checkoutUrl để người dùng truy cập thanh toán
    return res.json({
      error: 0,
      message: "Vé đã được tạo thành công. Chuyển đến thanh toán.",
      data: {
        ticketId: savedTicket._id,
        seatDetails: savedTicket.seatDetails,
        totalPrice: savedTicket.totalPrice,
        qrCode: savedTicket.qrCode,
        checkoutUrl: paymentLinkRes.checkoutUrl,
        orderCode: orderCode
      }
    });
  } catch (error) {
    console.log("Error creating ticket or payment link:", error);
    return res.json({
      error: -1,
      message: "Không thể tạo vé hoặc liên kết thanh toán.",
      data: null
    });
  }
});


router.post("/webhook", async (req, res) => {
  try {
    console.log("Webhook received:", req.body); // Thêm dòng này để xem dữ liệu webhook
    const { orderCode, status } = req.body;

    // Kiểm tra trạng thái thanh toán
    if (status === "success") {
      // Tìm và cập nhật trạng thái vé với orderCode tương ứng
      const ticket = await Ticket.findOneAndUpdate(
        { orderCode: orderCode },
        { status: "paid" },
        { new: true } // Trả về vé đã được cập nhật
      );

      if (!ticket) {
        return res.status(404).json({ message: "Không tìm thấy vé với mã orderCode này" });
      }

      return res.json({
        error: 0,
        message: "Trạng thái đã được cập nhật thành paid",
        data: ticket,
      });
    } else {
      // Nếu thanh toán thất bại, trả về thông báo lỗi
      return res.json({
        error: -1,
        message: "Thanh toán thất bại hoặc trạng thái không hợp lệ",
        data: null,
      });
    }
  } catch (error) {
    console.error("Lỗi khi xử lý webhook:", error);
    return res.status(500).json({
      error: -1,
      message: "Lỗi khi xử lý webhook",
      data: null,
    });
  }
});
// API để cập nhật trạng thái thanh toán
router.post("/update-payment-status", async (req, res) => {
  const { orderCode } = req.body;

  try {
    // Tìm vé theo orderCode và cập nhật trạng thái
    const ticket = await Ticket.findOneAndUpdate(
      { orderCode: orderCode },
      { status: "paid" },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ message: "Không tìm thấy vé với mã orderCode này" });
    }

    return res.json({
      error: 0,
      message: "Trạng thái đã được cập nhật thành paid",
      data: ticket,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái thanh toán:", error);
    return res.status(500).json({
      error: -1,
      message: "Lỗi khi cập nhật trạng thái thanh toán",
    });
  }
});



/*
router.post("/create", async function (req, res) {
  const { description, returnUrl, cancelUrl, amount } = req.body;
  const body = {
    orderCode: Number(String(new Date().getTime()).slice(-6)),
    amount,
    description,
    cancelUrl,
    returnUrl
  };

  try {
    const paymentLinkRes = await payOS.createPaymentLink(body);

    return res.json({
      error: 0,
      message: "Success",
      data: {
        bin: paymentLinkRes.bin,
        checkoutUrl: paymentLinkRes.checkoutUrl,
        accountNumber: paymentLinkRes.accountNumber,
        accountName: paymentLinkRes.accountName,
        amount: paymentLinkRes.amount,
        description: paymentLinkRes.description,
        orderCode: paymentLinkRes.orderCode,
        qrCode: paymentLinkRes.qrCode,
      },
    });
  } catch (error) {
    console.log("Error creating payment link:", error);
    return res.json({
      error: -1,
      message: "fail",
      data: null,
    });
  }
});
*/


router.get("/:orderId", async function (req, res) {
  try {
    const order = await payOS.getPaymentLinkInfomation(req.params.orderId);
    if (!order) {
      return res.json({
        error: -1,
        message: "failed",
        data: null,
      });
    }
    return res.json({
      error: 0,
      message: "ok",
      data: order,
    });
  } catch (error) {
    console.log(error);
    return res.json({
      error: -1,
      message: "failed",
      data: null,
    });
  }
});

router.put("/:orderId", async function (req, res) {
  try {
    const { orderId } = req.params;
    const body = req.body;
    const order = await payOS.cancelPaymentLink(orderId, body.cancellationReason);
    if (!order) {
      return res.json({
        error: -1,
        message: "failed",
        data: null,
      });
    }
    return res.json({
      error: 0,
      message: "ok",
      data: order,
    });
  } catch (error) {
    console.error(error);
    return res.json({
      error: -1,
      message: "failed",
      data: null,
    });
  }
});

router.post("/confirm-webhook", async (req, res) => {
  const { webhookUrl } = req.body;
  try {
    await payOS.confirmWebhook(webhookUrl);
    return res.json({
      error: 0,
      message: "ok",
      data: null,
    });
  } catch (error) {
    console.error(error);
    return res.json({
      error: -1,
      message: "failed",
      data: null,
    });
  }
});

module.exports = router;
