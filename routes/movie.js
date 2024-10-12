var express = require('express');
var router = express.Router();
var MovieController = require('../module/Movies/MovieController')

router.post('/add', async function(req, res, next) {
    try {
        const {name,duration,release_date,trailer,images,description,rating,genreId}=req.body;
        const movie = await MovieController.add(name,duration,release_date,trailer,images,description,rating,genreId);
        res.status(200).json(movie)
    } catch (error) {
        res.status(414).json({ movie: { name: null, parentId: null } });
    }
  });

  router.get('/getAll', async function (req, res) {
    try {
        const movie = await MovieController.getAll()
        res.status(200).json(movie)

    } catch (error) {
        console.log(error);
        res.status(414).json({ movie: { name: null, parentId: null } });
    }
})
module.exports = router;