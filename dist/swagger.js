'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

let _ = require('lodash');
let debug = require('debug')('koa-router-swagger:swagger');
let fs = require('fs');
let pathUtil = require('path');
let Router = require('koa-router');
let swaggerParser = require('swagger-parser');
let cache = require('koa-router-cache');
let compose = require('koa-compose');
let timer = require('koa-timer')({ slow: 50, debug: 'koa-router-swagger:timer' });

let swaggerRequest = require('./request');
let swaggerResponse = require('./response');
let cacheUtil = require('./util/cache');
let urlUtil = require('./util/url');

module.exports = swagger;

function swagger(app, opt) {
  if (!_.isObject(opt)) throw new Error('koa-router-swagger invalid options');

  this.app = app;
  this.apiDoc = opt.apiDoc;
  this.controllerDir = opt.controllerDir;
  this.redis = opt.redis;
  this.port = opt.port || 80;
  this.versioningUrl = true;
  this.api = null;
  this.cache = null;
  this.router = Router();

  if (this.redis) this.cache = cache.RedisCache(this.redis);

  if (!fs.existsSync(this.apiDoc)) throw new Error('api file not exists');
  if (!fs.existsSync(this.controllerDir)) throw new Error('controllerDir not exists');

  swaggerParser.validate(this.apiDoc, { validate: { schema: false, spec: false } }, (error, api) => {
    if (error) throw error;

    debug(`swagger version: ${ api.swagger }`);
    debug(`api title: ${ api.info.title }, version: ${ api.info.version }`);
    debug(`load api document ${ this.apiDoc }`);
    debug(`load controller ${ this.controllerDir }`);

    this.api = api;
    this.parsePaths();
  });

  return this;
}

swagger.prototype.routes = function () {
  return this.router.routes();
};

swagger.prototype.parsePaths = function () {
  _.forEach(this.api.paths, (config, path) => {
    let reallyPath = '';
    const prefix = !!this.versioningUrl ? '/v' + urlUtil.version(this.api.info.version).major : '';

    reallyPath = pathUtil.join(prefix, this.api.basePath || '', path);
    reallyPath = urlUtil.convert2RouterUrl(reallyPath);

    this.parsePath(config, reallyPath);
  });
};

swagger.prototype.parsePath = function (config, apiPath) {
  _.forEach(config, (methodConfig, method) => {
    // controller extended word
    if (methodConfig['x-controller'] == undefined || methodConfig['x-controller'].length == 0) {
      debug(`${ apiPath } ${ method } no controllers`);
      return true;
    }

    // cache extend word
    let cacheMiddleware = null;
    const cacheConfig = methodConfig['x-cache'];
    if (this.cache && cacheConfig != undefined && cacheConfig.expire) {
      const key = `${ method.toUpperCase() } ${ apiPath }`;

      const options = {};
      _.set(options, `${ key }`, {
        key: cacheUtil.defaultCacheKeyGen,
        expire: cacheConfig.expire,
        get: this.cache.get,
        set: this.cache.set,
        passthrough: this.cache.passthrough,
        destroy: this.cache.destroy
      });

      cacheMiddleware = cache(this.app, options);
    }

    let middlewares = this.loadCustomMiddlewares(methodConfig['x-controller']);
    debug(`add route: ${ method } ${ apiPath } ${ _.map(middlewares, '_name') }`);

    middlewares.unshift(swaggerRequest(methodConfig.parameters));
    middlewares.unshift(swaggerResponse(methodConfig.responses));

    if (cacheMiddleware) middlewares.unshift(cacheMiddleware);

    middlewares.unshift(apiPath);

    this.router[method].apply(this.router, middlewares);
  });
};

swagger.prototype.loadCustomMiddlewares = function (controllers) {
  let middlewares = [];
  _.forEach(controllers, controller => {
    let module = require(pathUtil.resolve(this.controllerDir, controller.file));
    let exportedFun = module[controller.handler];

    if (!_.isFunction(exportedFun)) {
      debug(`x-controller:handler is not a function ${ controller.handler }!`);
      return;
    }

    let middleware = exportedFun;
    middleware._name = exportedFun.name;
    middlewares.push(middleware);
  });
  return middlewares;
};

swagger.prototype.apiExplorer = function (ctx, next) {
  let views = require('koa-views');
  let mount = require('koa-mount');
  let statics = require('koa-static');

  const self = this;
  const swaggerDist = require('koa-router-swagger-ui/index').dist;

  self.app.use(views(swaggerDist, { map: { html: 'nunjucks' } }));

  // mount api doc files directory
  self.app.use(mount('/api-doc-file', statics(pathUtil.dirname(self.apiDoc))));

  // mount swagger-ui dist directory
  self.app.use(mount('/koa-router-swagger', statics(swaggerDist)));

  // mount api-explorer
  return mount('/api-explorer', (() => {
    var _ref = _asyncToGenerator(function* (ctx) {
      console.log(`ApiExplorer: http://127.0.0.1:${ self.port }/api-explorer`);
      yield ctx.render('index', { url: pathUtil.basename(self.apiDoc) });
    });

    return function (_x) {
      return _ref.apply(this, arguments);
    };
  })());
};