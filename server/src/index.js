const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const passport = require('passport');
const http = require('http');
const socketIO = require('socket.io');

require('dotenv').config();

const app = express();
const server = http.Server(app);
const io = socketIO(server);

const { router } = require('./routes');
const socket = require('./socket');

socket.setIO(io);

app.use(morgan('dev'));
app.use(cors());
app.use(passport.initialize());

app.get('/', (req, res) => {
  res.json({
    message: '🦄🌈✨Hello World! 🌈✨🦄',
  });
});

app.use(express.static('public'));
app.use('/', router);

function notFound(req, res, next) {
  res.status(404);
  const error = new Error(`Not Found - ${req.originalUrl}`);
  next(error);
}

// eslint-disable-next-line
function errorHandler(err, req, res, next) {
  res.status(res.statusCode || 500);
  res.json({
    message: err.message,
    stack: err.stack,
  });
}

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log('Listening on port', port);
});
