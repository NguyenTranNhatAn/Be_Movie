const GenreModel = require("./GenreModel");

const getAll = async () => {
    try {
        const categories = await CategoryModel.find({});
        return categories;
    } catch (error) {
        console.log(error);
    }
    
}

const add = async (name,description) => {
    const genre= new GenreModel({name,description});
    await genre.save()
    return genre;
}
module.exports ={add}