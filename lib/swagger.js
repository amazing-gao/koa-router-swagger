'use strict';

let _ = require('lodash')
let debug = require('debug')('koa-swagger-router:swagger');
let fs = require('fs');
let pathUtil = require('path');
let router = require('koa-router')();
let swaggerParser = require('swagger-parser');
let cache = require('koa-router-cache');

let views = require('koa-views');
let mount = require('koa-mount');
let statics = require('koa-static');

let paramParser = require('./parameters');
let responser = require('./responses');
let cacheUtil = require('./util/cache');
let urlUtil = require('./util/url');

module.exports = swagger;

function swagger(app, opt) {
  const self = this;

  if (!_.isObject(opt))
    throw new Error('koa-swagger-router invalid options');

  this.app = app;
  this.apiDoc = opt.apiDoc;
  this.controllerDir = opt.controllerDir;
  this.redis = opt.redis;
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

    // fs.writeFileSync('./api.json', JSON.stringify(api));

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
    this.parsePath(config, path);
  })
};

swagger.prototype.parsePath = function(config, path) {
  let reallyPath = pathUtil.join(this.api.basePath || '', path);
  reallyPath = urlUtil.convert2RouterUrl(reallyPath);

  _.forEach(config, (methodConfig, method)=> {
    // controller extended word
    if (methodConfig['x-controller'] == undefined || methodConfig['x-controller'].length == 0) {
      debug(`${reallyPath} ${method} no controllers`)
      return true;
    }

    // cache extend word
    let cacheMiddleware = null;
    const cacheConfig = methodConfig['x-cache']
    if (cacheConfig != undefined && cacheConfig.expire) {
      const key = `${method.toUpperCase()} ${reallyPath}`

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

    let middlewares = this.loadMiddleware(methodConfig['x-controller']);

    if (!_.isArray(middlewares))
      return console.warn(`middlewares: ${middlewares} must be array`);

    if (cacheMiddleware)
      middlewares.unshift(cacheMiddleware);

    this.applyPathMethod(reallyPath, method, methodConfig, middlewares);
  });
};

swagger.prototype.loadMiddleware = function(controllers) {
  let middlewares = [];
  _.forEach(controllers, (controller)=> {
    let module = require(pathUtil.resolve(this.controllerDir, controller.file))
    let middleware = module[controller.handler];
    if (middleware)
      middlewares.push(middleware)
    else
      debug(`middleware missing ${controller.handler}!`)
  })
  return middlewares;
};

swagger.prototype.applyPathMethod = function(reallyPath, method, methodConfig, middlewares) {
  router[method](reallyPath, responser(methodConfig.responses), paramParser(methodConfig.parameters));

  _.forEach(middlewares, function (middleware) {
    debug(`use [${method}] [${reallyPath}] [${middleware.name}]`)
    router[method](reallyPath, middleware);
  });
};

swagger.prototype.apiExplorer = function() {
  const self = this;
  const swaggerDist = require('koa-router-swagger-ui/index').dist;

  console.info(pathUtil.basename(self.apiDoc));
  console.info(pathUtil.dirname(self.apiDoc));
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

  return function* (next) {yield next;}
}


