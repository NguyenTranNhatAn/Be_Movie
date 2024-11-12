
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

const ShowTime = require('./models/ShowTime');  // 

const seatTimers = {}; // Bộ đếm thời gian cho mỗi ghế
let originalSeatState = {}; // Trạng thái ban đầu của ghế

// Xử lý kết nối Socket.IO
io.on('connection', (socket) => {
  console.log('Người dùng kết nối:', socket.id);



  // Khi người dùng chọn ghế
  socket.on('select_seat', async ({ showtimeId, row, col, userId }) => {
    const showtime = await ShowTime.findById(showtimeId);
    if (!showtime) {
      return socket.emit('error', { message: 'Không tìm thấy suất chiếu' });
    }

    let roomShapeArray = showtime.Room_Shape.split('/').map((row) => row.split(''));

    if (roomShapeArray[row][col] === 'P' && originalSeatState[`${row}-${col}`]?.userId !== userId) {
      return socket.emit('error', { message: 'Ghế đang được chọn bởi người dùng khác' });
    }

    if (['T', 'V', 'D'].includes(roomShapeArray[row][col])) {
      originalSeatState[`${row}-${col}`] = { state: roomShapeArray[row][col], userId };
      roomShapeArray[row][col] = 'P'; // Đặt ghế thành đang chọn
      showtime.Room_Shape = roomShapeArray.map((row) => row.join('')).join('/');
      await showtime.save();
      io.emit('seat_map_updated');  // Phát sự kiện để cập nhật sơ đồ ghế

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
            io.emit('seat_map_updated'); // Phát sự kiện cập nhật sơ đồ ghế
            console.log(`Ghế (${row}, ${col}) đã được hoàn tác do không thanh toán trong 2 phút.`);
          }
        }
      }, 20 * 1000); // 20 giây 
    } else {
      socket.emit('error', { message: 'Ghế này không khả dụng' });
    }
  });

  // Khi người dùng thanh toán ghế
  socket.on('pay_for_seats', async ({ showtimeId, seats, userId }) => {
    const showtime = await ShowTime.findById(showtimeId);
    if (!showtime) {
      return socket.emit('error', { message: 'Không tìm thấy suất chiếu' });
    }

    let roomShapeArray = showtime.Room_Shape.split('/').map((row) => row.split(''));

    seats.forEach(({ row, col }) => {
      if (roomShapeArray[row][col] === 'P' && originalSeatState[`${row}-${col}`]?.userId === userId) {
        roomShapeArray[row][col] = 'U';  // Đánh dấu ghế đã đặt
      }
      const seatId = `${showtimeId}-${row}-${col}`;
      if (seatTimers[seatId]) {
        clearTimeout(seatTimers[seatId]); // Xóa bộ đếm thời gian sau khi thanh toán
        delete seatTimers[seatId];
      }
    });

    showtime.Room_Shape = roomShapeArray.map((row) => row.join('')).join('/');
    await showtime.save();
    io.emit('seat_map_updated');  // Phát sự kiện để cập nhật sơ đồ ghế
  });


  // Khi người dùng bỏ chọn ghế
  socket.on('deselect_seat', async ({ showtimeId, row, col, userId }) => {
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
      io.emit('seat_map_updated');  // Phát sự kiện để cập nhật sơ đồ ghế
    } else {
      socket.emit('error', { message: 'Ghế này không thuộc quyền của bạn để bỏ chọn' });
    }
  });

  // Khi người dùng thanh toán ghế
  // Lắng nghe sự kiện 'payment_completed' từ client
  socket.on('payment_completed', async ({ showtimeId, seats }) => {
    console.log('Received payment_completed event:', showtimeId, seats);
    try {
      const showtime = await ShowTime.findById(showtimeId);

      if (!showtime) {
        socket.emit('error', { message: 'Showtime not found' });
        return;
      }

      // Cập nhật trạng thái ghế trong layout Room_Shape
      let updatedShape = showtime.Room_Shape.split('/');

      seats.forEach(seat => {
        const { row, col } = seat;
        if (row < updatedShape.length) {
          let rowSeats = updatedShape[row].split('');
          if (col < rowSeats.length && rowSeats[col] === 'P') {
            rowSeats[col] = 'U'; // Chuyển trạng thái ghế từ 'P' sang 'U'
            updatedShape[row] = rowSeats.join('');
          }
        }
      });

      showtime.Room_Shape = updatedShape.join('/');
      await showtime.save();

      // Phát sự kiện thông báo cập nhật ghế thành công đến các client
      socket.emit('seats_updated', { showtimeId, seats, status: 'U' });

    } catch (error) {
      console.error('Error updating seats:', error);
      socket.emit('error', { message: 'Error updating seats' });
    }
  });


  socket.on('disconnect', () => {
    console.log('Người dùng ngắt kết nối:', socket.id);
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
server.listen(3006, () => {
  console.log('Server is running on http://localhost:3006');
});

module.exports = app;

