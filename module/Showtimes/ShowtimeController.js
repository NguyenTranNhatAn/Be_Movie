
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
                    roomName: room?.name
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


const getShowtimeTimeRangesByDay = async (movieId, day) => {
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

        const showtimes = await ShowtimeModel.find({
            movieId: movieId,
            day: { $gte: startDate, $lte: endDate }
        });

        // Set to track used time ranges
        const usedTimeRanges = new Set();

        // Filter showtimes by time range
        showtimes.forEach(showtime => {
            const showtimeHour = new Date(showtime.startTime).getUTCHours();
            timeRanges.forEach(range => {
                if (showtimeHour >= range.start && showtimeHour < range.end) {
                    usedTimeRanges.add(range);
                }
            });
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









module.exports = { add ,getMovieShowtime,getBrandByShowtime,getCinemasByTimeRangeBrandAndMovie,getShowtimeTimeRangesByDay}