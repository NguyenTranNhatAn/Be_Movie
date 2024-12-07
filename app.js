
var createError = require('http-errors');
var express = require('express');
const cors = require('cors');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const dotenv = require('dotenv');
const http = require('http'); // Thêm HTTP để kết hợp với Socket.IO
const socketIo = require('socket.io'); // Thêm Socket.IO

dotenv.config(); // Load các biến môi trường từ .env

var usersRouter = require('./routes/user');
const mongoose = require('mongoose');

// Kết nối MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://nan22052004:an22@cluster0.rhjpd.mongodb.net/movie', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('>>>>>>>>>> DB Connected!!!!!!'))
  .catch(err => console.log('>>>>>>>>> DB Error: ', err));

var user = require('./routes/user')
var genre = require('./routes/genre')
var cinema = require('./routes/cinema')
var room = require('./routes/room')
var movie = require('./routes/movie')
var review = require('./routes/review')
var admin = require('./routes/admin')
var brand = require('./routes/brand')
var showtime = require('./routes/showtime')


const roomRoutes = require('./routes/roomRoutes');
const showTimeRoutes = require('./routes/showtimeRoutes');
const loginRoutes = require('./routes/loginRoutes');
const typeSeatRoutes = require('./routes/typeSeatRoutes');
const playtimeRoutes = require('./routes/playtimeRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const zaloPayRoutes = require('./routes/zaloPayRoutes');
//danh làm:

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});




const lockedSeats = {}; // Danh sách ghế bị khóa
const lockedSeatsQueue = {}; // Lưu danh sách hàng đợi các user đang chọn cùng 1 ghế
const randomInProgress = {}; // Theo dõi trạng thái random cho từng ghế
const MAX_SEATS_PER_USER = 5; // Số ghế tối đa mỗi người dùng có thể chọn
let originalSeatState = {}; // Trạng thái ban đầu của ghế
const ShowTime = require('./models/ShowTime');
const seatTimers = {}; // Bộ đếm thời gian cho mỗi ghế
// Hàm gửi sơ đồ ghế chi tiết
async function emitSeatMapUpdate(io, showtimeId) {
  const showtime = await ShowTime.findById(showtimeId);
  if (!showtime) return;

  const roomShapeArray = showtime.Room_Shape.split('/').map((row) => row.split(''));
  const detailedSeatMap = roomShapeArray.map((row, rowIndex) =>
    row.map((seat, colIndex) => {
      const seatId = `${rowIndex}-${colIndex}`;
      const seatState = originalSeatState[seatId];
      return {
        status: seat, // Trạng thái ghế (T, V, D, P)
        userId: seatState ? seatState.userId : null // ID người dùng nếu ghế đang được giữ
      };
    })
  );

  io.emit('seat_map_updated', { showtimeId, seatMap: detailedSeatMap });
}

