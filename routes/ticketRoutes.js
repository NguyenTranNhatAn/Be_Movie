const express = require('express');
const Ticket = require('../models/Ticket'); // Đảm bảo đường dẫn đúng tới model
const Room = require('../module/Rooms/RoomModel');
const ShowTime = require('../models/ShowTime');
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
//hàm lấy 
// Hàm khôi phục Room_Shape trong bảng ShowTime từ Room
// Hàm khôi phục nhiều ghế trong Room_Shape từ Room
const restoreMultipleSeats = async (roomId, showtimeId, seatsDetails) => {
    try {
        // 1. Lấy layout gốc từ bảng Room
        const room = await Room.findById(roomId);
        if (!room) throw new Error("Không tìm thấy phòng chiếu.");

        const originalRoomShape = room.roomShape; // Layout gốc
        const originalRows = originalRoomShape.split("/"); // Tách thành các hàng

        // 2. Lấy Room_Shape hiện tại từ bảng ShowTime
        const showtime = await ShowTime.findById(showtimeId);
        if (!showtime) throw new Error("Không tìm thấy suất chiếu.");

        let currentRows = showtime.Room_Shape.split("/"); // Tách thành các hàng hiện tại

        // 3. Lặp qua từng ghế trong seatsDetails và khôi phục
        seatsDetails.forEach(seat => {
            const seatName = seat.seatName;
            const rowIndex = seatName.charCodeAt(0) - 65; // Ví dụ: "A" -> 0, "B" -> 1
            const seatPosition = parseInt(seatName.slice(1)) - 1; // Ví dụ: "1" -> 0

            // Xác định vị trí ghế bỏ qua ký tự "_"
            let currentSeatIndex = 0;
            let actualSeatIndex = -1;

            for (let i = 0; i < currentRows[rowIndex].length; i++) {
                if (currentRows[rowIndex][i] !== "_") {
                    if (currentSeatIndex === seatPosition) {
                        actualSeatIndex = i;
                        break;
                    }
                    currentSeatIndex++;
                }
            }

            // Thay thế ghế bằng ký tự gốc nếu tìm thấy
            if (actualSeatIndex !== -1) {
                const originalChar = originalRows[rowIndex][actualSeatIndex];
                const currentRowArray = currentRows[rowIndex].split("");
                currentRowArray[actualSeatIndex] = originalChar;
                currentRows[rowIndex] = currentRowArray.join("");
            }
        });

        // 4. Cập nhật lại Room_Shape trong bảng ShowTime
        showtime.Room_Shape = currentRows.join("/");
        await showtime.save();

        console.log("Khôi phục các ghế thành công.");
        return showtime;
    } catch (error) {
        console.error("Lỗi khôi phục Room_Shape:", error.message);
        throw error;
    }
};


//hàm 
//API để hủy vé
router.put("/cancel-ticket/:ticketId", async (req, res) => {
    const { ticketId } = req.params;

    try {
        // Tìm vé theo ticketId và cập nhật trạng thái thành "canceled"
        const updatedTicket = await Ticket.findByIdAndUpdate(
            ticketId,
            { status: "canceled" },
            { new: true } // Trả về vé đã được cập nhật
        )
            .populate("roomId", "roomShape")   // Lấy thông tin phòng chiếu
            .populate("showtimeId", "Room_Shape"); // Lấy thông tin suất chiếu
        //tìm thêm room
        //tìm thêm showtime
        //logic là tìm ra seatName rồi so sanh với bảng room lấy ra vị trí , rồi cập nhật trên bảng showtime 

        if (!updatedTicket) {
            return res.status(404).json({
                error: 1,
                message: "Không tìm thấy vé.",
            });
        }

        // Khôi phục Room_Shape trong bảng ShowTime
        const { roomId, showtimeId, seatsDetails } = updatedTicket;
        const showtimeIdValue = showtimeId._id; // Lấy _id từ object populate
        const roomIdValue = roomId._id; // Lấy _id từ object populate
        // for (const seat of seatsDetails) {
        //     await restoreRoomShape(roomIdValue, showtimeIdValue, seat.seatName);
        // }
        await restoreMultipleSeats(roomId._id, showtimeId._id, seatsDetails);
        res.json({
            error: 0,
            message: "Hủy vé và khôi phục Room_Shape thành công.",
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
