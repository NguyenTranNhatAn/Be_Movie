const BrandModel = require("./BrandModel");
const Cinema = require("../../module/Cinemas/CinemaModel");
const getAll = async () => {
    try {
        const brands = await BrandModel.find({});
        const returnBrand = brands.filter(item => item.status !== false);
        return returnBrand;
    } catch (error) {
        console.log(error);
    }

}
const getDelete = async () => {
    try {
        const brands = await BrandModel.find({});
        const returnBrand = brands.filter(item => item.status == false);
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
        if(brand.status==false){
            throw new Error('Thương hiệu đã được xóa trước đó ');
        }
        const check= await Cinema.find({brandId:_id})
        if(check.length){
            throw new Error('Thương hiệu không được xóa vì đã liên kết với rạp');
        }
        // Cập nhật với strict: false để thêm thuộc tính không có trong schema
        await BrandModel.updateOne({ _id }, { $set: { status: false } }, { strict: false });
        
        return brand;
    } catch (error) {
        console.error(error);
        throw error; 
    }
};
const revert = async (_id) => {
    try {
       
        const brand = await BrandModel.findById(_id);
        if (!brand) {
            throw new Error('Thương hiệu không tồn tại');
        }
        if(brand.status==true){
            throw new Error('Thương hiệu không có trong danh sách xóa ');
        }

        // Cập nhật với strict: false để thêm thuộc tính không có trong schema
        await BrandModel.updateOne({ _id }, { $set: { status: true } }, { strict: false });
        
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
module.exports = { add, getAll ,update,remove,getDelete,revert}