
//const ShowtimeModel = require("./ShowtimeModel");
const { default: mongoose } = require("mongoose");
const ShowtimeModel = require("../../models/ShowTime");
const TypeseatControler= require("../../module/TypeSeat/TypeseatController");
const RoomController= require("../../module/Rooms/RoomController");
const TypeSeat = require('../../models/TypeSeat'); // Model TypeSeat
const getAll = async () => {
    try {
        const showtimes = await ShowtimeModel.find({});
        return showtimes;
    } catch (error) {
        console.log(error);
    }

}

const add = async (movieId, roomId, startTime, endTime, day, ) => {
    const room = await RoomController.getroomDetail(roomId);
    const Room_Shape= room.roomShape
    console.log(Room_Shape)
    const seatTypes= await TypeseatControler.getByCinemaId(room.cinemaId)
    
    const showtime = new ShowtimeModel({ movieId, roomId, startTime, endTime, day, Room_Shape, seatTypes});
    await showtime.save()
    return showtime;
}
const update = async (_id, movieId, roomId, startTime, endTime, day, Room_Shape, seatTypes) => {
    try {
        // Kiểm tra ID lịch chiếu
        const showtime = await ShowtimeModel.findById(_id);
        if (!showtime) {
            throw new Error('Không tìm thấy lịch chiếu');
        }

        // Kiểm tra startTime và endTime không bằng nhau
        if (startTime === endTime) {
            throw new Error('Thời gian bắt đầu và kết thúc không được trùng nhau');
        }

        // Kiểm tra nếu có lịch chiếu khác trùng ngày, phim, phòng và thời gian
        const conflictingShowtime = await ShowtimeModel.findOne({
            _id: { $ne: _id }, // Bỏ qua chính bản ghi hiện tại
            movieId,
            roomId,
            day,
            $or: [
                { startTime: { $lte: new Date(startTime) }, endTime: { $gte: new Date(startTime) } }, // startTime nằm trong khoảng
                { startTime: { $lte: new Date(endTime) }, endTime: { $gte: new Date(endTime) } }, // endTime nằm trong khoảng
                { startTime: { $gte: new Date(startTime) }, endTime: { $lte: new Date(endTime) } }, // Khoảng bị bao phủ
            ],
        });

        if (conflictingShowtime) {
            throw new Error('Đã tồn tại lịch chiếu khác trong khoảng thời gian này cho cùng phim và phòng');
        }

       

        // Cập nhật lịch chiếu
        showtime.movieId = movieId  ||showtime.movieId         ;
        showtime.roomId = roomId   ||showtime.roomId         ;
        showtime.startTime = startTime  || showtime.startTime   ;
        showtime.endTime = endTime|| showtime.endTime;
        showtime.day = day ||showtime.day;
        showtime.Room_Shape = Room_Shape ||showtime.Room_Shape ;
        showtime.seatTypes = seatTypes  ||showtime.seatTypes    ;

        await showtime.save();

        return showtime;
    } catch (error) {
        console.error('Lỗi khi cập nhật lịch chiếu:', error.message);
        throw new Error(error.message);
    }
};
const updateRoomShapeForShowtimes = async () => {
    try {
        // Lấy tất cả các showtime
        const showtimes = await ShowtimeModel.find({});

        // Duyệt qua từng showtime để cập nhật roomShape
        for (const showtime of showtimes) {
            // Lấy thông tin room tương ứng của showtime
            const room = await RoomController.getroomDetail(showtime.roomId);

            if (!room) {
                console.warn(`Không tìm thấy phòng cho showtime ID: ${showtime._id}`);
                continue;
            }

            // Cập nhật roomShape của showtime thành roomShape của room tương ứng
            showtime.Room_Shape = room.roomShape;

            // Lưu lại showtime đã cập nhật
            await showtime.save();
        }

        console.log('Cập nhật roomShape thành công cho tất cả showtime.');
    } catch (error) {
        console.error('Lỗi khi cập nhật roomShape cho các showtime:', error.message);
        throw new Error(error.message);
    }
};
const getMovieShowtime = async (movieId, day) => {
    try {
        const check = await ShowtimeModel.find({ movieId: movieId });
        if (!check) {
            throw new Error('Xuất chiếu không tìm thấy!');
        }
        const startDate = new Date(day);
        const endDate = new Date(day);
        endDate.setHours(23, 59, 59, 999);
        startDate.setHours(0, 0, 0, 0);
        const showtimes = await ShowtimeModel.find({
            movieId: movieId,
            day: {
              $gte: startDate,
              $lte: endDate,
            },
          });
          console.log(check)
        return showtimes;
    } catch (error) {
        //
        console.log(error);
    }
 
}

