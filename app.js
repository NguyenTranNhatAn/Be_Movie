var createError = require('http-errors');
var express = require('express');
const cors = require('cors');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const dotenv = require('dotenv');

dotenv.config(); // Load các biến môi trường từ .env


var usersRouter = require('./routes/user');
const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://nan22052004:an22@cluster0.rhjpd.mongodb.net/movie', {
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
//danh làm {
const roomRoutes = require('./routes/roomRoutes');
const showTimeRoutes = require('./routes/showtimeRoutes');
const authRoutes = require('./routes/auth');
const loginRoutes = require('./routes/loginRoutes');
//danh làm }
var app = express();
app.use(cors());
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/user', user);
app.use('/genre', genre);
app.use('/cinema', cinema);
app.use('/room', room);
app.use('/movie', movie);
//danh làm {
app.use('/room', roomRoutes);
app.use('/showtimes', showTimeRoutes);
app.use('/api', authRoutes);
app.use('/api', loginRoutes);
//danh làm }

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
