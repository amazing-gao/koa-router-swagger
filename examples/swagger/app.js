'use strict';

let koa = require('koa');
let bodyParser = require('koa-bodyparser');
let redis = require('ioredis');
let logger = require('koa-logger');

let koaSwaggerRouter = require('../../');

let app = koa();

let client = new redis({
  host: '10.2.130.145',
  port: 6379,
  keyPrefix: 'test:',
  db: 1
});

app.use(bodyParser());

let opt = {
  apiDoc: './examples/swagger/api/api.yaml',
  controllerDir: './examples/swagger/controller',
  redis: client,
  port: 9000
}

let swagger = new koaSwaggerRouter(app, opt);
app.use(logger());
app.use(swagger.routes());
app.use(swagger.apiExplorer());

app.listen(9000)
