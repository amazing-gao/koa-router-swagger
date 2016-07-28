'use strict';

let _ = require('lodash');
let debug = require('debug')('koa-router-swagger:responses');
let boom = require('boom');

function getResponseSchema (responsesSchema, status) {
  return responsesSchema[`${status}`] || responsesSchema.default;
}

function response (responsesSchema) {
  debug('response: ', responsesSchema);

  return function* swaggerResponse(next) {
    let ctx = this;

    try {
      yield next;

      //let responseSchema = getResponseSchema(responsesSchema, ctx.status);
      debug(ctx.body)

    } catch(e) {
      //let responseSchema = getResponseSchema(responsesSchema, ctx.status);

      console.error(e.stack);

      ctx.status = e.status || 500;
      ctx.body = boom.badImplementation(e.message).output.payload
    }
  }
}

module.exports = exports = response
