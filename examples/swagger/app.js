'use strict';

let koa = require('koa');
let bodyParser = require('koa-bodyparser');

let koaSwaggerRouter = require('koa-router-swagger');

let app = koa();

app.use(bodyParser());

let opt = {
  apiDoc: './api/api.yaml',
  controllerDir: './controller'
}

let swagger = new koaSwaggerRouter(app, opt);
app.use(swagger.routes());
app.use(swagger.apiExplorer());

app.listen(9000)
