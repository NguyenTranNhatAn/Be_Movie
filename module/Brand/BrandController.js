const BrandModel = require("./BrandModel");
const getAll = async () => {
    try {
        const brands = await BrandModel.find({});
        const returnBrand = brands.filter(item => item.status !== false);
        return returnBrand;
    } catch (error) {
        console.log(error);
    }

}
const update = async (_id,name,logo,description) => {
    try {
        let brand = await BrandModel.findById(_id);
        let checkName = await BrandModel.findOne({ name});
        if (checkName) {
            throw new Error('Tên thương hiệu đã được đăng kí');
        }
        brand.name = name || brand.name;
        brand.logo = logo || brand.logo;
        brand.description = description || brand.description;
        await brand.save();

        
        return brand;
    } catch (error) {
        throw new Error(error.message); 
    }
}
const remove = async (_id) => {
    try {
       
        const brand = await BrandModel.findById(_id);
        if (!brand) {
            throw new Error('Thương hiệu không tồn tại');
        }

        // Cập nhật với strict: false để thêm thuộc tính không có trong schema
        await BrandModel.updateOne({ _id }, { $set: { status: false } }, { strict: false });
        
        return brand;
    } catch (error) {
        console.error(error);
        throw error; 
    }
};

const add = async (name, logo,description ) => {
   try {
    const brand = new BrandModel({ name, logo,description });
    await brand.save()
    return brand;
   } catch (error) {
    console.log(error)
   }
}
module.exports = { add, getAll ,update,remove}