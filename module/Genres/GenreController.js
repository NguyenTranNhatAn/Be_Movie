const GenreModel = require("./GenreModel");

const getAll = async () => {
    try {
        const movies = await GenreModel.find({});
        const returnMovies= movies.filter(item=>item.status!=false)
        return returnMovies;
    } catch (error) {
        console.log(error);
    }
    
}
const getDetail = async (_id) => {
    try {
        if (!_id){
            throw new Error("Id không hợp lệ")
        }
        const movie = await GenreModel.findById({_id});
        return movie;
    } catch (error) {
        throw new Error(error.message)
    }
    
}
const update = async (_id,name,description) => {
    try {
        let genre = await GenreModel.findById(_id);
        let checkName = await GenreModel.findOne({ name});
        if (checkName) {
            throw new Error('Tên Thể loại đã được đăng kí');
        }
        genre.name = name || genre.name;
        genre.description = description || genre.description;
        await genre.save();

        
        return genre;
    } catch (error) {
        throw new Error(error.message); 
    }
}
const remove = async (_id) => {
    try {
       
        const genre = await GenreModel.findById(_id);
        if (!genre) {
            throw new Error('Thể loại không tồn tại');
        }
        if(genre.status==false){
            throw new Error('Thể loại đã được xóa trước đó ');
        }

        // Cập nhật với strict: false để thêm thuộc tính không có trong schema
        await GenreModel.updateOne({ _id }, { $set: { status: false } }, { strict: false });
        
        return genre;
    } catch (error) {
        console.error(error);
        throw error; 
    }
};
const add = async (name,description) => {
    const genre= new GenreModel({name,description});
    await genre.save()
    return genre;
}
module.exports ={add,getAll,getDetail,remove,update}