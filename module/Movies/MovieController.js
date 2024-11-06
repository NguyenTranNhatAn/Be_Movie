const UserModel = require("../Users/UserModel");
const MovieModel = require("./MovieModel");


const getAll = async () => {
    try {
        const moives = await MovieModel.find({});
        return moives;
    } catch (error) {
        console.log(error);
    }
    
}
const getDetail = async (_id) => {
    try {
        const movie = await MovieModel.findOne({ _id: _id });
        return movie;
    } catch (error) {
        console.log(error);
    }
}
const update = async (_id,name,duration,release_date,trailer,images,description,rating,genreId) => {
    try {
        const movie = MovieModel.findByIdAndUpdate(_id, {name,duration,release_date,trailer,images,description,rating,genreId});
        return movie;
    } catch (error) {
        console.log(error);
    }
}
const remove = async (_id) => {
    try {
        await MovieModel.deleteOne({ _id: _id })
    } catch (error) {
        console.log(error);
    }
}
const add = async (name,duration,release_date,trailer,images,description,rating,genreId) => {
    const movie= new MovieModel({name,duration,release_date,trailer,images,description,rating,genreId  });
    await movie.save()
    return movie;
}
const search = async (name) => {
    try {      
        const movie = await MovieModel.find({ name:{  $regex: `${name}`,$options :'i'} });
        return movie;
    } catch (error) {
        console.log(error);
    }
}
const addWish =async(_id,movieId)=>{
    try {
        const user = await UserModel.findById(_id);
       
        const added= user.wishlist.find((id)=>id.toString()===movieId);
       
        if (added){
            let user= await UserModel.findByIdAndUpdate(_id,{
                $pull:{wishlist:movieId}
            },
            {new:true}
        )
        return {user,message:'Xóa thành công'};
        }
        else{
            let user= await UserModel.findByIdAndUpdate(_id,{
                $push:{wishlist:movieId}
            },
            {new:true})  
            return {user,message:'Thêm thành công'};
        }
        
    } catch (error) {
        
    }
}
const addWishList =async(movieId,id)=>{
    
    try {
        
        const user = await UserModel.findById(id);
       
       
        const added= user.wishlist.find((id)=>id.toString()===movieId);
        console.log(add)
        if (added){
            let user= await UserModel.findByIdAndUpdate(id,{
                $pull:{wishlist:movieId}
            },
            {new:true}
        )
       
        return {user,message:'Xóa thành công'};
        }
        else{
            let user= await UserModel.findByIdAndUpdate(id,{
                $push:{wishlist:movieId}
            },
            {new:true})  
            return {user,message:'Thêm thành công'};
        }
        
    } catch (error) {
        console.log(error)
    }
}
module.exports ={add,getAll,getDetail,search,update,remove,addWishList,addWish}