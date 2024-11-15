var express = require('express');
var router = express.Router();
var GenreController = require('../module/Genres/GenreController')

router.post('/add', async function(req, res, next) {
    try {
        const {name,description}=req.body;
        const genre = await GenreController.add(name,description);
        res.status(200).json(genre)
    } catch (error) {
        res.status(414).json({status:"false" } );
    }
  });
  router.get('/getAll', async function (req, res) {
    try {
        const genre = await GenreController.getAll()
        return res.status(200).json(genre)

    } catch (error) {
        console.log(error);
        res.status(500).json({error:error.message} );
    }
})
  router.get('/getDelete', async function (req, res) {
    try {
        const genre = await GenreController.getDelete()
        return res.status(200).json(genre)

    } catch (error) {
        console.log(error);
        res.status(500).json({error:error.message} );
    }
})
router.post('/delete', async function (req, res) {
    try {

        const { _id } = req.body;
        let genre;
        genre = await GenreController.remove(_id);
        res.status(200).json({ status: 'true' ,message:'Xóa Thành công'})
    } catch (error) {
        console.log(error);
        res.status(414).json({ status: 'false',message:error.message});
    }
})
router.post('/revert', async function (req, res) {
    try {

        const { _id } = req.body;
        let genre;
        genre = await GenreController.revert(_id);
        res.status(200).json({ status: 'true' ,message:'Hoàn xóa Thành công'})
    } catch (error) {
        console.log(error);
        res.status(414).json({ status: 'false',message:error.message});
    }
})
router.get('/getDetail', async function (req, res) {
    try {
        const {_id}= req.query
        const movie = await GenreController.getDetail(_id)
        return res.status(200).json(movie)

    } catch (error) {
        console.log(error);
        res.status(500).json({error:error.message} );
    }
})
router.post('/update', async function (req, res) {
    try {

        const { _id, name, description } = req.body;
        const genre = await GenreController.update(_id, name,description)

        res.status(200).json({ status: 'true', genre: genre })
    } catch (error) {
        console.log(error);
        res.status(414).json({ status: 'false', error: error.message });
    }
})
module.exports = router;