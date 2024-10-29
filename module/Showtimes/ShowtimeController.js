const ShowtimeModel = require("./ShowtimeModel");



const getAll = async () => {
    try {
        const showtimes = await ShowtimeModel.find({});
        return showtimes;
    } catch (error) {
        console.log(error);
    }
    
}

const add = async (movieId,
    roomId,
    startTime,
    endTime,
    day,
    Room_Shape,) => {
    const room= new RoomModel({movieId,
        roomId,
        startTime,
        endTime,
        day,
        Room_Shape});
    await room.save()
    return room;
}
module.exports ={add}