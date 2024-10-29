const BrandModel = require("./BrandModel");
const getAll = async () => {
    try {
        const brands = await BrandModel.find({});
        return brands;
    } catch (error) {
        console.log(error);
    }

}

const add = async (name, logo,description ) => {
    const brand = new BrandModel({ name, logo,description });
    await brand.save()
    return brand;
}
module.exports = { add, getAll }