// Xử lý kết nối Socket.IO
io.on('connection', (socket) => {
  const { showTimeID, userID } = socket.handshake.query; // Lấy thông tin từ query
  console.log(`User  kết nối: showTimeID = ${showTimeID}, userID = ${userID}`);
  console.log('Người dùng kết nối:', socket.id);


  // Lưu thông tin người dùng khi kết nối
  socket.on('user_join', ({ userId, showtimeId }) => {
    socket.userId = userId;
    socket.showtimeId = showtimeId;
    socket.join(showtimeId); // Tham gia phòng theo suất chiếu
  });
  /*
    const Redis = require('ioredis');
  
    // Kết nối đến Redis đang chạy trên Docker
    const redis = new Redis({
      host: '127.0.0.1', // localhost hoặc 127.0.0.1
      port: 6379,        // Redis port mặc định
      // password: 'your-redis-password' // Nếu không có mật khẩu, bỏ dòng này
    });
    // Kiểm tra kết nối
    redis.ping()
      .then(result => console.log('Redis is connected:', result))
      .catch(err => console.error('Redis connection error:', err));
    // Khi người dùng chọn ghế
    socket.on('select_seat', async ({ showtimeId, row, col, userId }) => {
      console.log('User attempting to select seat:', { row, col, userId });
      const showtime = await ShowTime.findById(showtimeId);
  
      if (!showtime) {
        return socket.emit('error', { message: 'Không tìm thấy suất chiếu' });
      }
  
      let roomShapeArray = showtime.Room_Shape.split('/').map((row) => row.split(''));
  
      // Kiểm tra phạm vi row và col trước khi truy cập
      if (!roomShapeArray[row] || !roomShapeArray[row][col]) {
        return socket.emit('error', { message: 'Ghế không tồn tại' });
      }
  
      // Kiểm tra ghế đã được chọn
      const redisSeatKey = `seat:${showtimeId}:${row}:${col}`;
      const seatData = await redis.hgetall(redisSeatKey);
      console.log('Current seat data from Redis:', seatData);
  
      if (seatData.state === 'P' && seatData.timestamp && seatData.timestamp > Date.now()) {
        console.log('Ghế đang bị người dùng khác chọn trước đó.');
        return socket.emit('error', { message: 'Ghế đang được chọn bởi người dùng khác' });
      }
  
      if (['T', 'V', 'D'].includes(roomShapeArray[row][col])) {
        // Đặt ghế vào Redis
        await redis.hmset(redisSeatKey, {
          state: roomShapeArray[row][col],
          userId,
          timestamp: Date.now(),
        });
        await redis.expire(redisSeatKey, 120); // Tự động xóa sau 2 phút
  
        roomShapeArray[row][col] = 'P'; // Đánh dấu ghế đang được chọn
        showtime.Room_Shape = roomShapeArray.map((row) => row.join('')).join('/');
        await showtime.save();
        emitSeatMapUpdate(io, showtimeId); // Phát sự kiện cập nhật sơ đồ ghế
  
        // Thêm bộ đếm thời gian 2 phút
        setTimeout(async () => {
          const updatedSeatData = await redis.hgetall(redisSeatKey);
          if (updatedSeatData.state === 'P') {
            roomShapeArray[row][col] = updatedSeatData.state || 'T';
            showtime.Room_Shape = roomShapeArray.map((row) => row.join('')).join('/');
            await showtime.save();
            await redis.del(redisSeatKey); // Xóa khỏi Redis
            emitSeatMapUpdate(io, showtimeId);
            console.log(`Ghế (${row}, ${col}) đã được hoàn tác do không thanh toán.`);
          }
        }, 2 * 60 * 1000);
      } else {
        socket.emit('error', { message: 'Ghế này không khả dụng' });
      }
    });
  
    // Khi người dùng bỏ chọn ghế
    socket.on('deselect_seat', async ({ showtimeId, row, col, userId }) => {
      console.log('User attempting to deselect seat:', { row, col, userId });
  
      const showtime = await ShowTime.findById(showtimeId);
      if (!showtime) {
        return socket.emit('error', { message: 'Không tìm thấy suất chiếu' });
      }
  
      let roomShapeArray = showtime.Room_Shape.split('/').map((row) => row.split(''));
  
      const redisSeatKey = `seat:${showtimeId}:${row}:${col}`;
      const seatData = await redis.hgetall(redisSeatKey);
  
  
  
      // Kiểm tra trạng thái ghế từ Redis và xác minh người dùng
      if (seatData.state === 'P' && seatData.userId === userId) {
        // Cập nhật trạng thái ghế trong Redis
        await redis.hmset(redisSeatKey, {
          state: roomShapeArray[row][col], // Trạng thái ban đầu của ghế, ví dụ 'T' (trống)
          userId: null, // Đặt lại userId để không còn liên kết với người dùng
          timestamp: Date.now(), // Cập nhật timestamp
        });
  
        // Cập nhật lại sơ đồ ghế trong cơ sở dữ liệu
        roomShapeArray[row][col] = 'T'; // Trạng thái ghế trở lại 'T' (trống)
        showtime.Room_Shape = roomShapeArray.map((row) => row.join('')).join('/');
        await showtime.save();
  
        // Xóa bộ đếm thời gian nếu tồn tại
        const seatId = `${showtimeId}-${row}-${col}`;
        if (seatTimers[seatId]) {
          clearTimeout(seatTimers[seatId]);
          delete seatTimers[seatId];
        }
  
        // Phát sự kiện cập nhật sơ đồ ghế
        emitSeatMapUpdate(io, showtimeId);  // Phát sự kiện để cập nhật sơ đồ ghế
      } else {
        // Trường hợp không thể bỏ chọn ghế (ghế không thuộc người dùng hoặc đã có sự thay đổi)
        socket.emit('error', { message: 'Ghế này không thuộc quyền của bạn để bỏ chọn' });
      }
    });
  
  */


  /*
    //Khi người dùng chọn ghế
    socket.on('select_seat', async ({ showtimeId, row, col, userId }) => {
      console.log('User attempting to select seat:', { row, col, userId });
      const showtime = await ShowTime.findById(showtimeId);
  
      if (!showtime) {
        return socket.emit('error', { message: 'Không tìm thấy suất chiếu' });
      }
  
      let roomShapeArray = showtime.Room_Shape.split('/').map((row) => row.split(''));
  
      // Kiểm tra phạm vi row và col trước khi truy cập
      if (!roomShapeArray[row] || !roomShapeArray[row][col]) {
        return socket.emit('error', { message: 'Ghế không tồn tại' });
      }
  
      // Kiểm tra ghế đã được chọn và bấm theo thời gian
      if (roomShapeArray[row][col] === 'P') {
        const currentSeat = originalSeatState[`${row}-${col}`];
  
        // Nếu ghế đã được chọn bởi người khác, kiểm tra thời gian
        if (currentSeat && currentSeat.timestamp > Date.now()) {
          console.log('Ghế đang bị người dùng khác chọn trước đó.');
          return socket.emit('error', { message: 'Ghế đang được chọn bởi người dùng khác' });
        }
      }
  
      if (['T', 'V', 'D'].includes(roomShapeArray[row][col])) {
        // Đặt ghế thành đang chọn và ghi lại thời gian
        originalSeatState[`${row}-${col}`] = {
          state: roomShapeArray[row][col],
          userId,
          timestamp: Date.now()  // Ghi nhận thời gian bấm chọn ghế
        };
        console.log(originalSeatState);
        roomShapeArray[row][col] = 'P'; // Đặt ghế thành đang chọn
        showtime.Room_Shape = roomShapeArray.map((row) => row.join('')).join('/');
        await showtime.save();
        emitSeatMapUpdate(io, showtimeId);  // Phát sự kiện để cập nhật sơ đồ ghế
  
        // Thêm bộ đếm thời gian 2 phút để hoàn tác trạng thái nếu không thanh toán
        const seatId = `${showtimeId}-${row}-${col}`;
        if (seatTimers[seatId]) {
          clearTimeout(seatTimers[seatId]); // Xóa bộ đếm cũ nếu có
        }
        seatTimers[seatId] = setTimeout(async () => {
          const updatedShowtime = await ShowTime.findById(showtimeId);
          if (updatedShowtime) {
            let updatedRoomShapeArray = updatedShowtime.Room_Shape.split('/').map((r) => r.split(''));
            if (updatedRoomShapeArray[row][col] === 'P') {
              updatedRoomShapeArray[row][col] = originalSeatState[`${row}-${col}`]?.state || 'T'; // Khôi phục trạng thái ban đầu
              delete originalSeatState[`${row}-${col}`];
              updatedShowtime.Room_Shape = updatedRoomShapeArray.map((r) => r.join('')).join('/');
              await updatedShowtime.save();
              emitSeatMapUpdate(io, showtimeId); // Phát sự kiện cập nhật sơ đồ ghế
              console.log(`Ghế (${row}, ${col}) đã được hoàn tác do không thanh toán trong 2 phút.`);
            }
            delete seatTimers[seatId]; // Xóa bộ đếm sau khi hoàn tác
          }
        }, 2 * 60 * 1000); // 2 phút
      } else {
        socket.emit('error', { message: 'Ghế này không khả dụng' });
      }
    });
  */

  // Khi người dùng chọn ghế
  socket.on('select_seat', async ({ showtimeId, row, col, userId }) => {
    console.log('User attempting to select seat:', { row, col, userId });
    const showtime = await ShowTime.findById(showtimeId);

    if (!showtime) {
      return socket.emit('error', { message: 'Không tìm thấy suất chiếu' });
    }

    let roomShapeArray = showtime.Room_Shape.split('/').map((row) => row.split(''));

    // Kiểm tra phạm vi row và col trước khi truy cập
    if (!roomShapeArray[row] || !roomShapeArray[row][col]) {
      return socket.emit('error', { message: 'Ghế không tồn tại' });
    }

    const seatId = `${row}-${col}`;

    // Kiểm tra xem ghế có đang được chọn không
    const currentSeat = originalSeatState[seatId];

    if (currentSeat) {
      const timeElapsed = Date.now() - currentSeat.timestamp;

      // Nếu ghế đã được chọn trong vòng 1 giây, xác định ai chọn trước
      if (timeElapsed < 1000) {
        if (currentSeat.timestamp < Date.now()) {  // Người bấm trước sẽ được chọn
          return socket.emit('error', { message: 'Ghế đã được chọn bởi người khác' });
        }
      }
    }

    if (['T', 'V', 'D'].includes(roomShapeArray[row][col])) {
      // Đặt ghế thành đang chọn và ghi lại thời gian
      originalSeatState[seatId] = {
        state: roomShapeArray[row][col],
        userId,
        timestamp: Date.now()  // Ghi nhận thời gian bấm chọn ghế
      };

      console.log(originalSeatState);
      roomShapeArray[row][col] = 'P'; // Đặt ghế thành đang chọn
      showtime.Room_Shape = roomShapeArray.map((row) => row.join('')).join('/');
      await showtime.save();
      emitSeatMapUpdate(io, showtimeId);  // Phát sự kiện để cập nhật sơ đồ ghế

      // Thêm bộ đếm thời gian 2 phút để hoàn tác trạng thái nếu không thanh toán
      if (seatTimers[seatId]) {
        clearTimeout(seatTimers[seatId]); // Xóa bộ đếm cũ nếu có
      }

      seatTimers[seatId] = setTimeout(async () => {
        const updatedShowtime = await ShowTime.findById(showtimeId);
        if (updatedShowtime) {
          let updatedRoomShapeArray = updatedShowtime.Room_Shape.split('/').map((r) => r.split(''));
          if (updatedRoomShapeArray[row][col] === 'P') {
            updatedRoomShapeArray[row][col] = originalSeatState[seatId]?.state || 'T'; // Khôi phục trạng thái ban đầu
            delete originalSeatState[seatId];
            updatedShowtime.Room_Shape = updatedRoomShapeArray.map((r) => r.join('')).join('/');
            await updatedShowtime.save();
            emitSeatMapUpdate(io, showtimeId); // Phát sự kiện cập nhật sơ đồ ghế
            console.log(`Ghế (${row}, ${col}) đã được hoàn tác do không thanh toán trong 2 phút.`);
          }
          delete seatTimers[seatId]; // Xóa bộ đếm sau khi hoàn tác
        }
      }, 2 * 60 * 1000); // 2 phút
    } else {
      socket.emit('error', { message: 'Ghế này không khả dụng' });
    }
  });




  // Khi người dùng bỏ chọn ghế
  socket.on('deselect_seat', async ({ showtimeId, row, col, userId }) => {
    console.log('User attempting to deselect seat:', { row, col, userId });
    const showtime = await ShowTime.findById(showtimeId);
    if (!showtime) {
      return socket.emit('error', { message: 'Không tìm thấy suất chiếu' });
    }

    let roomShapeArray = showtime.Room_Shape.split('/').map((row) => row.split(''));

    const original = originalSeatState[`${row}-${col}`];
    if (roomShapeArray[row][col] === 'P' && original && original.userId === userId) {
      roomShapeArray[row][col] = original.state;
      delete originalSeatState[`${row}-${col}`];
      showtime.Room_Shape = roomShapeArray.map((row) => row.join('')).join('/');
      await showtime.save();

      // Xóa bộ đếm thời gian nếu tồn tại khi bỏ chọn ghế
      const seatId = `${showtimeId}-${row}-${col}`;
      if (seatTimers[seatId]) {
        clearTimeout(seatTimers[seatId]);
        delete seatTimers[seatId];
      }

      emitSeatMapUpdate(io, showtimeId);  // Phát sự kiện để cập nhật sơ đồ ghế
    } else {
      socket.emit('error', { message: 'Ghế này không thuộc quyền của bạn để bỏ chọn' });
    }
  });


  // Khi người dùng rời phòng
  socket.on('disconnect', async () => {
    console.log('Người dùng ngắt kết nối:', socket.id);
    const { showTimeID, userID } = socket.handshake.query; // Lấy thông tin từ query
    console.log(`User ngắt kết nối: showTimeID = ${showTimeID}, userID = ${userID}`);


    if (showTimeID && userID) {
      const showtime = await ShowTime.findById(showTimeID);
      if (!showtime) {
        return;
      }

      let roomShapeArray = showtime.Room_Shape.split('/').map((row) => row.split(''));

      // Duyệt qua tất cả ghế để kiểm tra xem ghế nào đã được người dùng chọn và cần giải phóng
      for (let row = 0; row < roomShapeArray.length; row++) {
        for (let col = 0; col < roomShapeArray[row].length; col++) {
          const seatId = `${row}-${col}`;
          const seatState = originalSeatState[seatId];

          // Kiểm tra ghế này có đang trong trạng thái 'P' (được chọn) và thuộc về người dùng này không
          if (seatState && seatState.userId === userID && roomShapeArray[row][col] === 'P') {
            console.log(`Giải phóng ghế (${row}, ${col}) cho người dùng ${userID}`);

            // Giải phóng ghế: đặt lại trạng thái của ghế về trạng thái ban đầu (ví dụ: 'T' - trống)
            roomShapeArray[row][col] = seatState.state || 'T'; // 'T' là ghế trống

            // Xóa thông tin ghế đã chọn khỏi originalSeatState
            delete originalSeatState[seatId];

            // Cập nhật lại cấu trúc ghế của suất chiếu trong cơ sở dữ liệu
            showtime.Room_Shape = roomShapeArray.map((r) => r.join('')).join('/');
            await showtime.save();

            // Phát sự kiện để cập nhật sơ đồ ghế cho tất cả người dùng
            emitSeatMapUpdate(io, showTimeID);
          }

          // Xóa bộ đếm thời gian (nếu có) cho ghế này
          const seatTimerId = `${showTimeID}-${row}-${col}`;
          if (seatTimers[seatTimerId]) {
            clearTimeout(seatTimers[seatTimerId]);
            delete seatTimers[seatTimerId];  // Xóa bộ đếm thời gian
          }
        }
      }
    }
  });




});

