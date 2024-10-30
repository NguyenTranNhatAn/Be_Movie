const ShowtimeModel = require("./ShowtimeModel");



const getAll = async () => {
    try {
        const showtimes = await ShowtimeModel.find({});
        return showtimes;
    } catch (error) {
        console.log(error);
    }
    
}

const add = async (movieId, roomId, startTime, endTime, day, Room_Shape,) => {
    const showtime= new ShowtimeModel({movieId,roomId, startTime, endTime, day, Room_Shape});
    await showtime.save()
    return showtime;
}
module.exports ={add}