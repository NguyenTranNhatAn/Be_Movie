const RoomModel = require("./RoomModel");



const getAll = async () => {
    try {
        const rooms = await RoomModel.find({});
        const returnRooms = rooms.filter(item => item.status !== false);
        return returnRooms;
    } catch (error) {
        console.log(""+error);

    
    }
    
}
const getDelete = async () => {
    try {
        const rooms = await RoomModel.find({});
        const returnRooms = rooms.filter(item => item.status == false);
        console.log(returnRooms)
        return returnRooms;
    } catch (error) {
        console.log(""+error);

    
    }
    
}
const remove = async (_id) => {
    try {
       
        const room = await RoomModel.findById(_id);
        if (!room) {
            throw new Error('Phòng không tồn tại');
        }   
        if(room.status==false){
            throw new Error('Phòng này đã được xóa');
        }
       
        // Cập nhật với strict: false để thêm thuộc tính không có trong schema
        await RoomModel.updateOne({ _id }, { $set: { status: false } }, { strict: false });
        
        return room;
    } catch (error) {
        console.error(error);
        throw error; 
    }
};
const update = async (_id,name,roomShape,cinemaId,totalSeat) => {
    try {
        const room = RoomModel.findByIdAndUpdate(_id, {name,roomShape,cinemaId,totalSeat});
        return room;
    } catch (error) {
        console.log(error);
    }
}
const revert = async (_id) => {
    try {
       
        const room = await RoomModel.findById(_id);
        if (!room) {
            throw new Error('Phòng không tồn tại');
        }   
        if(room.status==true){
            throw new Error('Phòng này không có trong danh sách xóa');
        }

        // Cập nhật với strict: false để thêm thuộc tính không có trong schema
        await RoomModel.updateOne({ _id }, { $set: { status: true } }, { strict: false });
        
        return room;
    } catch (error) {
        console.error(error);
        throw error; 
    }
};
const add = async (name,totalSeat,roomShape,cinema_id) => {
    const room= new RoomModel({name,totalSeat,roomShape,cinema_id});
    await room.save()
    return room;
}
const listByCinema = async (cinemaId) => {
    try {
        const rooms = await RoomModel.find({cinemaId:cinemaId});
        console.log(rooms)
        return rooms;
    } catch (error) {
        console.log(error);
    }
    
}

module.exports ={add,listByCinema,getAll,getDelete,remove,revert,update}