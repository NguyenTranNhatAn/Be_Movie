
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

const ShowTime = require('./models/ShowTime');
const lockedSeats = {}; // Danh sách ghế bị khóa
const seatTimers = {}; // Bộ đếm thời gian cho mỗi ghế
let originalSeatState = {}; // Trạng thái ban đầu của ghế
const MAX_SEATS_PER_USER = 5; // Số ghế tối đa mỗi người dùng có thể chọn

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
  console.log('Người dùng kết nối:', socket.id);

  // Lưu thông tin người dùng khi kết nối
  socket.on('user_join', ({ userId, showtimeId }) => {
    socket.userId = userId;
    socket.showtimeId = showtimeId;
    socket.join(showtimeId); // Tham gia phòng theo suất chiếu
  });

  // Người dùng chọn ghế
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

      // Kiểm tra nếu ghế đang bị khóa
      if (lockedSeats[seatId] && lockedSeats[seatId] !== userId) {
        // Log thông tin ghế bị khóa bởi người khác
        console.log(`Ghế ${seatId} đã bị khóa bởi người dùng khác: ${lockedSeats[seatId]}`);
        return socket.emit('error', { message: 'Ghế này đã bị khóa bởi người dùng khác' });
      }

      // Kiểm tra số ghế tối đa
      const userLockedSeats = Object.values(lockedSeats).filter((id) => id === userId).length;
      if (userLockedSeats >= MAX_SEATS_PER_USER) {
        return socket.emit('error', { message: 'Bạn không thể chọn quá 5 ghế cùng lúc' });
      }

      // Xử lý trạng thái ghế
      if (['T', 'V', 'D'].includes(roomShapeArray[row][col])) {
        // Nếu ghế đã bị người dùng khác chọn và bị khóa
        if (lockedSeats[seatId] && lockedSeats[seatId] !== userId) {
          console.log(`Ghế ${seatId} đã bị người dùng khác xóa/huỷ chọn.`);
          // Bạn có thể xóa ghế khỏi danh sách của người đã chọn
          delete lockedSeats[seatId];
        }

        // Tiến hành khóa ghế cho người dùng hiện tại
        lockedSeats[seatId] = userId;
        originalSeatState[`${row}-${col}`] = { state: roomShapeArray[row][col], userId };
        roomShapeArray[row][col] = 'P'; // Đặt ghế thành "đang chọn"
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
        }, 0.3 * 60 * 1000); // 2 phút
      } else {
        socket.emit('error', { message: 'Ghế này không khả dụng' });
      }
    } catch (err) {
      console.error('Lỗi khi xử lý CSDL:', err);
      socket.emit('error', { message: 'Đã xảy ra lỗi, vui lòng thử lại sau' });
    }
  });

  // Người dùng bỏ chọn ghế
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


  // Khi người dùng rời phòng
  // Khi người dùng rời phòng
  socket.on('disconnect', async () => {
    const { userId, showtimeId } = socket;
    if (!userId || !showtimeId) return;

    // Kiểm tra tất cả các ghế trong danh sách khóa để giải phóng ghế của người dùng khi họ rời phòng
    for (const seatId in lockedSeats) {
      if (lockedSeats[seatId] === userId) {
        delete lockedSeats[seatId];  // Xóa ghế khỏi danh sách khóa
        console.log(`Ghế ${seatId} đã được bỏ khóa.`);

        const [showId, row, col] = seatId.split('-');
        const showtime = await ShowTime.findById(showId);
        if (showtime) {
          // Lấy thông tin về sơ đồ phòng chiếu
          let roomShapeArray = showtime.Room_Shape.split('/').map((r) => r.split(''));

          // Khôi phục lại trạng thái ghế về ban đầu (T = Trống hoặc trạng thái ban đầu)
          if (roomShapeArray[row][col] === 'P') {
            // Đặt lại trạng thái ghế như ban đầu từ originalSeatState
            roomShapeArray[row][col] = originalSeatState[`${row}-${col}`]?.state || 'T';
            delete originalSeatState[`${row}-${col}`];  // Xóa thông tin ghế khỏi originalSeatState

            // Cập nhật lại Room_Shape sau khi khôi phục
            showtime.Room_Shape = roomShapeArray.map((r) => r.join('')).join('/');
            await showtime.save();

            // Cập nhật sơ đồ ghế cho tất cả các client
            emitSeatMapUpdate(io, showId);

            // Phát sự kiện để thông báo ghế đã được mở khóa
            io.to(showId).emit('seat_unlocked', { row, col });
          }
        }
      }
    }
  });

});


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

