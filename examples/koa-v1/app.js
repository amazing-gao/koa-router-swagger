'use strict';

let koa = require('koa');
let bodyParser = require('koa-bodyparser');
let redis = require('ioredis');
let logger = require('koa-logger');

let koaSwaggerRouter = require('../../');

let app = koa();

// let client = new redis({
//   host: '10.2.130.145',
//   port: 6379,
//   keyPrefix: 'test:',
//   db: 1
// });

app.use(bodyParser());
app.use(logger());

let opt = {
  apiDoc: './examples/koa-v1/api/api.yaml',
  controllerDir: './examples/koa-v1/controller',
  // redis: client,
  port: 9000
}

let swagger = new koaSwaggerRouter(app, opt);
app.use(swagger.routes());
app.use(swagger.apiExplorer());

app.listen(9000)
