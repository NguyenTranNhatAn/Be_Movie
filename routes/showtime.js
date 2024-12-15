var express = require('express');
var router = express.Router();
var ShowtimeController = require('../module/Showtimes/ShowtimeController');
const ShowTime = require('../models/ShowTime');

router.post('/add', async function (req, res, next) {
    try {
        const { movieId, roomId, startTime, endTime, day, } = req.body;
        const showtime = await ShowtimeController.add(movieId, roomId, startTime, endTime, day);
        res.status(200).json(showtime)
    } catch (error) {
        res.status(414).json({ status: "false", error: error });
    }
});

router.get('/getAll', async function (req, res) {
    try {
        const showtime = await ShowtimeController.getAll()
        res.status(200).json(showtime)

    } catch (error) {
        console.log(error);
        res.status(414).json({ status: "false" });
    }
})
router.get('/getMovieShowtime', async function (req, res) {
    try {
        const { movieId, day } = req.query;
        const showtimes = await ShowtimeController.getMovieShowtime(movieId, day);
        res.status(200).json(showtimes)

    } catch (error) {
        console.log(error);
        res.status(414).json({ status: "false" });
    }
})
router.get('/getByTime', async function (req, res) {
    try {
        const { movieId } = req.query;
        const showtimes = await ShowtimeController.getByMovie(movieId);
        res.status(200).json(showtimes)

    } catch (error) {
        console.log(error);
        res.status(414).json({ status: "false" });
    }
})
router.get('/getByMovie', async function (req, res) {
    try {
        const { movieId } = req.query;
        const showtimes = await ShowtimeController.getByMovie(movieId);
        res.status(200).json(showtimes)

    } catch (error) {
        console.log(error);
        res.status(414).json({ status: "false" });
    }
})
router.get('/getDetail', async function (req, res) {
    try {
        const { _id } = req.query;
        const showtimes = await ShowtimeController.getDetail(_id);
        res.status(200).json(showtimes)

    } catch (error) {
        console.log(error);
        res.status(414).json({ status: "false" });
    }
})
router.get('/showdays', async (req, res) => {
    try {
        const { movieId } = req.query;
        
        if (!movieId) {
            return res.status(400).json({ success: false, message: "movieId is required" });
        }
        
        const days = await ShowtimeController.getShowDays(movieId);
        res.status(200).json({ success: true, days });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching show days", error: error.message });
    }
});

router.get('/getBrandShowtime', async function (req, res) {
    try {
        const { movieId, day } = req.query;
        const showtimes = await ShowtimeController.getBrandByShowtime(movieId, day);
        res.status(200).json(showtimes)

    } catch (error) {
        console.log(error);
        res.status(414).json({ status: "false" });
    }
})
router.post('/update', async function (req, res) {
    try {

        const { _id, movieId, roomId, startTime, endTime, day, Room_Shape, seatTypes } = req.body;
        const showtime = await ShowtimeController.update(_id, movieId, roomId, startTime, endTime, day, Room_Shape, seatTypes)

        res.status(200).json({ status: 'true', showtime: showtime })
    } catch (error) {
        console.log(error);
        res.status(414).json({ status: 'false', error: error.message });
    }
})
router.get('/getCinemaMain', async function (req, res) {
    try {
        const { movieId, day, startHour, endHour, brandId } = req.query;
        const showtimes = await ShowtimeController.getCinemasByTimeRangeBrandAndMovie(movieId, day, startHour, endHour, brandId);
        res.status(200).json(showtimes)

    } catch (error) {
        console.log(error);
        res.status(414).json({ status: "false" });
    }
})
router.get('/getCondition', async function (req, res) {
    try {
        const { movieId, day, startHour, endHour, brandId } = req.query;
        const showtimes = await ShowtimeController.getByCondition(movieId, day, startHour, endHour, brandId);
        res.status(200).json(showtimes)

    } catch (error) {
        console.log(error);
        res.status(414).json({ status: "false" });
    }
})
router.get('/getFilterTime', async function (req, res) {
    try {
        const { movieId, day,brandId } = req.query;
        const showtimes = await ShowtimeController.getShowtimeTimeRangesByDay(movieId, day,brandId);
        res.status(200).json(showtimes)

    } catch (error) {
        console.log(error);
        res.status(414).json({ status: "false" });
    }
})
module.exports = router;