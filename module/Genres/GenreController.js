const GenreModel = require("./GenreModel");

const getAll = async () => {
    try {
        const movies = await GenreModel.find({});
        return movies;
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

const add = async (name,description) => {
    const genre= new GenreModel({name,description});
    await genre.save()
    return genre;
}
module.exports ={add,getAll,getDetail}