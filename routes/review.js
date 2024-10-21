var express = require('express');
var router = express.Router();
var ReviewController = require('../module/Reviews/ReviewController')

router.post('/add', async function(req, res, next) {
    try {
        const {comment,rating,userId,movieId}=req.body;
        const review = await ReviewController.add(comment,rating,userId,movieId);
        res.status(200).json({review,message:"thêm thành công"})
    } catch (error) {
        res.status(414).json({message:"Thêm review thất bại" } );
    }
  });

module.exports = router;