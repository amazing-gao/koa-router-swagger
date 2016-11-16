# koa-router-swagger

# Feature

* built-in swagger ui
* parse swagger doc file to koa router
* support redis cache
* support parameters form valid (incomplete)

# Install
```js
npm install koa-router-swagger@next --save
```

# Quick Start

```js
let Koa = require('koa');
let Router = require('koa-router-swagger');
let bodyParser = require('koa-bodyparser');

let app = new Koa();

app.use(bodyParser());

let opt = {
  apiDoc: './api/api.yaml',
  controllerDir: './controller',
  redis: redisClient,
  port: 9000
}

let swagger = new Router(app, opt);
app.use(swagger.routes());
app.use(swagger.apiExplorer());

app.listen(9000)
```

# API

## constructor(app, options)
* app - a koa app instance.

* options
  - apiDoc - the swagger doc file, support json and yaml.
  - controllerDir - the controller dir in the apiDoc.
  - redis - a redis client, like ioredis.
  - port - koa server listen port, just for quick open the api explorer, default *true*.
  - versioning - enable or disable swagger doc major version to you api url, default *true*.
  - apiExplorerPath - mount api-explorer to path. default */api-explorer*
  - noApiExplorerOnline - not show api explorer on production.

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
