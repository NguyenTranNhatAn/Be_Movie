const RoomModel = require("./RoomModel");



const getAll = async () => {
    try {
        const rooms = await RoomModel.find({});
        return rooms;
    } catch (error) {
        console.log(""+error);

    
    }
    
}

const add = async (name,totalSeat,roomShape,cinema_id) => {
    const room= new RoomModel({name,totalSeat,roomShape,cinema_id});
    await room.save()
    return room;
}
const listByCinema = async (cinema_id) => {
    try {
        const rooms = await RoomModel.find({cinema_id:cinema_id});
        return rooms;
    } catch (error) {
        console.log(error);
    }
    
}
module.exports ={add,listByCinema}