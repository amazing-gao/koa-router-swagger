'use strict';

let _ = require('lodash');
let debug = require('debug')('koa-swagger-router:responses');
let jsonSchema = require('./helpers/json-schema');

function getResponseSchema (responsesSchema, status) {
  return responsesSchema[`${status}`] || responsesSchema.default;
}

function response (responsesSchema) {
  debug('response: ', responsesSchema);

  return function* (next) {
    let ctx = this;

    try {
      yield next;

      let responseSchema = getResponseSchema(responsesSchema, ctx.status);
      debug('---------------', ctx.body, responseSchema)


    } catch(e) {
      let responseSchema = getResponseSchema(responsesSchema, ctx.status);

      ctx.status = e.status || 500;
      ctx.body = {
        error_code: e.code || -100001,
        error_msg: e.message || ctx.body
      }
    }
  }
}

module.exports = exports = response
