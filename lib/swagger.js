'use strict';

let _ = require('lodash')
let debug = require('debug')('koa-router-swagger:swagger');
let fs = require('fs');
let pathUtil = require('path');
let router = require('koa-router')();
let swaggerParser = require('swagger-parser');
let cache = require('koa-router-cache');
let compose = require('koa-compose');
let timer = require('koa-timer')({ slow: 50, debug: 'koa-router-swagger:timer'});

let swaggerRequest = require('./request');
let swaggerResponse = require('./response');
let cacheUtil = require('./util/cache');
let urlUtil = require('./util/url');

module.exports = swagger;

function swagger(app, opt) {
  if (!_.isObject(opt))
    throw new Error('koa-router-swagger invalid options');

  this.app = app;
  this.apiDoc = opt.apiDoc;
  this.controllerDir = opt.controllerDir;
  this.redis = opt.redis;
  this.port = opt.port || 80;
  this.api = null;
  this.cache = null;

  if (this.redis)
    this.cache = cache.RedisCache(this.redis);

  if (!fs.existsSync(this.apiDoc)) throw new Error('api file not exists');
  if (!fs.existsSync(this.controllerDir)) throw new Error('controllerDir not exists');

  swaggerParser.validate(this.apiDoc, {validate: {schema: false, spec: false}}, (error, api)=> {
    if (error) throw error

    debug(`swagger version: ${api.swagger}`);
    debug(`api title: ${api.info.title}, version: ${api.info.version}`);
    debug(`load api document ${this.apiDoc}`);
    debug(`load controller ${this.controllerDir}`);

    this.api = api;
    this.parsePaths();
  })

  return this;
}

swagger.prototype.routes = function() {
  return router.routes();
}

swagger.prototype.parsePaths = function() {
  _.forEach(this.api.paths, (config, path)=> {
    let reallyPath = pathUtil.join(this.api.basePath || '', path);
    reallyPath = urlUtil.convert2RouterUrl(reallyPath);

    this.parsePath(config, reallyPath);
  })
};

swagger.prototype.parsePath = function(config, apiPath) {
  _.forEach(config, (methodConfig, method)=> {
    // controller extended word
    if (methodConfig['x-controller'] == undefined || methodConfig['x-controller'].length == 0) {
      debug(`${apiPath} ${method} no controllers`)
      return true;
    }

    // cache extend word
    let cacheMiddleware = null;
    const cacheConfig = methodConfig['x-cache']
    if (cacheConfig != undefined && cacheConfig.expire) {
      const key = `${method.toUpperCase()} ${apiPath}`

      const options = {};
      _.set(options, `${key}`, {
        key: cacheUtil.defaultCacheKeyGen,
        expire: cacheConfig.expire,
        get: this.cache.get,
        set: this.cache.set,
        passthrough: this.cache.passthrough,
        destroy: this.cache.destroy
      })

      cacheMiddleware = cache(this.app, options);
    }

    debug('read path config: ', methodConfig);

    let middlewares = this.loadCustomMiddlewares(methodConfig['x-controller']);

    middlewares.unshift(timer(swaggerResponse(methodConfig.responses)));
    middlewares.unshift(timer(swaggerRequest(methodConfig.parameters)));

    if (cacheMiddleware)
      middlewares.unshift(timer(cacheMiddleware));

    middlewares.unshift(apiPath);
    router[method].apply(router, middlewares);
  });
};

swagger.prototype.loadCustomMiddlewares = function(controllers) {
  let middlewares = [];
  _.forEach(controllers, (controller)=> {
    let module = require(pathUtil.resolve(this.controllerDir, controller.file));
    let exportedFun = module[controller.handler];

    if (!_.isFunction(exportedFun)) {
      debug(`x-controller:handler is not a function ${controller.handler}!`)
      return;
    }

    let middleware = timer(exportedFun);
    middlewares.push(middleware)
  })
  return middlewares;
};

swagger.prototype.apiExplorer = function() {
  let views = require('koa-views');
  let mount = require('koa-mount');
  let statics = require('koa-static');
  let http = require('http');

  const self = this;
  const swaggerDist = require('koa-router-swagger-ui/index').dist;

  // mount api doc files directory
  self.app.use(mount('/api-doc-file', statics(pathUtil.dirname(self.apiDoc))));

  // mount swagger-ui dist directory
  self.app.use(mount('/koa-router-swagger', statics(swaggerDist)));

  // mount swagger-ui html
  self.app.use(mount('/api-explorer', views(swaggerDist, {map: {html: 'nunjucks'}})));
  self.app.use(mount('/api-explorer', function* (next) {
    const ctx = this;
    yield ctx.render('index', {url: pathUtil.basename(self.apiDoc)})
  }));

  console.log(`ApiExplorer: http://127.0.0.1:${self.port}/api-explorer`)
  return function* (next) {yield next;}
}


