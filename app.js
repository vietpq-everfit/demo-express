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

const {RabbitQueueService, QueueMessage, ExchangeType, KueQueueService} = require('@everfit-io/module-queue');

const rabbitService = new RabbitQueueService('amqps://xelsoodm:CrhEv7KH6S8wH9vZJ-wYGgG9QCDsTsgL@shark.rmq.cloudamqp.com/xelsoodm');
const kueService = new KueQueueService('redis://localhost:6379');

var app = express();

// app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.get('/log', (req, res) => {
  // const logInput = new LogInput('log message', 'test-context', {a: 1, b: 2});
  loggerService.log('log message', 'test-context', {
    apiRoute: '',
    userTrace: {
      reqId: '',
      userId: '',
      ip: '',
    },
    reqBody: {a: 1, b: 2},
    executedTime: '',
  });
  return res.json({});
});
app.get('/warn', (req, res) => {
  // const logInput = new LogInput('warn message', 'test-context', {a: 3, b: 4});
  loggerService.warn('warn message', 'test-context', {a: 3, b: 4});
  return res.json({});
});
app.get('/error', (req, res) => {
  const error = new Error('test error');
  // const logInput = new ErrorLogInput('error message', new Error('test error'), 'test-context', {a: 5, b: 6});
  loggerService.error('error message', 'test-context', error.stack, {a: 5, b: 6});
  return res.json({});
});
app.get('/debug', (req, res) => {
  // const logInput = new ErrorLogInput('error message', new Error('test error'), 'test-context', {a: 5, b: 6});
  loggerService.debug('debug message', 'test-context', {a: 7, b: 8}, 'meo meo');
  return res.json({});
});


const rabbitExchange = rabbitService.declareExchange(
  'CDC-RABBIT',
  ExchangeType.FANOUT,
);

app.post('/rabbit', async (req, res) => {
  const qMessage = new QueueMessage(Object.assign({queue: 'RABBIT'}, req.body));
  // console.log('qMessage:', qMessage);
  rabbitService.publish(qMessage, rabbitExchange);
  return res.json({});
})

async function consumeRabbitMessage( ) {
  const rabbitQueue = await rabbitService.declareQueue(
    'CDC-RABBIT-QUEUE',
    rabbitExchange,
  );
  rabbitService.consume(rabbitQueue, onReceiveMessage);
}

function onReceiveMessage(data) {
  if (data.error) {
    throw new Error('error onReceiveMessage');
  }
  console.log('receive data:', data);
  console.log('calculate rs:', data.a + data.b);
}

consumeRabbitMessage();

app.post('/kue', async (req, res) => {
  const qMessage = new QueueMessage(Object.assign({queue: 'KUE'}, req.body));
  // console.log('qMessage:', qMessage);
  const job = kueService.publish(qMessage, 'KueRoutingKey');
  console.log('job:', job.id);
  return res.json({});
})

async function consumeKueMessage() {
  kueService.consume('KueRoutingKey', onReceiveMessage);
}
consumeKueMessage();

module.exports = app;
