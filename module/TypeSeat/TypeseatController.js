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
        const type = await TypeSeatModel.find({cinemaId:cinemaId});  
        return type;
    } catch (error) {
        console.log(error);
    }
    
}
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
module.exports ={getAll,remove,getDetail,update,revert,getDelete,getByCinemaId}