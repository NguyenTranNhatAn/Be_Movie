
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
var paymentRoute = require("./routes/payment");


const roomRoutes = require('./routes/roomRoutes');
const showTimeRoutes = require('./routes/showtimeRoutes');
const loginRoutes = require('./routes/loginRoutes');
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
const seatTimers = {}; // To keep track of seat selection timers
let originalSeatState = {}; // Tạo đối tượng để lưu trạng thái ban đầu của ghế

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Khi người dùng chọn ghế
  socket.on('select_seat', async ({ showtimeId, row, col }) => {
    
    const showtime = await ShowTime.findById(showtimeId);
    if (!showtime) {
      return socket.emit('error', { message: 'Showtime not found' });
    }

    let roomShapeArray = showtime.Room_Shape.split('/').map(row => row.split(''));

    // Kiểm tra nếu ghế hiện đang trống (T: thường, V: VIP, D: Ghế đôi)
    if (roomShapeArray[row][col] === 'T' || roomShapeArray[row][col] === 'V' || roomShapeArray[row][col] === 'D') {
      // Lưu trạng thái ban đầu của ghế vào originalSeatState
      originalSeatState[`${row}-${col}`] = roomShapeArray[row][col];
      
      // Update the seat and its adjacent pair if it's a double seat (D)
      if (roomShapeArray[row][col] === 'D') {
        const adjacentCol = col % 2 === 0 ? col + 1 : col - 1;
        if (roomShapeArray[row][adjacentCol] === 'D') {
          roomShapeArray[row][col] = 'P';
          roomShapeArray[row][adjacentCol] = 'P';  // Update both seats to 'P' (pending)
          showtime.Room_Shape = roomShapeArray.map(row => row.join('')).join('/');
          await showtime.save();

          // Emit event for both seats
          io.emit('seat_selected', { row, col });
          io.emit('seat_selected', { row, col: adjacentCol });

          // Set timers to revert the seats if payment is not made within 2 minutes
          const seatId = `${showtimeId}-${row}-${col}`;
          if (seatTimers[seatId]) {
            clearTimeout(seatTimers[seatId]); // Clear previous timer if it exists
          }

          seatTimers[seatId] = setTimeout(async () => {
            const updatedShowtime = await ShowTime.findById(showtimeId);
            if (updatedShowtime) {
              let updatedRoomShapeArray = updatedShowtime.Room_Shape.split('/').map(row => row.split(''));

              // Revert seats back to original state (D)
              updatedRoomShapeArray[row][col] = 'D';
              updatedRoomShapeArray[row][adjacentCol] = 'D';
              updatedShowtime.Room_Shape = updatedRoomShapeArray.map(row => row.join('')).join('/');
              await updatedShowtime.save();

              io.emit('seat_reverted', { row, col });
              io.emit('seat_reverted', { row, col: adjacentCol });

              delete seatTimers[seatId]; // Remove the timer after reverting the seat
            }
          }, 2 * 60 * 1000); // 2 minutes timer
        }
      } else {
        roomShapeArray[row][col] = 'P'; // Set seat to Pending
        showtime.Room_Shape = roomShapeArray.map(row => row.join('')).join('/');
        await showtime.save();
       
        io.emit('seat_selected', { row, col });

        // Set timer for single seat
        const seatId = `${showtimeId}-${row}-${col}`;
        if (seatTimers[seatId]) {
          clearTimeout(seatTimers[seatId]);
        }

        seatTimers[seatId] = setTimeout(async () => {
          const updatedShowtime = await ShowTime.findById(showtimeId);
          if (updatedShowtime) {
            let updatedRoomShapeArray = updatedShowtime.Room_Shape.split('/').map(row => row.split(''));

            // Revert seat back to original state từ trạng thái ban đầu đã lưu
            const originalState = originalSeatState[`${row}-${col}`];
            if (originalState) {
              updatedRoomShapeArray[row][col] = originalState; // Khôi phục trạng thái ban đầu
              delete originalSeatState[`${row}-${col}`]; // Xóa trạng thái đã lưu sau khi sử dụng
            }

            updatedShowtime.Room_Shape = updatedRoomShapeArray.map(row => row.join('')).join('/');
            await updatedShowtime.save();

            io.emit('seat_reverted', { row, col });

            delete seatTimers[seatId];
          }
        }, 2 * 60 * 1000); // 2 minutes timer
      }
    } else if(roomShapeArray[row][col] === 'P') {
       const updatedShowtime = await ShowTime.findById(showtimeId);
          if (updatedShowtime) {
            let updatedRoomShapeArray = updatedShowtime.Room_Shape.split('/').map(row => row.split(''));

            // Revert seat back to original state từ trạng thái ban đầu đã lưu
            const originalState = originalSeatState[`${row}-${col}`];
            if (originalState) {
              updatedRoomShapeArray[row][col] = originalState; // Khôi phục trạng thái ban đầu
              delete originalSeatState[`${row}-${col}`]; // Xóa trạng thái đã lưu sau khi sử dụng
            }

            updatedShowtime.Room_Shape = updatedRoomShapeArray.map(row => row.join('')).join('/');
            await updatedShowtime.save();

            io.emit('seat_reverted', { row, col });
    }}
     else {
      socket.emit('error', { message: 'Seat is not available' });
    }
  });

  // Khi người dùng thanh toán ghế
  socket.on('pay_for_seats', async ({ showtimeId, seats }) => {
    const showtime = await ShowTime.findById(showtimeId);
    if (!showtime) {
      return socket.emit('error', { message: 'Showtime not found' });
    }

    let roomShapeArray = showtime.Room_Shape.split('/').map(row => row.split(''));

    seats.forEach(({ row, col }) => {
      if (roomShapeArray[row][col] === 'P') {
        roomShapeArray[row][col] = 'U'; // Set seat to booked
      }

      // Clear timers for the seats
      const seatId = `${showtimeId}-${row}-${col}`;
      if (seatTimers[seatId]) {
        clearTimeout(seatTimers[seatId]);
        delete seatTimers[seatId];
      }
    });

    showtime.Room_Shape = roomShapeArray.map(row => row.join('')).join('/');
    await showtime.save();

    // Emit booking confirmation
    seats.forEach(({ row, col }) => {
      io.emit('seat_booked', { row, col });
    });
  });


  // Khi người dùng bỏ chọn ghế
  socket.on('deselect_seat', async ({ showtimeId, row, col }) => {
    const showtime = await ShowTime.findById(showtimeId);
    if (!showtime) {
      return socket.emit('error', { message: 'Showtime not found' });
    }

    let roomShapeArray = showtime.Room_Shape.split('/').map(row => row.split(''));

    // Khôi phục trạng thái ban đầu của ghế nếu ghế đang ở trạng thái "P" (pending)
    let updatedRoomShapeArray = updatedShowtime.Room_Shape.split('/').map(row => row.split(''));

            // Revert seat back to original state từ trạng thái ban đầu đã lưu
            const originalState = originalSeatState[`${row}-${col}`];
            if (originalState) {
              updatedRoomShapeArray[row][col] = originalState; // Khôi phục trạng thái ban đầu
              delete originalSeatState[`${row}-${col}`]; // Xóa trạng thái đã lưu sau khi sử dụng
            }

            updatedShowtime.Room_Shape = updatedRoomShapeArray.map(row => row.join('')).join('/');
            await updatedShowtime.save();

            io.emit('seat_reverted', { row, col });
  });



  // Khi người dùng ngắt kết nối
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
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
app.use('/review', review);
app.use('/admin', admin);
app.use('/brand', brand);
app.use("/payment", paymentRoute);
//danh làm {

//danh làm:
app.use('/room', roomRoutes);
app.use('/showtimes', showTimeRoutes);;
app.use('/api', loginRoutes);
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
//payment



// Khởi động server
server.listen(3006, () => {
  console.log('Server is running on http://localhost:3006');
});


module.exports = app;

