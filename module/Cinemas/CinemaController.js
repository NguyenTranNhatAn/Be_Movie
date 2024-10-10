const CinemaModel = require("./CinemaModel");
const getAll = async () => {
    try {
        const cinemas = await CinemaModel.find({});
        return cinemas;
    } catch (error) {
        console.log(error);
    }
    
}

const add = async (name,address) => {
    const cinema= new CinemaModel({name,address});
    await cinema.save()
    return cinema;
}
module.exports ={add,getAll}