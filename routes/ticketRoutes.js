const express = require('express');
const Ticket = require('../models/Ticket'); // Đảm bảo đường dẫn đúng tới model
const router = express.Router();
const CryptoJS = require('crypto-js');
const axios = require('axios');
const QRCode = require('qrcode');



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
// API để lấy tất cả các vé sắp chiếu (upcoming) của một người dùng
router.get("/upcoming/:userId", async (req, res) => {
    res.setHeader('Cache-Control', 'no-store'); // Không lưu bộ nhớ cache
    res.setHeader('Pragma', 'no-cache');
    const { userId } = req.params;

    try {
        const today = new Date();

        // Lấy vé có ngày chiếu trong tương lai, sắp xếp theo ngày tạo mới nhất
        const tickets = await Ticket.find({ userId, showDate: { $gt: today }, status: "paid" })
            .sort({ createdAt: -1 }) // Sắp xếp theo createdAt giảm dần
            .populate({
                path: 'movieId',
                select: 'name images', // Lấy tên và hình ảnh phim
            });

        const formattedTickets = tickets.map(ticket => {
            const showDate = new Date(ticket.showDate);
            const daysDifference = Math.floor((showDate - today) / (1000 * 60 * 60 * 24));

            return {
                ticketId: ticket._id,
                movieName: ticket.movieId ? ticket.movieId.name : "Unknown Movie",
                movieImage: ticket.movieId && ticket.movieId.images && ticket.movieId.images.length > 0
                    ? ticket.movieId.images[0]
                    : null,
                showDate: ticket.showDate,
                status: `${daysDifference} ngày`, // Số ngày còn lại
                createdAt: ticket.createdAt,
                cinemaName: ticket.cinemaName,
                roomName: ticket.roomName,
                seatDetails: ticket.seatDetails,
                totalPrice: ticket.totalPrice
            };
        });

        res.json({
            error: 0,
            message: "Lấy tất cả vé sắp chiếu thành công.",
            data: formattedTickets,
            newestTicket: formattedTickets.length > 0 ? formattedTickets[0] : null // Vé mới nhất
        });
    } catch (error) {
        console.log("Lỗi khi lấy vé sắp chiếu:", error);
        res.status(500).json({
            error: -1,
            message: "Không thể lấy vé sắp chiếu.",
            data: null
        });
    }
});

// API để lấy tất cả các vé đã chiếu (past) của một người dùng
router.get("/past/:userId", async (req, res) => {
    res.setHeader('Cache-Control', 'no-store'); // Không lưu bộ nhớ cache
    res.setHeader('Pragma', 'no-cache');
    const { userId } = req.params;

    try {
        const today = new Date();

        // Lấy vé đã chiếu, sắp xếp theo ngày tạo mới nhất
        const tickets = await Ticket.find({ userId, showDate: { $lt: today }, status: "paid" })
            .sort({ createdAt: -1 }) // Sắp xếp theo createdAt giảm dần
            .populate({
                path: 'movieId',
                select: 'name images', // Lấy tên và hình ảnh phim
            });

        const formattedTickets = tickets.map(ticket => ({
            ticketId: ticket._id,
            movieName: ticket.movieId ? ticket.movieId.name : "Unknown Movie",
            movieImage: ticket.movieId && ticket.movieId.images && ticket.movieId.images.length > 0
                ? ticket.movieId.images[0]
                : null,
            showDate: ticket.showDate,
            status: "Hết hạn", // Đã qua ngày chiếu
            createdAt: ticket.createdAt,
            cinemaName: ticket.cinemaName,
            roomName: ticket.roomName,
            seatDetails: ticket.seatDetails,
            totalPrice: ticket.totalPrice
        }));

        res.json({
            error: 0,
            message: "Lấy tất cả vé đã chiếu thành công.",
            data: formattedTickets,
            newestTicket: formattedTickets.length > 0 ? formattedTickets[0] : null // Vé mới nhất đã chiếu
        });
    } catch (error) {
        console.log("Lỗi khi lấy vé đã chiếu:", error);
        res.status(500).json({
            error: -1,
            message: "Không thể lấy vé đã chiếu.",
            data: null
        });
    }
});

