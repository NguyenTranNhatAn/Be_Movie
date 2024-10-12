const MovieModel = require("./MovieModel");


const getAll = async () => {
    try {
        const moives = await MovieModel.find({});
        return moives;
    } catch (error) {
        console.log(error);
    }
    
}

const add = async (name,duration,release_date,trailer,images,description,rating,genreId) => {
    const movie= new MovieModel({name,duration,release_date,trailer,images,description,rating,genreId  });
    await movie.save()
    return movie;
}
module.exports ={add,getAll}