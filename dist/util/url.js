'use strict';

const _ = require('lodash');

/**
 * convert swagger url format to koa-router url
 * ps: api/test/{id} --> api/test/:id
 * @param  {[type]} path [description]
 * @return {[type]}      [description]
 */
function convert2RouterUrl(path) {
  let params = _.words(path, /{([\s\S]+?)}/g);
  let data = {};
  _.forEach(params, function (param) {
    param = param.replace(/[{|}]/g, '');
    data[param] = `:${ param }`;
  });

  _.templateSettings.interpolate = /{([\s\S]+?)}/g;
  var compiled = _.template(path);
  return compiled(data);
}

/**
 * get version object. major, minor, patch
 *
 * @param version string, like 1.0.1
 * @return {major: 1, minor: 0, patch: 1}
 */
function version(version) {
  const vers = _.words(version, '.');
  return {
    major: _.nth(vers, 0) || 0,
    monor: _.nth(vers, 1) || 0,
    patch: _.nth(vers, 2) || 0
  };
}

module.exports = {
  convert2RouterUrl: convert2RouterUrl,
  version: version
};