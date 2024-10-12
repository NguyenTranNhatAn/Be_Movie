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
module.exports = router;