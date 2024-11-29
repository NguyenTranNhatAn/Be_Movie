const CinemaModel = require("./CinemaModel");
const Room = require("../../module/Rooms/RoomModel");
const getAll = async () => {
    try {
        const cinemas = await CinemaModel.find({});
        const returnCinemas = cinemas.filter(item=>item.status!==false)
        return returnCinemas;
    } catch (error) {
        console.log(error);
    }
    
}
const getDelete = async () => {
    try {
        const cinemas = await CinemaModel.find({});
        const returnCinemas = cinemas.filter(item=>item.status==false)
        return returnCinemas;
    } catch (error) {
        console.log(error);
    }
    
}
const remove = async (_id) => {
    try {
       
        const cinema = await CinemaModel.findById(_id);
        if (!cinema) {
            throw new Error('Rap không tồn tại');
        }
        if (cinema.status==false) {
            throw new Error('Rạp đã được xóa trước đó');
        }
        const rooms= await Room.find({cinemaId:_id})
        if(rooms.length>0){
            throw new Error('Rạp này không được xóa bởi vì được liên kết với phòng');
        }
        // Cập nhật với strict: false để thêm thuộc tính không có trong schema
        await CinemaModel.updateOne({ _id }, { $set: { status: false } }, { strict: false });
        
        return cinema;
    } catch (error) {
        console.error(error);
        throw error; 
    }
};
const revert = async (_id) => {
    try {
       
        const cinema = await CinemaModel.findById(_id);
        if (!cinema) {
            throw new Error('Rap không tồn tại');
        }
        if (cinema.status==true) {
            throw new Error('Rạp đã không có trong danh sách xóa');
        }

        // Cập nhật với strict: false để thêm thuộc tính không có trong schema
        await CinemaModel.updateOne({ _id }, { $set: { status: true } }, { strict: false });
        
        return cinema;
    } catch (error) {
        console.error(error);
        throw error; 
    }
};

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
const update = async (_id,name,address,brandId) => {
    try {
        let cinema = await CinemaModel.findById(_id);
        console.log(cinema)
        let checkName = await CinemaModel.findOne({ name});
        if (checkName) {
            throw new Error('Tên Rạp đã được đăng kí');
        }
        cinema.name = name || cinema.name;
        cinema.address = address || cinema.address;
        cinema.brandId = brandId || cinema.brandId;
        await cinema.save();

        
        return cinema;
    } catch (error) {
        throw new Error(error.message); 
    }
}

module.exports ={add,getAll,findByBrand,remove,update,revert,getDelete}