var express = require('express');
var router = express.Router();
var MovieController = require('../module/Movies/MovieController')

router.post('/add', async function(req, res, next) {
    try {
        const {name,duration,release_date,trailer,images,description,rating,genreId}=req.body;
        const movie = await MovieController.add(name,duration,release_date,trailer,images,description,rating,genreId);
        res.status(200).json(movie)
    } catch (error) {
        res.status(414).json({status:"false" } );
    }
  });

  router.get('/getAll', async function (req, res) {
    try {
        const movie = await MovieController.getAll()
        res.status(200).json(movie)

    } catch (error) {
        console.log(error);
        res.status(414).json({status:"false" } );
    }
})
router.get('/getDetail', async function (req, res) {
    try {
        const {_id} =req.query
        const movie = await MovieController.getDetail(_id)
        res.status(200).json(movie)

    } catch (error) {
        console.log(error);
        res.status(414).json({status:"false" } );
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

        const {_id,name,duration,release_date,trailer,images,description,rating,genreId} = req.body;
        const movie= await MovieController.update(_id,name,duration,release_date,trailer,images,description,rating,genreId)
       
        res.status(200).json({ status: 'true', movie:{_id,name,duration,release_date,trailer,images,description,rating,genreId} })
    } catch (error) {
        console.log(error);
        res.status(414).json({ status: 'false', error:'Không thể sửa chữa' });
    }
})
router.get('/delete', async function (req, res) {
    try {

        const { _id } = req.query;
        let movie;
        movie = await MovieController.remove(_id);
        res.status(200).json({ status: 'true' ,message:'Xóa Thành công'})
    } catch (error) {
        console.log(error);
        res.status(414).json({ status: 'false',message:"Xóa thất bại" });
    }
})

module.exports = router;