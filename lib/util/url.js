'use strict';

const _ = require('lodash');

/**
 * convert swagger url format to koa-router url
 * ps: api/test/{id} --> api/test/:id
 * @param  {[type]} path [description]
 * @return {[type]}      [description]
 */
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

module.exports = {
  convert2RouterUrl: convert2RouterUrl
}