//////
/*
   //Người dùng chọn ghế
   socket.on('select_seat', async ({ showtimeId, row, col, userId }) => {
     const seatId = `${showtimeId}-${row}-${col}`;
 
     // Kiểm tra dữ liệu đầu vào
     if (!showtimeId || typeof row !== 'number' || typeof col !== 'number' || !userId) {
       return socket.emit('error', { message: 'Dữ liệu không hợp lệ' });
     }
 
     try {
       const showtime = await ShowTime.findById(showtimeId);
       if (!showtime) {
         return socket.emit('error', { message: 'Không tìm thấy suất chiếu' });
       }
 
       let roomShapeArray = showtime.Room_Shape.split('/').map((row) => row.split(''));
 
       if (!roomShapeArray[row] || !roomShapeArray[row][col]) {
         return socket.emit('error', { message: 'Ghế không tồn tại' });
       }
 
       // Kiểm tra nếu ghế đã bị khóa
       if (lockedSeats[seatId]) {
         // Thêm user mới vào danh sách hàng đợi random
         if (!lockedSeatsQueue[seatId]) lockedSeatsQueue[seatId] = [];
         if (!lockedSeatsQueue[seatId].includes(userId)) {
           lockedSeatsQueue[seatId].push(userId);
         }
 
         console.log(`Ghế ${seatId} đã bị khóa, danh sách hàng đợi:`, lockedSeatsQueue[seatId]);
 
         // Chỉ thực hiện random nếu chưa có quy trình đang xử lý
         if (!randomInProgress[seatId]) {
           randomInProgress[seatId] = true;
 
           setTimeout(() => {
             const queue = lockedSeatsQueue[seatId];
             const winnerIndex = Math.floor(Math.random() * queue.length);
             const winner = queue[winnerIndex];
 
             // Cập nhật trạng thái ghế cho người thắng
             lockedSeats[seatId] = winner;
             roomShapeArray[row][col] = 'P';
             showtime.Room_Shape = roomShapeArray.map((r) => r.join('')).join('/');
             showtime.save();
 
             // Gửi thông báo cho người thắng và những người còn lại
             queue.forEach((user) => {
               if (user === winner) {
                 io.to(user).emit('seat_locked', { seatId });
               } else {
                 io.to(user).emit('seat_unlocked', { seatId });
               }
             });
 
             // Xóa hàng đợi sau khi xử lý xong
             delete lockedSeatsQueue[seatId];
             delete randomInProgress[seatId];
             emitSeatMapUpdate(io, showtimeId);
           }, 1000); // 1 giây để xử lý random
         }
       } else {
         // Nếu ghế chưa được chọn, tiến hành khóa ghế cho người dùng
         lockedSeats[seatId] = userId;
         originalSeatState[`${row}-${col}`] = { state: roomShapeArray[row][col], userId };
         roomShapeArray[row][col] = 'P';
         showtime.Room_Shape = roomShapeArray.map((r) => r.join('')).join('/');
         await showtime.save();
         emitSeatMapUpdate(io, showtimeId);
 
         // Đặt timeout để tự động bỏ khóa ghế
         if (seatTimers[seatId]) clearTimeout(seatTimers[seatId]);
         seatTimers[seatId] = setTimeout(async () => {
           if (lockedSeats[seatId] === userId) {
             console.log(`Ghế ${seatId} đã hết thời gian khóa và sẽ bị bỏ chọn.`);
             delete lockedSeats[seatId];
             let updatedShowtime = await ShowTime.findById(showtimeId);
             if (updatedShowtime) {
               let updatedRoomShapeArray = updatedShowtime.Room_Shape.split('/').map((r) => r.split(''));
               updatedRoomShapeArray[row][col] = originalSeatState[`${row}-${col}`]?.state || 'T';
               delete originalSeatState[`${row}-${col}`];
               updatedShowtime.Room_Shape = updatedRoomShapeArray.map((r) => r.join('')).join('/');
               await updatedShowtime.save();
               emitSeatMapUpdate(io, showtimeId);
               io.to(showtimeId).emit('seat_unlocked', { row, col });
             }
           }
         }, 2 * 60 * 1000); // 2 phút
       }
     } catch (err) {
       console.error('Lỗi khi xử lý CSDL:', err);
       socket.emit('error', { message: 'Đã xảy ra lỗi, vui lòng thử lại sau' });
     }
   });
 
 
   // Người dùng bỏ chọn ghế
   socket.on('deselect_seat', async ({ showtimeId, row, col, userId }) => {
     console.log('User attempting to deselect seat:', { row, col, userId });
 
     // Lấy thông tin suất chiếu
     const showtime = await ShowTime.findById(showtimeId);
     if (!showtime) {
       return socket.emit('error', { message: 'Không tìm thấy suất chiếu' });
     }
 
     // Kiểm tra trạng thái ghế và xác thực quyền sở hữu ghế
     let roomShapeArray = showtime.Room_Shape.split('/').map((row) => row.split(''));
     const original = originalSeatState[`${row}-${col}`];  // Lấy thông tin ghế từ originalSeatState
 
     if (roomShapeArray[row][col] === 'P' && original && original.userId === userId) {
       // Nếu ghế đang bị chọn và là của người dùng này, tiến hành bỏ chọn ghế
       roomShapeArray[row][col] = original.state;  // Đặt lại trạng thái ghế ban đầu
       delete originalSeatState[`${row}-${col}`];  // Xóa ghế khỏi trạng thái giữ
 
       // Xóa ghế khỏi danh sách lockedSeats
       const seatId = `${showtimeId}-${row}-${col}`;
       if (lockedSeats[seatId]) {
         delete lockedSeats[seatId];  // Xóa ghế khỏi danh sách khóa
         console.log(`Ghế ${seatId} đã được bỏ khóa.`);
       }
 
       // Cập nhật Room_Shape sau khi bỏ chọn
       showtime.Room_Shape = roomShapeArray.map((row) => row.join('')).join('/');
       await showtime.save();
 
       // Xóa bộ đếm thời gian nếu có
       if (seatTimers[seatId]) {
         clearTimeout(seatTimers[seatId]);
         delete seatTimers[seatId];
       }
 
       // Cập nhật trạng thái ghế cho tất cả client
       io.to(showtimeId).emit('seat_unlocked', { row, col });
 
       // Phát sự kiện để cập nhật sơ đồ ghế
       emitSeatMapUpdate(io, showtimeId);
     } else {
       // Trường hợp ghế không thuộc quyền của người dùng hoặc ghế không thể bỏ chọn
       socket.emit('error', { message: 'Ghế này không thuộc quyền của bạn để bỏ chọn' });
     }
   });
 */

