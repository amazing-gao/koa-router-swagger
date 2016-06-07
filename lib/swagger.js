'use strict';

let _ = require('lodash')
let debug = require('debug')('koa-swagger-router:swagger');
let fs = require('fs');
let path = require('path');
let router = require('koa-router')();
let swaggerParser = require('swagger-parser');

let views = require('koa-views');
let mount = require('koa-mount');
let statics = require('koa-static');

let paramParser = require('./parameters');
let responser = require('./responses');

module.exports = swagger;

function swagger(app, opt) {
  if (!_.isObject(opt))
    throw new Error('koa-swagger-router invalid options');

  this.app = app;
  this.apiDoc = opt.apiDoc;
  this.controllerDir = opt.controllerDir;
  this.api = null;

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
  _.forEach(config, (methodConfig, method)=> {
    if (methodConfig['x-controller'] == undefined || methodConfig['x-controller'].length == 0) {
      debug(`${path} ${method} no controllers`)
      return true;
    }

    debug('read path: ', methodConfig);

    let middlewares = this.loadMiddleware(methodConfig['x-controller']);

    if (!_.isArray(middlewares))
      return console.warn(`middlewares: ${middlewares} must be array`);

    this.applyPathMethod(path, method, methodConfig, middlewares);
  });
};

swagger.prototype.loadMiddleware = function(controllers) {
  let middlewares = [];
  _.forEach(controllers, (controller)=> {
    let module = require(path.resolve(this.controllerDir, controller.file))
    let middleware = module[controller.handler];
    if (middleware)
      middlewares.push(middleware)
    else
      debug(`middleware missing ${controller.handler}!`)
  })
  return middlewares;
};

function convert2RouterUrl (path) {
  let params = _.words(path, /{([\s\S]+?)}/g)
  let data = {};
  _.forEach(params, function (param) {
    param = param.replace(/[{|}]/g, '');
    data[param] = `:${param}`
  })

  _.templateSettings.interpolate = /{([\s\S]+?)}/g;
  var compiled = _.template(path);
  return compiled(data);
}

swagger.prototype.applyPathMethod = function(subpath, method, methodConfig, middlewares) {
  let reallyPath = path.join(this.api.basePath || '', subpath);
  reallyPath = convert2RouterUrl(reallyPath);
  debug(`use ${method} ${reallyPath}`)
  router[method](reallyPath, responser(methodConfig.responses), paramParser(methodConfig.parameters));

  _.forEach(middlewares, function (middleware) {
    router[method](reallyPath, middleware);
  });
};

swagger.prototype.apiExplorer = function() {
  let self = this;
  const swaggerDist = require('koa-router-swagger-ui/index').dist;

  // mount api doc files directory
  self.app.use(mount('/api-doc-file', statics(path.dirname(self.apiDoc))));

  // mount swagger-ui dist directory
  self.app.use(mount('/koa-router-swagger', statics(swaggerDist)));

  // mount swagger-ui html
  self.app.use(mount('/api-explorer', views(swaggerDist, {map: {html: 'nunjucks'}})));
  self.app.use(mount('/api-explorer', function* (next) {
    yield this.render('index', {url: path.basename(self.apiDoc)})
  }));

  return function* (next) {yield next;}
}


