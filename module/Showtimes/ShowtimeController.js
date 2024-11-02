
const ShowtimeModel = require("./ShowtimeModel");



const getAll = async () => {
    try {
        const showtimes = await ShowtimeModel.find({});
        return showtimes;
    } catch (error) {
        console.log(error);
    }

}

const add = async (movieId, roomId, startTime, endTime, day, Room_Shape,) => {
    const showtime = new ShowtimeModel({ movieId, roomId, startTime, endTime, day, Room_Shape });
    await showtime.save()
    return showtime;
}
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
                brandCount[brandId] = { name: brandName, count: 1,logo:brandLogo };
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
                    model: 'brand'  // Populate brand details inside cinema
                },
                match: brandId ? { brandId: brandId } : {} // Filter by brandId if present
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
                            ...cinema.toObject(),  // Convert Mongoose document to plain JS object to allow direct modifications
                           
                        },
                        showtimes: []
                    };
                }
                acc[cinema._id].showtimes.push({
                    startTime: showtime.startTime,
                    endTime: showtime.endTime,
                    roomName: room?.name // Add room name to each showtime
                });
            }
            return acc;
        }, {});

        const cinemas = Object.values(cinemasMap);

        return cinemas;
    } catch (error) {
        console.error(error);
        throw new Error('Lỗi khi lấy danh sách rạp chiếu');
    }
};


const getShowtimeTimeRangesByDay = async (movieId, day) => {
    try {
        const startDate = new Date(day);
        const endDate = new Date(day);
        startDate.setUTCHours(0, 0, 0, 0);
        endDate.setUTCHours(23, 59, 59, 999);

        // Định nghĩa các khoảng thời gian
        const timeRanges = [
            { label: '16:00 - 19:00', start: 9, end: 12 },
            { label: '19:00 - 22:00', start: 12, end: 15 },
            { label: '22:00 - 1:00', start: 15, end: 18 },
            { label: '1:00 - 4:00', start: 18, end: 21 },
            { label: '4:00 - 7:00', start: 21, end: 24 },
            { label: '7:00 - 10:00', start: 0, end: 3 },
            { label: '10:00 - 12:00', start: 3, end: 5 },
            { label: '12:00 - 16:00', start: 5, end: 9 },
        ];

        const showtimes = await ShowtimeModel.find({
            movieId: movieId,
            day: { $gte: startDate, $lte: endDate }
        });

        // Tạo một mảng để lưu các khoảng thời gian đã sử dụng
        const usedTimeRanges = new Set();

        // Lọc các suất chiếu theo khoảng thời gian
        showtimes.forEach(showtime => {
            const showtimeHour = new Date(showtime.startTime).getUTCHours();
            timeRanges.forEach(range => {
                if (showtimeHour >= range.start && showtimeHour < range.end) {
                    usedTimeRanges.add(range);
                }
            });
        });

        // Chuyển Set thành mảng
        return Array.from(usedTimeRanges);
    } catch (error) {
        console.error(error);
        throw new Error('Lỗi khi lấy danh sách khoảng thời gian suất chiếu');
    }
};









module.exports = { add ,getMovieShowtime,getBrandByShowtime,getCinemasByTimeRangeBrandAndMovie,getShowtimeTimeRangesByDay}