/////
// Khi người dùng chọn ghế
/*
 socket.on('select_seat', async ({ showtimeId, row, col, userId }) => {
   console.log('User attempting to select seat:', { row, col, userId });
   const showtime = await ShowTime.findById(showtimeId);
   if (!showtime) {
     return socket.emit('error', { message: 'Không tìm thấy suất chiếu' });
   }
 
   let roomShapeArray = showtime.Room_Shape.split('/').map((row) => row.split(''));
 
   // Kiểm tra phạm vi row và col trước khi truy cập
   if (!roomShapeArray[row] || !roomShapeArray[row][col]) {
     return socket.emit('error', { message: 'Ghế không tồn tại' });
   }
 
   if (roomShapeArray[row][col] === 'P' && originalSeatState[`${row}-${col}`]?.userId !== userId) {
     const currentSeatUser = originalSeatState[`${row}-${col}`]?.userId;
     console.log('gheesddang bị ngoi dung khac chon', {
       currentSeatUser: originalSeatState[`${row}-${col}`]?.userId,
       attemptingUser: userId,
       seatPosition: { row, col },
     })
     return socket.emit('error', { message: 'Ghế đang được chọn bởi người dùng khác', currentSeatUser },);
   }
 
   if (['T', 'V', 'D'].includes(roomShapeArray[row][col])) {
     originalSeatState[`${row}-${col}`] = { state: roomShapeArray[row][col], userId };
     roomShapeArray[row][col] = 'P'; // Đặt ghế thành đang chọn
     showtime.Room_Shape = roomShapeArray.map((row) => row.join('')).join('/');
     await showtime.save();
     emitSeatMapUpdate(io, showtimeId);  // Phát sự kiện để cập nhật sơ đồ ghế
 
     // Thêm bộ đếm thời gian 2 phút để hoàn tác trạng thái nếu không thanh toán
     const seatId = `${showtimeId}-${row}-${col}`;
     if (seatTimers[seatId]) {
       clearTimeout(seatTimers[seatId]); // Xóa bộ đếm cũ nếu có
     }
     seatTimers[seatId] = setTimeout(async () => {
       const updatedShowtime = await ShowTime.findById(showtimeId);
       if (updatedShowtime) {
         let updatedRoomShapeArray = updatedShowtime.Room_Shape.split('/').map((r) => r.split(''));
         if (updatedRoomShapeArray[row][col] === 'P') {
           updatedRoomShapeArray[row][col] = originalSeatState[`${row}-${col}`]?.state || 'T'; // Khôi phục trạng thái ban đầu
           delete originalSeatState[`${row}-${col}`];
           updatedShowtime.Room_Shape = updatedRoomShapeArray.map((r) => r.join('')).join('/');
           await updatedShowtime.save();
           emitSeatMapUpdate(io, showtimeId); // Phát sự kiện cập nhật sơ đồ ghế
           console.log(`Ghế (${row}, ${col}) đã được hoàn tác do không thanh toán trong 2 phút.`);
         }
         delete seatTimers[seatId]; // Xóa bộ đếm sau khi hoàn tác
       }
     }, 4 * 60 * 1000); // 2 phút
   } else {
     socket.emit('error', { message: 'Ghế này không khả dụng' });
   }
 });
*/
// Khi người dùng bỏ chọn ghế
/*
socket.on('deselect_seat', async ({ showtimeId, row, col, userId }) => {
  console.log('User attempting to deselect seat:', { row, col, userId });
  const showtime = await ShowTime.findById(showtimeId);
  if (!showtime) {
    return socket.emit('error', { message: 'Không tìm thấy suất chiếu' });
  }

  let roomShapeArray = showtime.Room_Shape.split('/').map((row) => row.split(''));

  const original = originalSeatState[`${row}-${col}`];
  if (roomShapeArray[row][col] === 'P' && original && original.userId === userId) {
    roomShapeArray[row][col] = original.state;
    delete originalSeatState[`${row}-${col}`];
    showtime.Room_Shape = roomShapeArray.map((row) => row.join('')).join('/');
    await showtime.save();

    // Xóa bộ đếm thời gian nếu tồn tại khi bỏ chọn ghế
    const seatId = `${showtimeId}-${row}-${col}`;
    if (seatTimers[seatId]) {
      clearTimeout(seatTimers[seatId]);
      delete seatTimers[seatId];
    }

    emitSeatMapUpdate(io, showtimeId);  // Phát sự kiện để cập nhật sơ đồ ghế
  } else {
    socket.emit('error', { message: 'Ghế này không thuộc quyền của bạn để bỏ chọn' });
  }
});
*/

/*
  socket.on('disconnect', () => {
    console.log('Người dùng ngắt kết nối:', socket.id);
  });
});
*/







// Middleware
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/user', user);
app.use('/genre', genre);
app.use('/cinema', cinema);
app.use('/room', room);
app.use('/movie', movie);
app.use('/ticket', ticketRoutes);
app.use('/review', review);
app.use('/admin', admin);
app.use('/brand', brand);
app.use('/showtime', showtime);
//danh làm:
app.use('/room', roomRoutes);
app.use('/showtimes', showTimeRoutes);;
app.use('/api', loginRoutes);
app.use('/typeseat', typeSeatRoutes);
app.use('/api', playtimeRoutes);
app.use('/order', zaloPayRoutes); // Prefix '/order' để quản lý các route liên quan đến đơn hàng
app.use('/order', require('./routes/order-controller'));
app.use('/combo', require('./routes/comboRoutes'));

//danh làm:




// Catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function (err, req, res, next) {
  // Set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Render the error page
  res.status(err.status || 500);
  res.render('error');
});


// Khởi động server
server.listen(3006, '0.0.0.0', () => {
  console.log('Server is running on http://localhost:3006');
});

module.exports = app;

