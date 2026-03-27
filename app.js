const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const bookingController = require('./controllers/bookingController');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1) Global Middleweres
// Implementing CORS
//Access-COntrol-Allow-Origin
app.use(cors());
// app.use(cors({
// origin: 'https://www.natours.com'
// }))
app.options('*', cors());
// app.options('/api/v1/tours/:id', cors());

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP headers
// app.use(
//   helmet.contentSecurityPolicy({
//     directives: {
//       defaultSrc: ["'self'"],
//       baseUri: ["'self'"],
//       fontSrc: ["'self'", 'https:', 'data:'],
//       scriptSrc: ["'self'", 'https://*.cloudflare. com'],
//       objectSrc: ["'none'"],
//       styleSrc: ["'self'", 'https:', 'unsafe-inline'],
//       upgradeInsecureRequests: [],
//     },
//   })
// );

// Further HELMET configuration for Security Policy (CSP)
// const scriptSrcUrls = [
//   'https://unpkg.com/',
//   'https://tile.openstreetmap.org',
//   'https://unpkg.com/axios@1.11.0/dist/axios.min.js',
// ];
// const styleSrcUrls = [
//   'https://unpkg.com/',
//   'https://tile.openstreetmap.org',
//   'https://fonts.googleapis.com/',
// ];
// const connectSrcUrls = [
//   'https://unpkg.com',
//   'https://tile.openstreetmap.org',
//   'ws://127.0.0.1:*',
// ];
// const fontSrcUrls = ['fonts.googleapis.com', 'fonts.gstatic.com'];

// Set security HTTP headers
// app.use(
//   helmet.contentSecurityPolicy({
//     directives: {
//       defaultSrc: ["'self'", 'data:', 'blob:', 'https:'],
//       baseUri: ["'self'"],
//       fontSrc: ["'self'", 'https:', 'data:'],
//       scriptSrc: [
//         "'self'",
//         'https:',
//         'https://cdnjs.cloudflare.com',
//         'https://unpkg.com',
//         'https://js.stripe.com',
//         'https://m.stripe.network',
//         'https://*.mapbox.com'
//       ],
//       styleSrc: ["'self'", 'https:', 'https://fonts.googleapis.com'],
//       connectSrc: [
//         "'self'",
//         'https://cdnjs.cloudflare.com',
//         'https://unpkg.com',
//         'https://*.mapbox.com',
//         'ws://127.0.0.1:*'
//       ],
//       imgSrc: [
//         "'self'",
//         'data:',
//         'blob:',
//         'https://*.tile.openstreetmap.org',
//         'https://unpkg.com'
//       ],
//       frameSrc: ["'self'", 'https://js.stripe.com'],
//       objectSrc: ["'none'"],
//       workerSrc: [
//         "'self'",
//         'data:',
//         'blob:',
//         'https://*.tiles.mapbox.com',
//         'https://api.mapbox.com',
//         'https://events.mapbox.com'
//       ],
//       childSrc: ["'self'", 'blob:'],
//       formAction: ["'self'"],
//       upgradeInsecureRequests: true
//     }
//   })
// );

// Development loging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP! please try again in an hour.',
});
app.use('/api', limiter);

app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  bookingController.webhookCheckout,
);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whiteList: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

app.use(compression());

// Test middlewere
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

// 2) Routes
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
  res.status(204).end(); // No Content
});

// Serve source maps e favicon senza generare errori
app.use((req, res, next) => {
  if (req.originalUrl.endsWith('.map') || req.originalUrl === '/favicon.ico') {
    return res.status(204).end(); // No content
  }
  next();
});

app.all('*', (req, res, next) => {
  // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  // err.status = 'fail';
  // err.statusCode = 404;

  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
