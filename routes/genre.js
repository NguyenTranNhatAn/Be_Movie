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
        const movie = await GenreController.getAll()
        return res.status(200).json(movie)

    } catch (error) {
        console.log(error);
        res.status(500).json({error:error.message} );
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

module.exports = router;