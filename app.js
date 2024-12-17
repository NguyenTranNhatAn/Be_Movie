
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
let attemptedUsers = {}; // Khai báo đối tượng attemptedUsers để lưu thông tin người dùng
const MAX_SEATS_PER_USER = 5; // Số ghế tối đa mỗi người dùng có thể chọn
let originalSeatState = {}; // Trạng thái ban đầu của ghế
const ShowTime = require('./models/ShowTime');
const seatTimers = {}; // Bộ đếm thời gian cho mỗi ghế
// Hàm gửi sơ đồ ghế chi tiết
async function emitSeatMapUpdate(io, showtimeId) {
  const showtime = await ShowTime.findById(showtimeId);
  if (!showtime) return;

  const roomShapeArray = showtime.Room_Shape.split("/").map((row) =>
    row.split("")
  );
  const detailedSeatMap = roomShapeArray.map((row, rowIndex) =>
    row.map((seat, colIndex) => {
      const seatId = `${showtimeId}-${rowIndex}-${colIndex}`;
      const seatState = originalSeatState[seatId];
      return {
        status: seat, // Trạng thái ghế (T, V, D, P)
        userId: seatState ? seatState.userId : null, // ID người dùng nếu ghế đang được giữ
        seatId: seat.seatId,
      };
    })
  );
  io.emit("seat_map_updated", { showtimeId, seatMap: detailedSeatMap });
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

  // Khi người dùng chọn ghế 
  //đúng này
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

    const seatId = `${showtimeId}-${row}-${col}`;

    // Kiểm tra xem ghế có đang được chọn không
    const currentSeat = originalSeatState[seatId];

    if (currentSeat) {
      // const timeElapsed = Date.now() - currentSeat.timestamp;

      // // Nếu ghế đã được chọn trong vòng 1 giây, xác định ai chọn trước
      // if (timeElapsed < 1000) {
      //   if (currentSeat.timestamp < Date.now()) {  // Người bấm trước sẽ được chọn
      //     return socket.emit('error', { message: 'Ghế đã được chọn bởi người khác' });
      //   }
      // }
      console.log('Fail to select seat of userId: ', userId);
      emitSeatMapUpdate(io, showtimeId); // Phát sự kiện cập nhật sơ đồ ghế
      return socket.emit(`error_${userId}`, {
        seatId,
        seatType: roomShapeArray[row][col], // Loại ghế hiện tại
        rowIndex: row,
        colIndex: col,
        message: 'Ghế đã được chọn bởi người khác', // Thông báo lỗi
      });
      //      return socket.emit(`error_${userId}`, { message: 'Ghế đã được chọn bởi người khác' });

    }

    if (['T', 'V', 'D'].includes(roomShapeArray[row][col])) {
      // Đặt ghế thành đang chọn và ghi lại thời gian
      originalSeatState[seatId] = {
        state: roomShapeArray[row][col],
        userId,
        timestamp: Date.now()  // Ghi nhận thời gian bấm chọn ghế
      };

      console.log(`Ghế (${row}, ${col}) được chọn bởi User ${userId} vào ${new Date(Date.now()).toISOString()}`);

      // Log tất cả những người đã cố gắng chọn ghế này
      console.log("Những người đã cố gắng chọn ghế:", originalSeatState);

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
            socket.emit(`reset_selected_seats_${userId}`, {
              seatId,
              seatType: updatedRoomShapeArray[row][col],
              rowIndex: row,
              colIndex: col,
            });
            console.log(`Ghế (${row}, ${col}) đã được hoàn tác do không thanh toán trong 2 phút.`);
          }
          delete seatTimers[seatId]; // Xóa bộ đếm sau khi hoàn tác
        }
      }, 3 * 60 * 1000); // 2 phút

      // Xác định ai là người giữ ghế dựa trên timestamp
      const allAttempts = Object.values(originalSeatState).filter(seat => seat.state === 'P');

      // Log thông tin các người đã chọn ghế và xác định ai giữ ghế
      allAttempts.sort((a, b) => a.timestamp - b.timestamp);  // Sắp xếp theo timestamp

      if (allAttempts.length > 0) {
        const firstUser = allAttempts[0];
        console.log(`Người giữ ghế (${row}, ${col}): User ${firstUser.userId} vào ${new Date(firstUser.timestamp).toISOString()}`);
      }
    } else {
      socket.emit('error', { message: 'Ghế này không khả dụng' });
    }
  });
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
  
    const seatId = `${row}-${col}`;
  
    // Kiểm tra xem ghế có đang được chọn không
    const currentSeat = originalSeatState[seatId];
  
    if (currentSeat) {
      const timeElapsed = Date.now() - currentSeat.timestamp;
  
      // Nếu ghế đã được chọn trong vòng 1 giây, xác định ai chọn trước
      if (timeElapsed < 1000) {
        if (currentSeat.timestamp < Date.now()) {
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
  
      console.log(`Ghế (${row}, ${col}) được chọn bởi User ${userId} vào ${new Date(Date.now()).toISOString()}`);
  
      // Log tất cả những người đã cố gắng chọn ghế này
      console.log("Danh sách những người dùng chọn ghế:");
      const attempts = Object.entries(originalSeatState)
        .filter(([key, seat]) => key === seatId)
        .map(([key, seat]) => ({
          userId: seat.userId,
          timestamp: seat.timestamp,
          formattedTime: new Date(seat.timestamp).toISOString()
        }));
  
      attempts.forEach((attempt, index) => {
        console.log(`Người dùng ${index + 1}: User ${attempt.userId} chọn ghế ${seatId} lúc ${attempt.formattedTime}`);
      });
  
      // Sắp xếp theo thời gian
      attempts.sort((a, b) => a.timestamp - b.timestamp);
  
      if (attempts.length > 0) {
        const firstUser = attempts[0];
        console.log(`=> Kết luận: User ${firstUser.userId} giữ ghế ${seatId} (bấm trước vào ${firstUser.formattedTime})`);
      }
  
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
  
  */

  // đúng này




  // Khi người dùng bỏ chọn ghế
  socket.on('deselect_seat', async ({ showtimeId, row, col, userId }) => {
    console.log('User attempting to deselect seat:', { row, col, userId });

    const showtime = await ShowTime.findById(showtimeId);
    if (!showtime) {
      return socket.emit('error', { message: 'Không tìm thấy suất chiếu' });
    }

    let roomShapeArray = showtime.Room_Shape.split('/').map((row) => row.split(''));

    const original = originalSeatState[`${showtimeId}-${row}-${col}`];
    if (roomShapeArray[row][col] === 'P' && original && original.userId === userId) {
      roomShapeArray[row][col] = original.state;
      delete originalSeatState[`${showtimeId}-${row}-${col}`];
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
          const seatId = `${showTimeID}-${row}-${col}`;
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

//đúng rồi
