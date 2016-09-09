'use strict';

let _ = require('lodash');
let debug = require('debug')('koa-router-swagger:responses');
let statuses = require('statuses');

function getResponseSchema (responsesSchema, status) {
  const defaultErrorModel = {
    description: 'unexpected error',
    schema: {
      title: 'Error',
      type: 'object',
      required: ['code', 'message'],
      properties: {code: -1, message: 'unexpected error', helpURL: 'https://github.com/BiteBit/koa-router-swagger'}
    }
  }

  return responsesSchema[`${status}`] || responsesSchema.default || defaultErrorModel;
}

function response (responsesSchema) {
  debug('response: ', responsesSchema);

  return function* swaggerResponse(next) {
    let ctx = this;

    try {
      yield next;

      debug(ctx.body)
    } catch(e) {
      ctx.status = e.status || 500;

      const responseSchema = getResponseSchema(responsesSchema, ctx.status);
      const errorInfo = _.pick(e, _.keys(responseSchema.schema.properties));

      ctx.body = errorInfo;

      // since we handled this manually we'll
      // want to delegate to the regular app
      // level error handling as well so that
      // centralized still functions correctly.
      this.app.emit('error', e, this);
    }
  }
}

module.exports = exports = response
