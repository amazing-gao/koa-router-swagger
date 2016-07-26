'use strict';

const sortObj = require('sort-object');

/**
 * sort the query & body in request. make it as cache key.
 * @yield {[type]} [description]
 */
function* defaultCacheKeyGen () {
  let ctx = this;

  const query = sortObj(ctx.query);
  const body = sortObj(ctx.body);
  const key = `${ctx.path}##${JSON.stringify(query)}##${JSON.stringify(body)}`

  return key;
}

module.exports = {
  defaultCacheKeyGen: defaultCacheKeyGen
}
