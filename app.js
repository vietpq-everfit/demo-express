var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
// var logger = require('morgan');
// import {ContainerBuilder, PackageReference} from 'node-dependency-injection'
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

const logger = require('pino')()

const {Logger, LogInput, ErrorLogInput} = require('@everfit-io/module-logger');
const loggerService = new Logger(logger, {renameContext: 'context'});

var app = express();

// app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.get('/log', (req, res) => {
  const logInput = new LogInput('log message', 'test-context', {a: 1, b: 2});
  loggerService.log(logInput);
  return res.json({});
});
app.get('/warn', (req, res) => {
  const logInput = new LogInput('warn message', 'test-context', {a: 3, b: 4});
  loggerService.warn(logInput);
  return res.json({});
});
app.get('/error', (req, res) => {
  const logInput = new ErrorLogInput('error message', new Error('test error'), 'test-context', {a: 5, b: 6});
  loggerService.error(logInput);
  return res.json({});
});


module.exports = app;