const getByMovie = async (movieId) => {
    try {
        const check = await ShowtimeModel.find({ movieId: movieId });
        if (!check) {
            throw new Error('Xuất chiếu không tìm thấy!');
        }
      
        const showtimes = await ShowtimeModel.find({ movieId: movieId});
          console.log(check)
        return showtimes;
    } catch (error) {
        console.log(error);
    }
 
}
const getBrandByShowtime = async (movieId, day) => {
    try {
        // Thiết lập thời gian bắt đầu và kết thúc trong ngày
        const startDate = new Date(day);
        const endDate = new Date(day);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        // Tìm kiếm showtime theo movieId và ngày
        const showtimes = await ShowtimeModel.find({
            movieId: movieId,
            day: {
                $gte: startDate,
                $lte: endDate,
            },
            
        })
        .populate({
            path: 'roomId',
            populate: {
                path: 'cinemaId',
                populate: {
                    path: 'brandId',
                    model: 'brand' // Đảm bảo 'brand' là tên model cho brand
                }
            }
        });

        if (showtimes.length === 0) {
            throw new Error('Không tìm thấy showtime cho phim và ngày này');
        }

        // Tạo một đối tượng để đếm số lần xuất hiện của mỗi brand
        const brandCount = {};

        // Duyệt qua showtimes và đếm các brand
        showtimes.forEach(showtime => {
            const brandId = showtime.roomId.cinemaId.brandId._id; // Giả sử brandId là ObjectId
            const brandName = showtime.roomId.cinemaId.brandId.name; // Giả sử brand có thuộc tính name
            const brandLogo=  showtime.roomId.cinemaId.brandId.logo;
            if (!brandCount[brandId]) {
                brandCount[brandId] = { name: brandName, count: 1,logo:brandLogo,brandId:brandId };
            } else {
                brandCount[brandId].count += 1;
            }
        });

        // Chuyển đổi đối tượng brandCount thành mảng kết quả
        const result = Object.values(brandCount);

        return result;
        
    } catch (error) {
        console.error(error);
        throw new Error('Lỗi khi lấy brand');
    }
};
const getByCondition = async (movieId, day, startHour, endHour, brandId) => {
    try {
        const startDate = day ? new Date(day).setUTCHours(0, 0, 0, 0) : undefined;
        const endDate = day ? new Date(day).setUTCHours(23, 59, 59, 999) : undefined;

        // Chuyển đổi startHour và endHour thành timestamp nếu có
        const startTime = startHour !== undefined ? new Date(day || Date.now()).setUTCHours(startHour, 0, 0, 0) : undefined;
        const endTime = endHour !== undefined ? new Date(day || Date.now()).setUTCHours(endHour, 0, 0, 0) : undefined;

        // Xây dựng query động
        const query = {};
        if (movieId) query.movieId = movieId;
        if (day) query.day = { $gte: startDate, $lte: endDate };
        if (startHour !== undefined || endHour !== undefined) {
            query.startTime = {};
            if (startTime) query.startTime.$gte = startTime; // Lọc lớn hơn hoặc bằng startHour
            if (endTime) query.startTime.$lte = endTime; // Lọc nhỏ hơn hoặc bằng endHour
        }

        // Thực hiện query với populate các thông tin liên quan
        const showtimes = await ShowtimeModel.find(query)
            .populate({
                path: 'roomId',
                populate: {
                    path: 'cinemaId',
                    model: 'cinema',
                    populate: {
                        path: 'brandId',
                        model: 'brand',
                    },
                },
            });

        if (showtimes.length === 0) {
            throw new Error('Không tìm thấy lịch chiếu theo yêu cầu');
        }

        // Lọc theo brandId nếu được cung cấp
        const filteredShowtimes = brandId
            ? showtimes.filter((showtime) => showtime.roomId?.cinemaId?.brandId?._id.toString() === brandId)
            : showtimes;

        // Kiểm tra nếu sau khi lọc không còn kết quả
        if (filteredShowtimes.length === 0) {
            throw new Error('Không tìm thấy lịch chiếu cho brandId yêu cầu');
        }

        // Chuyển đổi kết quả để trả về danh sách showtime đơn giản
        const formattedShowtimes = filteredShowtimes.map((showtime) => ({
            showtimeId: showtime._id,
            movieId: showtime.movieId,
            day: showtime.day,
            startTime: showtime.startTime,
            endTime: showtime.endTime,
            roomName: showtime.roomId?.name,
            cinemaName: showtime.roomId?.cinemaId?.name,
            brandName: showtime.roomId?.cinemaId?.brandId?.name,
        }));

        return formattedShowtimes;
    } catch (error) {
        console.error(error);
        throw  new Error('Lỗi khi lấy danh sách lịch chiếu');
    }}
const getWeekday= (date) => {
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return weekdays[new Date(date).getDay()];
}
const getDetail = async (_id) => {
    try {
        const showtime = await ShowtimeModel.findOne({ _id: _id });
        return showtime;
    } catch (error) {
        console.log(error);
    }
}
const getShowDays = async (movieId) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Đặt thời gian về 00:00:00 để so sánh chính xác

        const showDays = await ShowtimeModel.aggregate([
            {
                $match: {
                    movieId: new mongoose.Types.ObjectId(movieId), // Lọc theo movieId
                    day: { $gte: today } // Lọc các ngày >= hôm nay
                }
            },
            {
                $group: {
                    _id: "$day", // Nhóm theo ngày (day)
                }
            },
            {
                $sort: {
                    _id: 1 // Sắp xếp theo thứ tự tăng dần của ngày
                }
            }
        ]);

        // Trả về danh sách các ngày kèm thứ viết tắt
        return showDays.map((showDay, index) => ({
            date: showDay._id,
            day: getWeekday(showDay._id),
            id: index
        }));
    } catch (error) {
        console.error("Error fetching upcoming show days:", error);
        throw error;
    }
};






