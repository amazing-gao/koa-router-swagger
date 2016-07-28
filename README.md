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
  redis: redisClient,
  port: 9000
}

let swagger = new koaSwaggerRouter(app, opt);
app.use(swagger.routes());
app.use(swagger.apiExplorer());

app.listen(9000)
```

* apiDoc: the swagger doc file, support json and yaml
* controllerDir: the controller dir in the apiDoc
* redis: a redis client, like ioredis
* port: koa server listen port, for open the api explorer

# Extended word of the swagger spec

## x-controller

It's an array of middleware. the order represent to the handle follow.

* file: middleware file
* handler: middleware in file

```
paths:
  /:
    get:
      description: 'Index'
      x-controller:
        - file: user
          handler: isLogin
        - file: page
          handler: userPage
```

## x-cache
It's base on koa-router-cache.

* expire: time to live, ms

```
paths:
  /test:
    get:
      description: 'Index'
      x-cache:
          expire: 10000
```


# Swagger Doc explorer

```sh
open http://127.0.0.1:9000/api-explorer
```
