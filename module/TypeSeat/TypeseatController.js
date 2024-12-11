const TypeSeatModel = require("../../models/TypeSeat");

const getAll = async () => {
    try {
        const type = await TypeSeatModel.find({});
        const returnType = type.filter(item => item.status !== false);
        return returnType;
    } catch (error) {
        console.log(error);
    }
    
}
const getByCinemaId = async (cinemaId) => {
    try {
        const type = await TypeSeatModel.find({ 
            cinemaId: cinemaId, 
            status: { $ne: false } 
        });
         
        return type;
    } catch (error) {
        console.log(error);
    }
    
}
const getCinemaRemain = async (cinemaId) => {
    try {
        // Truy vấn tất cả các ghế theo cinemaId và status
        const type = await TypeSeatModel.find({
            cinemaId: cinemaId,
            status: { $ne: false }
        });

        // Danh sách các loại ghế cần kiểm tra
        const requiredSeats = ["T", "V", "D"];
        // Lấy danh sách tên ghế từ kết quả truy vấn
        const existingSeatNames = type.map((seat) => seat.typeSeatName);

        // Tìm các loại ghế chưa được thêm
        const remainingSeats = requiredSeats.filter(
            (seatName) => !existingSeatNames.includes(seatName)
        );

        // Nếu tất cả các loại ghế đã được thêm
       

        // Trả về danh sách các loại ghế còn thiếu
        return remainingSeats;
    } catch (error) {
        console.log(error);
    }
};

const getDelete = async () => {
    try {
        const type = await TypeSeatModel.find({});
        const returnType = type.filter(item => item.status == false);
        return returnType;
    } catch (error) {
        console.log(error);
    }
    
}
const remove = async (_id) => {
    try {
       
        const typeseat = await TypeSeatModel.findById(_id);
        if (!typeseat) {
            throw new Error('Loại ghê không tồn tại');
        }   
        if(typeseat.status==false){
            throw new Error('Loại ghế này đã được xóa');
        }

        // Cập nhật với strict: false để thêm thuộc tính không có trong schema
        await TypeSeatModel.updateOne({ _id }, { $set: { status: false } }, { strict: false });
        
        return typeseat;
    } catch (error) {
        console.error(error);
        throw error; 
    }
};
const revert = async (_id) => {
    try {
       
        const typeseat = await TypeSeatModel.findById(_id);
        if (!typeseat) {
            throw new Error('Loại ghê không tồn tại');
        }   
        if(typeseat.status==true){
            throw new Error('Loại ghế này không có trong danh sách xóa');
        }

        // Cập nhật với strict: false để thêm thuộc tính không có trong schema
        await TypeSeatModel.updateOne({ _id }, { $set: { status: true } }, { strict: false });
        
        return typeseat;
    } catch (error) {
        console.error(error);
        throw error; 
    }
};

const getDetail = async (_id) => {
    try {
        const typeseat = await TypeSeatModel.findOne({ _id: _id });
        return typeseat;
    } catch (error) {
        console.log(error);
    }
}



const update = async (_id,typeSeatName,cinemaId,typeSeatPrice) => {
    try {
        const movie = TypeSeatModel.findByIdAndUpdate(_id, {typeSeatName,cinemaId,typeSeatPrice},{new:true});
        return movie;
    } catch (error) {
        console.log(error);
    }
}
module.exports ={getAll,remove,getDetail,update,revert,getDelete,getByCinemaId,getCinemaRemain}