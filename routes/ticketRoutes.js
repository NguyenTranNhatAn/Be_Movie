const express = require('express');
const Ticket = require('../models/Ticket'); // Đảm bảo đường dẫn đúng tới model
const router = express.Router();
const CryptoJS = require('crypto-js');
const axios = require('axios');
const QRCode = require('qrcode');

// API đặt vé
router.post('/book-ticket', async (req, res) => {
    try {
        const { showtimeId, seats, cinemaName, roomName, showTime, showDate, movieName, userId } = req.body;

        let totalPrice = 0;
        const seatDetails = seats.map(seat => {
            const { seatName, price } = seat;
            totalPrice += price;
            return `${seatName} ${price.toLocaleString()}₫`;
        });

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
            status: 'pending'
        });

        // Tạo dữ liệu mã QR
        const qrData = `Ticket ID: ${newTicket._id}, User: ${userId}, Movie: ${movieName}, Seats: ${seatDetails.join(', ')}`;
        newTicket.qrCode = await QRCode.toDataURL(qrData); // Tạo mã QR

        const savedTicket = await newTicket.save();

        res.status(201).json({
            ticketId: savedTicket._id,
            seatDetails: savedTicket.seatDetails,
            totalPrice: savedTicket.totalPrice,
            qrCode: savedTicket.qrCode, // Bao gồm mã QR trong phản hồi
            message: 'Vé đã được tạo thành công',
            amountToTransfer: `${totalPrice.toLocaleString()}₫`
        });
    } catch (error) {
        console.error('Lỗi khi đặt vé:', error);
        res.status(500).json({ message: 'Lỗi khi đặt vé' });
    }
});

// API callback xử lý sau khi thanh toán thành công
router.post('/callback', async (req, res) => {
    let result = {};
    try {
        const dataStr = req.body.data;
        const reqMac = req.body.mac;

        const mac = CryptoJS.HmacSHA256(dataStr, process.env.ZALOPAY_KEY2).toString();

        if (reqMac !== mac) {
            result.return_code = -1;
            result.return_message = 'MAC not matched';
        } else {
            const transactionData = JSON.parse(dataStr);
            if (transactionData.return_code === 1 && transactionData.sub_return_code === 1) {
                const ticketId = transactionData.app_trans_id;
                const ticket = await Ticket.findOneAndUpdate(
                    { _id: ticketId },
                    { status: 'paid' },
                    { new: true }
                );

                if (ticket) {
                    const qrData = `Ticket ID: ${ticket._id}, User: ${ticket.userId}, Movie: ${ticket.movieName}, Seats: ${ticket.seatDetails.join(', ')}`;
                    ticket.qrCode = await QRCode.toDataURL(qrData);
                    await ticket.save();
                }

                result.return_code = 1;
                result.return_message = 'success';
            } else {
                result.return_code = 0;
                result.return_message = 'Transaction failed';
            }
        }
    } catch (ex) {
        console.error('Callback error:', ex);
        result.return_code = 0;
        result.return_message = ex.message;
    }

    res.json(result);
});

// API để lấy tất cả các vé của một người dùng với hình ảnh phim và trạng thái
router.get("/all/:userId", async (req, res) => {

    const { userId } = req.params;

    try {
        // Lấy tất cả các vé thuộc về `userId` và populate `movieId` để lấy thông tin phim
        const tickets = await Ticket.find({ userId }).populate({
            path: 'movieId',
            select: 'name images', // Lấy tên phim và hình ảnh
        });

        // Định dạng dữ liệu vé theo yêu cầu
        const formattedTickets = tickets.map(ticket => {
            const today = new Date();
            const showDate = new Date(ticket.showDate);
            const daysDifference = Math.floor((showDate - today) / (1000 * 60 * 60 * 24));

            // Xác định trạng thái: số ngày còn lại hoặc "Hết hạn"
            const status = daysDifference > 0 ? `${daysDifference} ngày` : "Hết hạn";

            return {
                ticketId: ticket._id,
                movieName: ticket.movieName,
                movieImage: ticket.movieId && ticket.movieId.images && ticket.movieId.images.length > 0
                    ? ticket.movieId.images[0]
                    : null, // Kiểm tra trước khi lấy hình ảnh đầu tiên
                showDate: ticket.showDate,
                status: status,
                createdAt: ticket.createdAt,
                cinemaName: ticket.cinemaName,
                roomName: ticket.roomName,
                seatDetails: ticket.seatDetails,
                totalPrice: ticket.totalPrice
            };
        });
        console.log(formattedTickets)
        // Trả về dữ liệu vé đã được định dạng
        res.json({
            error: 0,
            message: "Lấy tất cả vé thành công.",
            data: formattedTickets
        });
    } catch (error) {
        console.log("Lỗi khi lấy vé:", error);
        res.status(500).json({
            error: -1,
            message: "Không thể lấy vé.",
            data: null
        });
    }
});
// API để lấy thông tin vé theo ticketId
router.get("/:ticketId", async (req, res) => {
    const { ticketId } = req.params;

    try {
        // Tìm vé theo `ticketId` và populate `movieId` để lấy thông tin phim
        const ticket = await Ticket.findById(ticketId).populate({
            path: 'movieId',
            select: 'name images', // Lấy tên phim và hình ảnh
        });

        if (!ticket) {
            return res.status(404).json({ message: "Vé không tồn tại" });
        }

        // Tính toán ngày hết hạn hoặc số ngày còn lại
        const today = new Date();
        const showDate = new Date(ticket.showDate);
        const daysDifference = Math.floor((showDate - today) / (1000 * 60 * 60 * 24));
        const status = daysDifference > 0 ? `${daysDifference} ngày` : "Hết hạn";

        // Định dạng dữ liệu vé
        const formattedTicket = {
            ticketId: ticket._id,
            movieName: ticket.movieName,
            movieImage: ticket.movieId.images[0] || null, // Lấy hình ảnh đầu tiên từ mảng images
            showDate: ticket.showDate,
            status: status,
            createdAt: ticket.createdAt,
            cinemaName: ticket.cinemaName,
            roomName: ticket.roomName,
            seatDetails: ticket.seatDetails,
            totalPrice: ticket.totalPrice,
            qrCode: ticket.qrCode
        };

        // Trả về thông tin vé
        res.json({
            error: 0,
            message: "Lấy thông tin vé thành công.",
            data: formattedTicket
        });
    } catch (error) {
        console.log("Lỗi khi lấy vé theo ticketId:", error);
        res.status(500).json({
            error: -1,
            message: "Không thể lấy thông tin vé.",
            data: null
        });
    }
});

module.exports = router;