// API để lấy tất cả các vé bị hủy (canceled) của một người dùng
router.get("/cancelled/:userId", async (req, res) => {
    res.setHeader('Cache-Control', 'no-store'); // Không lưu bộ nhớ cache
    res.setHeader('Pragma', 'no-cache');
    const { userId } = req.params;

    try {
        // Lấy tất cả vé với trạng thái "canceled"
        const tickets = await Ticket.find({ userId, status: "canceled" })
            .sort({ createdAt: -1 }) // Sắp xếp theo createdAt giảm dần
            .populate({
                path: 'movieId',
                select: 'name images', // Lấy tên và hình ảnh phim
            });

        const formattedTickets = tickets.map(ticket => ({
            ticketId: ticket._id,
            movieName: ticket.movieId ? ticket.movieId.name : "Unknown Movie",
            movieImage: ticket.movieId && ticket.movieId.images && ticket.movieId.images.length > 0
                ? ticket.movieId.images[0]
                : null,
            showDate: ticket.showDate,
            status: "Đã hủy", // Gắn cứng trạng thái là "Đã hủy"
            createdAt: ticket.createdAt,
            cinemaName: ticket.cinemaName,
            roomName: ticket.roomName,
            seatDetails: ticket.seatDetails,
            totalPrice: ticket.totalPrice
        }));

        res.json({
            error: 0,
            message: "Lấy tất cả vé đã hủy thành công.",
            data: formattedTickets
        });
    } catch (error) {
        console.log("Lỗi khi lấy vé đã hủy:", error);
        res.status(500).json({
            error: -1,
            message: "Không thể lấy vé đã hủy.",
            data: null
        });
    }
});
//API để hủy vé
router.put("/cancel-ticket/:ticketId", async (req, res) => {
    const { ticketId } = req.params;

    try {
        // Tìm vé theo ticketId và cập nhật trạng thái thành "canceled"
        const updatedTicket = await Ticket.findByIdAndUpdate(
            ticketId,
            { status: "canceled" },
            { new: true } // Trả về vé đã được cập nhật
        );

        if (!updatedTicket) {
            return res.status(404).json({
                error: 1,
                message: "Không tìm thấy vé.",
            });
        }

        res.json({
            error: 0,
            message: "Hủy vé thành công.",
            data: updatedTicket,
        });
    } catch (error) {
        console.error("Lỗi khi hủy vé:", error);
        res.status(500).json({
            error: -1,
            message: "Không thể hủy vé.",
        });
    }
});

// API để lấy thông tin vé theo ticketId
// router.get("/:ticketId", async (req, res) => {
//     const { ticketId } = req.params;

//     try {
//         // Tìm vé theo `ticketId` và populate `movieId` để lấy thông tin phim
//         const ticket = await Ticket.findById(ticketId).populate({
//             path: 'movieId',
//             select: 'name images', // Lấy tên phim và hình ảnh
//         });

//         if (!ticket) {
//             return res.status(404).json({ message: "Vé không tồn tại" });
//         }

//         // Tính toán ngày hết hạn hoặc số ngày còn lại
//         const today = new Date();
//         const showDate = new Date(ticket.showDate);
//         const daysDifference = Math.floor((showDate - today) / (1000 * 60 * 60 * 24));
//         const status = daysDifference > 0 ? `${daysDifference} ngày` : "Hết hạn";

//         // Định dạng dữ liệu vé
//         const formattedTicket = {
//             ticketId: ticket._id,
//             movieName: ticket.movieName,
//             movieImage: ticket.movieId.images[0] || null, // Lấy hình ảnh đầu tiên từ mảng images
//             showDate: ticket.showDate,
//             status: status,
//             createdAt: ticket.createdAt,
//             cinemaName: ticket.cinemaName,
//             roomName: ticket.roomName,
//             seatDetails: ticket.seatsDetails,
//             totalPrice: ticket.totalPrice,
//             qrCode: ticket.qrCode
//         };

//         // Trả về thông tin vé
//         res.json({
//             error: 0,
//             message: "Lấy thông tin vé thành công.",
//             data: formattedTicket
//         });
//     } catch (error) {
//         console.log("Lỗi khi lấy vé theo ticketId:", error);
//         res.status(500).json({
//             error: -1,
//             message: "Không thể lấy thông tin vé.",
//             data: null
//         });
//     }
// });
router.get("/:ticketId", async (req, res) => {
    const { ticketId } = req.params;

    try {
        // Tìm vé theo `ticketId` và populate các trường liên quan
        const ticket = await Ticket.findById(ticketId)
            .populate({
                path: 'movieId',
                select: 'name images', // Lấy tên phim và hình ảnh
            })
            .populate({
                path: 'combos.comboId',
                select: 'name price image' // Lấy tên và giá combo
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
            showTime: ticket.showTime,
            status: status,
            createdAt: ticket.createdAt,
            cinemaName: ticket.cinemaName,
            roomName: ticket.roomName,
            seatsDetails: ticket.seatsDetails,
            totalPrice: ticket.totalPrice,
            qrCode: ticket.qrCode,
            orderCode: ticket.orderCode,
            combos: ticket.combos.map(combo => ({
                comboName: combo.comboId.name,
                comboPrice: combo.comboId.price,
                quantity: combo.quantity,
                image: combo.comboId.image,
                totalComboPrice: combo.comboId.price * combo.quantity
            }))
        };

        // Trả về thông tin vé đầy đủ
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