const getCinemasByTimeRangeBrandAndMovie = async (movieId, day, startHour, endHour, brandId) => {
    try {
        const startDate = new Date(day);
        const endDate = new Date(day);
        startDate.setUTCHours(0, 0, 0, 0);
        endDate.setUTCHours(23, 59, 59, 999);

        const startTime = startHour !== undefined ? new Date(day).setUTCHours(startHour, 0, 0, 0) : startDate.getTime();
        const endTime = endHour !== undefined ? new Date(day).setUTCHours(endHour, 0, 0, 0) : endDate.getTime();

        const showtimes = await ShowtimeModel.find({
            movieId: movieId,
            day: { $gte: startDate, $lte: endDate },
            startTime: { $gte: startTime, $lte: endTime }
        })
        .populate({
            path: 'roomId',
            populate: {
                path: 'cinemaId',
                model: 'cinema',
                populate: {
                    path: 'brandId',
                    model: 'brand'
                },
                match: brandId ? { brandId: brandId } : {}
            }
        });

        if (showtimes.length === 0) {
            throw new Error('Không tìm thấy rạp chiếu theo yêu cầu');
        }

        const cinemasMap = showtimes.reduce((acc, showtime) => {
            const cinema = showtime.roomId?.cinemaId;
            const room = showtime.roomId;
        
            if (cinema) {
                if (!acc[cinema._id]) {
                    acc[cinema._id] = {
                        cinema: {
                            ...cinema.toObject(),
                        },
                        showtimes: []
                    };
                }
                acc[cinema._id].showtimes.push({
                    startTime: showtime.startTime,
                    endTime: showtime.endTime,
                    roomId: room?._id,
                    roomName: room?.name,
                    showtimeId:showtime._id
                });
            }
            return acc;
        }, {});

        // Convert cinemasMap to an array and sort each cinema's showtimes by start time
        const cinemas = Object.values(cinemasMap).map(cinema => {
            cinema.showtimes.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
            return cinema;
        });

        return cinemas;
    } catch (error) {
        console.error(error);
        throw new Error('Lỗi khi lấy danh sách rạp chiếu');
    }
};


const getShowtimeTimeRangesByDay = async (movieId, day, brandId) => {
    try {
        const startDate = new Date(day);
        const endDate = new Date(day);
        startDate.setUTCHours(0, 0, 0, 0);
        endDate.setUTCHours(23, 59, 59, 999);

        // Define time ranges
        const timeRanges = [
            { label: '1:00 - 4:00', start: 18, end: 21 },
            { label: '4:00 - 7:00', start: 21, end: 24 },
            { label: '7:00 - 10:00', start: 0, end: 3 },
            { label: '10:00 - 12:00', start: 3, end: 5 },
            { label: '12:00 - 16:00', start: 5, end: 9 },
            { label: '16:00 - 19:00', start: 9, end: 12 },
            { label: '19:00 - 22:00', start: 12, end: 15 },
            { label: '22:00 - 1:00', start: 15, end: 18 },
        ];

        // Query showtimes
        const showtimes = await ShowtimeModel.find({
            movieId: movieId,
            day: { $gte: startDate, $lte: endDate }
        })
            .populate({
                path: 'roomId',
                populate: {
                    path: 'cinemaId',
                    model: 'cinema',
                    populate: {
                        path: 'brandId',
                        model: 'brand'
                    },
                    match: brandId ? { brandId: brandId } : {}
                }
            });

        // Set to track used time ranges
        const usedTimeRanges = new Set();

        // Filter showtimes by time range
        showtimes.forEach(showtime => {
            if (showtime.roomId?.cinemaId?.brandId) { // Ensure valid populated brandId
                const showtimeHour = new Date(showtime.startTime).getUTCHours();
                timeRanges.forEach(range => {
                    if (showtimeHour >= range.start && showtimeHour < range.end) {
                        usedTimeRanges.add(range);
                    }
                });
            }
        });

        // Convert Set to array, sort by label in ascending order, and return
        return Array.from(usedTimeRanges).sort((a, b) => {
            const [aStart] = a.label.split(' - ');
            const [bStart] = b.label.split(' - ');

            return aStart.localeCompare(bStart, undefined, { numeric: true });
        });
    } catch (error) {
        console.error(error);
        throw new Error('Error retrieving showtime time ranges');
    }
};










module.exports = { updateRoomShapeForShowtimes,add,update,getDetail ,getMovieShowtime,getBrandByShowtime,getCinemasByTimeRangeBrandAndMovie,getShowtimeTimeRangesByDay,getAll,getByMovie,getByCondition,getShowDays}
