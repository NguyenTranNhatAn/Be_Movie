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
        const movie = ProductsModel.findByIdAndUpdate(_id, {name,duration,release_date,trailer,images,description,rating,genreId});
        return movie;
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

module.exports ={add,getAll,getDetail,search,update}