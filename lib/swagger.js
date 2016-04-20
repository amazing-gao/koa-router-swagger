'use strict';

let _ = require('lodash')
let debug = require('debug')('koa-swagger-router:swagger');
let fs = require('fs');
let path = require('path');
let router = require('koa-router')();
let swaggerParser = require('swagger-parser');

let paramParser = require('./parameters');
let responser = require('./responses');

module.exports = swagger;

function swagger(opt) {
  if (!_.isObject(opt))
    throw new Error('koa-swagger-router invalid options');

  this.apiDoc = path.resolve(process.env.PWD, opt.apiDoc);
  this.controllerDir = path.resolve(process.env.PWD, opt.controllerDir);
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

swagger.prototype.applyPathMethod = function(subpath, method, methodConfig, middlewares){
  let reallyPath = path.join(this.api.basePath || '', subpath);
  reallyPath = convert2RouterUrl(reallyPath);
  debug(`use ${method} ${reallyPath}`)
  router[method](reallyPath, responser(methodConfig.responses), paramParser(methodConfig.parameters));

  _.forEach(middlewares, function (middleware) {
    router[method](reallyPath, middleware);
  });
};


