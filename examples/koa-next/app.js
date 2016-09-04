'use strict';

let Koa = require('koa');
let bodyParser = require('koa-bodyparser');
let logger = require('koa-logger');

let koaSwaggerRouter = require('../../');

let app = new Koa();

app.use(bodyParser());
app.use(logger());

let opt = {
  apiDoc: './examples/koa-next/api/api.yaml',
  controllerDir: './examples/koa-next/controller',
  port: 9000
}

let swagger = new koaSwaggerRouter(app, opt);
app.use(swagger.routes());
app.use(swagger.apiExplorer());

app.listen(9000)