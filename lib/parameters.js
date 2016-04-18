'use strict';

let _ = require('lodash');
let debug = require('debug')('koa-swagger-router:parameters');
let jsonSchema = require('./helpers/json-schema');

function parseBody (paramSchema) {
  debug('parseBody: ', paramSchema);

  return function* (next) {
    if (!!!paramSchema) {
      return yield next;
    }

    const inQuery = _.every(paramSchema, (it)=> {return it.in === 'query'})
    const inBody = _.every(paramSchema, (it)=> {return it.in === 'body'})
    const inPath = _.every(paramSchema, (it)=> {return it.in === 'path'})

    let data = {};
    if (inQuery)
      data = this.query;
    else if (inBody)
      data = this.body;
    else if (inPath)
      data = this.params
    debug('validData: ', data);

    let schema = new jsonSchema(paramSchema, data);
    let ret = schema.valid();

    debug('validRet: ', ret);
    if (ret.error) {
      this.status = 400
      this.throw(400, ret.error);
    } else {
      yield next;
    }
  }
}

module.exports = exports = parseBody
