'use strict';

let _ = require('lodash');
let debug = require('debug')('koa-router-swagger:parameters');
let JsonSchema = require('./helpers/json-schema');

function validJson (schema, data) {
  let jsonSchema = new JsonSchema(schema, data);
  let ret = jsonSchema.valid();
  return ret.error;
}

function getData (ctx, dataPos) {
  let data = {};

  if (dataPos == 'header')
    data = ctx.headers;
  else if (dataPos == 'path')
    data = ctx.params;
  else if (dataPos == 'query')
    data = ctx.query;
  else if (dataPos == 'body')
    data = ctx.request.body;
  else if (dataPos == 'session')
    data = ctx.session;

  return data;
}

function validRequest (ctx, paramSchema) {
  const headerSchemas = _.filter(paramSchema, (it)=> {return it.in === 'header'})
  const pathSchemas = _.filter(paramSchema, (it)=> {return it.in === 'path'})
  const querySchemas = _.filter(paramSchema, (it)=> {return it.in === 'query'})
  const bodySchemas = _.filter(paramSchema, (it)=> {return it.in === 'body'})
  const sessionSchemas = _.filter(paramSchema, (it)=> {return it.in === 'session'})

  let supportedValidMap = {
    'header': headerSchemas,
    'params': pathSchemas,
    'query': querySchemas,
    'body': bodySchemas,
    'session': sessionSchemas
  }

  let error = null;
  _.forEach(supportedValidMap, function valid (schema, dataPos) {
    if (schema.length) {
      const data = getData(ctx, dataPos);

      let err = validJson(schema, data);
      if (err) {
        error = err;
        return false;
      }
    }
  })
  return error
}

function parse (paramSchema) {
  debug('parseBody: ', paramSchema);

  return function* swaggerRequest(next) {
    let error = validRequest(this, paramSchema);

    debug('validRet: ', error);
    if (error) {
      this.status = 400
      this.throw(400, _.get(error, 'details.0.message'));
    } else {
      yield next;
    }
  }
}

module.exports = exports = parse
