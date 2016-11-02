'use strict';

let _ = require('lodash');
let debug = require('debug')('koa-router-swagger:responses');
let statuses = require('statuses');

function getResponseSchema (responsesSchema, status) {
  return responsesSchema[`${status}`] || responsesSchema.default;
}

function response (responsesSchema) {
  debug('response: ', responsesSchema);

  return async (ctx, next)=> {
    try {
      await next();
      //let responseSchema = getResponseSchema(responsesSchema, ctx.status);

    } catch(e) {
      //let responseSchema = getResponseSchema(responsesSchema, ctx.status);

      ctx.status = e.status || 500;

      const responseSchema = getResponseSchema(responsesSchema, ctx.status);

      const errMsgKey = _.findKey(responseSchema.schema.properties, (it)=> {return it.type.toLowerCase()=== 'string'});
      const errCodeKey = _.findKey(responseSchema.schema.properties, (it)=> {return it.type.toLowerCase()=== 'integer' || it.type.toLowerCase()=== 'number'});

      const errorInfo = _.pick(e, _.keys(responseSchema.schema.properties));
      errorInfo[errMsgKey] = errorInfo[errMsgKey] ? errorInfo[errMsgKey] : e.message
      errorInfo[errCodeKey] = errorInfo[errCodeKey] ? errorInfo[errCodeKey] : ctx.status

      ctx.body = errorInfo;

      // since we handled this manually we'll
      // want to delegate to the regular app
      // level error handling as well so that
      // centralized still functions correctly.
      ctx.app.emit('error', e, ctx);
    }
  }
}

module.exports = exports = response
