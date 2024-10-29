const CinemaModel = require("./CinemaModel");
const getAll = async () => {
    try {
        const cinemas = await CinemaModel.find({});
        return cinemas;
    } catch (error) {
        console.log(error);
    }
    
}

const add = async (name,address,brandId) => {
    const cinema= new CinemaModel({name,address,brandId});
    await cinema.save()
    return cinema;
}
const findByBrand = async (brandId) => {
    try {
        const cinemas = await CinemaModel.find({brandId:brandId});
        return cinemas;
    } catch (error) {
        console.log(error);
    }
    
}

module.exports ={add,getAll,findByBrand}