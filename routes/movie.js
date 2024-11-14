var express = require('express');
var router = express.Router();
var MovieController = require('../module/Movies/MovieController');
const jwt = require('jsonwebtoken');
const { get } = require('mongoose');
const UserModel = require('../module/Users/UserModel');
const Movie = require('../module/Movies/MovieModel'); // Đường dẫn đến file chứa schema Movie

router.post('/add', async function (req, res, next) {
    try {
        const { name, duration, release_date, trailer, images, description, rating, genreId } = req.body;
        const movie = await MovieController.add(name, duration, release_date, trailer, images, description, rating, genreId);
        res.status(200).json(movie)
    } catch (error) {
        res.status(414).json({ status: "false" });
    }
});

router.get('/getAll', async function (req, res) {
    try {
        const movie = await MovieController.getAll()
        res.status(200).json(movie)

    } catch (error) {
        console.log(error);
        res.status(414).json({ status: "false" });
    }
})
router.get('/getDelete', async function (req, res) {
    try {
        const movie = await MovieController.getDelete()
        res.status(200).json(movie)

    } catch (error) {
        console.log(error);
        res.status(414).json({status:"false" } );
    }
})
router.get('/getDetail', async function (req, res) {
    try {
        const { _id } = req.query
        const movie = await MovieController.getDetail(_id)
        res.status(200).json(movie)

    } catch (error) {
        console.log(error);
        res.status(414).json({ status: "false" });
    }
})
router.get('/find', async function (req, res) {
    try {

        const { name } = req.query;
        var movie;
        movie = await MovieController.search(name);
        res.status(200).json(movie)

    } catch (error) {
        console.log(error);
        res.status(404).json({ status: 'false' });
    }
})
router.post('/update', async function (req, res) {
    try {

        const { _id, name, duration, release_date, trailer, images, description, rating, genreId } = req.body;
        const movie = await MovieController.update(_id, name, duration, release_date, trailer, images, description, rating, genreId)

        res.status(200).json({ status: 'true', movie: { _id, name, duration, release_date, trailer, images, description, rating, genreId } })
    } catch (error) {
        console.log(error);
        res.status(414).json({ status: 'false', error: 'Không thể sửa chữa' });
    }
})
router.post('/delete', async function (req, res) {
    try {

        const { _id } = req.body;
        let movie;
        movie = await MovieController.remove(_id);

        res.status(200).json({ status: 'true', message: 'Xóa Thành công' })
    } catch (error) {
        console.log(error);
        res.status(414).json({ status: 'false', message: error.message });
    }
})
router.post('/revert', async function (req, res) {
    try {

        const { _id } = req.body;
        let movie;
        movie = await MovieController.revert(_id);
        
        res.status(200).json({ status: 'true' ,message:'Khôi phục phim thành công'})
    } catch (error) {
        console.log(error);
        res.status(414).json({ status: 'false',message:error.message });
    }
})
// router.get('/addWishList', async function (req, res) {
//     try {

//         const { _id,movieId } = req.query;
//         const  user = await MovieController.addWishList(_id,movieId);
//         console.log(user)
//         res.status(200).json({ status: 'true' ,...user})
//     } catch (error) {
//         console.log(error);
//         res.status(414).json({ status: 'false',message:"Có lỗi" });
//     }
// })
router.get('/addWishList', async function (req, res) {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Bạn cần đăng nhập để thực hiện thao tác này.' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const getUser = await UserModel.findById(decoded.id).select('-password');

        const { movieId } = req.query;
        const user = await MovieController.addWishList(movieId, getUser._id);

        res.status(200).json({ status: 'true', ...user })
    } catch (error) {
        console.log(error);
        res.status(414).json({ status: 'false', message: "Có lỗi" });
    }
});
router.get('/:movieId', async function (req, res) {
    try {
        const movieId = req.params.movieId;
        const movie = await Movie.findById(movieId);
        if (!movie) {
            return res.status(404).json({ message: "Không tìm thấy bộ phim đó" });
        }
        res.json({ image: movie.images[0] });
    } catch (error) {
        res.status(500).json({ message: "BỊ lỗi khi lấy dữ liệu ảnh của phim", error })
    }
});
module.exports = router;