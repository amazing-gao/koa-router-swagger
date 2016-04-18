'use strict';

let koa = require('koa');
let bodyParser = require('koa-bodyparser');
let koaSwaggerRouter = require('../../index');

let app = koa();

app.use(bodyParser());

let opt = {
  apiDoc: './api/api.yaml',
  controllerDir: './controller'
}

app.use(new koaSwaggerRouter(opt));

app.listen(9000)
