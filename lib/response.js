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

      ctx.status = e.status || 500;
      ctx.body = boom.wrap(e, ctx.status).output.payload;

      // since we handled this manually we'll
      // want to delegate to the regular app
      // level error handling as well so that
      // centralized still functions correctly.
      this.app.emit('error', e, this);
    }
  }
}

module.exports = exports = response
