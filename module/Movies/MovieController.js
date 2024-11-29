const UserModel = require("../Users/UserModel");
const MovieModel = require("./MovieModel");
const Ticket = require("../../models/Ticket");


const getAll = async () => {
    try {
        const movies = await MovieModel.find({});
        const returnMovie = movies.filter(item => item.status !== false);
        return returnMovie;
    } catch (error) {
        console.log(error);
    }
    
}
const getDelete = async () => {
    try {
        const movies = await MovieModel.find({});
        const returnMovie = movies.filter(item => item.status == false);
        return returnMovie;
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
       
        const movie = await MovieModel.findById(_id);
        if (!movie) {
            throw new Error('Phim không tồn tại');
        }   
        if(movie.status==false){
            throw new Error('Phim này đã được xóa');
        }
        const movies= await Ticket.find({movieId:_id})
        if(movies){
            throw new Error('Phim không được xóa do được liên kết với ticket');
        }

        // Cập nhật với strict: false để thêm thuộc tính không có trong schema
        await MovieModel.updateOne({ _id }, { $set: { status: false } }, { strict: false });
        
        return movie;
    } catch (error) {
        console.error(error);
        throw error; 
    }
};
const revert = async (_id) => {
    try {
       
        const movie = await MovieModel.findById(_id);
        if (!movie) {
            throw new Error('Phim không tồn tại');
        }   
        if(movie.status==true){
            throw new Error('Phim này không có trong danh sách xóa');
        }

        // Cập nhật với strict: false để thêm thuộc tính không có trong schema
        await MovieModel.updateOne({ _id }, { $set: { status: true } }, { strict: false });
        
        return movie;
    } catch (error) {
        console.error(error);
        throw error; 
    }
};
const add = async (name,duration,release_date,trailer,images,description,rating,genreId) => {
    const movie= new MovieModel({name,duration,release_date,trailer,images,description,rating,genreId  });
    await movie.save()
    return movie;
}
const search = async (name) => {
    try {      
        const movie = await MovieModel.find({ name:{  $regex: `${name}`,$options :'i'},status: { $ne: false }  });
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
module.exports ={add,getAll,getDetail,search,update,remove,addWishList,addWish,getDelete,revert}