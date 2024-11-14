const express = require("express");
const router = express.Router();
const PayOS = require("@payos/node");
const Ticket = require("../models/Ticket"); // Đảm bảo đường dẫn tới mô hình Ticket
const ShowTime = require("../models/ShowTime");
const QRCode = require("qrcode");
const payOS = new PayOS(
  process.env.PAYOS_CLIENT_ID,
  process.env.PAYOS_API_KEY,
  process.env.PAYOS_CHECKSUM_KEY
);
//API thanh toán payos với tạo ticket
/*
router.post("/create", async function (req, res) {
  const {
    description,
    returnUrl,
    cancelUrl,
    amount,
    showtimeId,
    seats, // Danh sách ghế với tên và giá
    cinemaName,
    roomName,
    showTime,
    showDate,
    movieName,
    userId,
    movieId,
    combos // Thêm combos với comboId và quantity nếu có
  } = req.body;

  const orderCode = Number(String(new Date().getTime()).slice(-6));

  const paymentData = {
    orderCode: orderCode,
    amount,
    description,
    cancelUrl,
    returnUrl
  };

  try {
    const paymentLinkRes = await payOS.createPaymentLink(paymentData);

    // Lưu danh sách ghế vào seatsDetails và tổng giá vào totalPrice
    const seatsDetails = seats.map(seat => ({
      seatName: seat.seatName,
      price: seat.price
    }));
    const totalPrice = amount; // Sử dụng trực tiếp amount làm tổng giá

    const comboDetails = combos.map(combo => ({
      comboId: combo.comboId,
      quantity: combo.quantity
    }));

    const newTicket = new Ticket({
      showtimeId,
      seatsDetails, // Lưu chi tiết ghế vào seatsDetails
      totalPrice, // Lưu tổng giá
      cinemaName,
      roomName,
      showTime,
      showDate,
      movieName,
      userId,
      movieId,
      combos: comboDetails, // Lưu combo với comboId và quantity
      status: "pending",
      orderCode: orderCode
    });

    //const qrData = `Ticket ID: ${newTicket._id}, User: ${userId}, Movie: ${movieName}, Seats: ${seatsDetails.map(seat => seat.seatName).join(', ')}`;
    const qrData = `Ticket ID: ${newTicket._id}`;
    newTicket.qrCode = await QRCode.toDataURL(qrData);

    const savedTicket = await newTicket.save();

    return res.json({
      error: 0,
      message: "Vé đã được tạo thành công. Chuyển đến thanh toán.",
      data: {
        ticketId: savedTicket._id,
        seatsDetails: savedTicket.seatsDetails,
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
*/
const moment = require("moment");

router.post("/create", async function (req, res) {
  const {
    description,
    returnUrl,
    cancelUrl,
    amount,
    showtimeId,
    seats, // Danh sách ghế với tên và giá
    cinemaName,
    roomName,
    showTime,
    showDate, // Ngày chiếu phim cần định dạng lại
    movieName,
    userId,
    movieId,
    combos // Thêm combos với comboId và quantity nếu có
  } = req.body;

  const orderCode = Number(String(new Date().getTime()).slice(-6));

  const paymentData = {
    orderCode: orderCode,
    amount,
    description,
    cancelUrl,
    returnUrl
  };

  try {
    const paymentLinkRes = await payOS.createPaymentLink(paymentData);

    // Định dạng ngày showDate thành dạng Date hợp lệ
    const formattedShowDate = moment(showDate, "DD/MM/YY").toDate();

    // Lưu danh sách ghế vào seatsDetails và tổng giá vào totalPrice
    const seatsDetails = seats.map(seat => ({
      seatName: seat.seatName,
      price: seat.price
    }));
    const totalPrice = amount; // Sử dụng trực tiếp amount làm tổng giá

    const comboDetails = combos.map(combo => ({
      comboId: combo.comboId,
      quantity: combo.quantity
    }));

    // Lưu vé mới vào cơ sở dữ liệu trước khi tạo mã QR
    const newTicket = new Ticket({
      showtimeId,
      seatsDetails, // Lưu chi tiết ghế vào seatsDetails
      totalPrice, // Lưu tổng giá
      cinemaName,
      roomName,
      showTime,
      showDate: formattedShowDate, // Định dạng lại showDate
      movieName,
      userId,
      movieId,
      combos: comboDetails, // Lưu combo với comboId và quantity
      status: "pending",
      orderCode: orderCode
    });

    // Lưu vé để có `_id`
    const savedTicket = await newTicket.save();

    // Tạo mã QR chỉ với `ticketId`
    const qrData = `Ticket ID: ${savedTicket._id}`;
    savedTicket.qrCode = await QRCode.toDataURL(qrData);

    // Lưu lại vé với mã QR
    await savedTicket.save();

    return res.json({
      error: 0,
      message: "Vé đã được tạo thành công. Chuyển đến thanh toán.",
      data: {
        ticketId: savedTicket._id,
        seatsDetails: savedTicket.seatsDetails,
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
// API để cập nhật trạng thái thanh toán
router.post("/update-payment-status", async (req, res) => {
  const { orderCode } = req.body;

  try {
    // Tìm vé theo mã orderCode
    const ticket = await Ticket.findOne({ orderCode: orderCode });

    if (!ticket) {
      return res.status(404).json({ message: "Không tìm thấy vé với mã orderCode này" });
    }

    // Tìm ShowTime dựa trên `showtimeId` của ticket để lấy `Room_Shape`
    const showTime = await ShowTime.findOne({ _id: ticket.showtimeId });

    if (!showTime) {
      return res.status(404).json({ message: "Không tìm thấy ShowTime cho showtimeId này" });
    }

    // Tách `Room_Shape` thành mảng ký tự và thay thế "P" thành "U"
    const updatedRoomShape = showTime.Room_Shape.split('').map(char => char === 'P' ? 'U' : char).join('');
    showTime.Room_Shape = updatedRoomShape;

    // Cập nhật trạng thái vé thành "paid"
    ticket.status = "paid";

    // Lưu lại các thay đổi
    await ticket.save();
    await showTime.save();

    return res.json({
      error: 0,
      message: "Trạng thái đã được cập nhật thành 'paid' và Room_Shape đã được thay đổi",
      data: {
        ticket,
        updatedRoomShape: showTime.Room_Shape
      },
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái thanh toán:", error);
    return res.status(500).json({
      error: -1,
      message: "Lỗi khi cập nhật trạng thái thanh toán",
    });
  }
});


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
