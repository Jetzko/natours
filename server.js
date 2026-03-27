const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');
// import mongoose from 'mongoose';
// import dotenv from 'dotenv';
// import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);

process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: `${__dirname}/config.env` });
const app = require('./app');

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.PASSWORD);
mongoose.connect(DB);

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', err => {
  console.log('UNHANDLER REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.log('🚀SIGTERM RECEIVED. Shutting down gracefully.');
  server.close(() => {
    console.log('💥 Process terminated!');
  });
});
