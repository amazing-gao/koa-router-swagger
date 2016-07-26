# koa-router-swagger

# Install
```js
npm install koa-router-swagger --save
```

# Quick Start

```js
let koa = require('koa');
let bodyParser = require('koa-bodyparser');
let koaSwaggerRouter = require('koa-router-swagger');

let app = koa();

app.use(bodyParser());

let opt = {
  apiDoc: './api/api.yaml',
  controllerDir: './controller',
  redis: client
}

let swagger = new koaSwaggerRouter(app, opt);
app.use(swagger.routes());
app.use(swagger.apiExplorer());

app.listen(9000)
```

# Swagger Doc explorer

```sh
http://127.0.0.1:9000/api-explorer
```
