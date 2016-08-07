'use strict';

let _ = require('lodash');
let debug = require('debug')('koa-router-swagger:parameters');
let JsonSchema = require('./helpers/json-schema');

function validJson (schema, data) {
  let jsonSchema = new JsonSchema(schema, data);
  let ret = jsonSchema.valid();
  return ret.error;
}

function validRequest (ctx, paramSchema) {
  const headerSchemas = _.filter(paramSchema, (it)=> {return it.in === 'header'})
  const pathSchemas = _.filter(paramSchema, (it)=> {return it.in === 'path'})
  const querySchemas = _.filter(paramSchema, (it)=> {return it.in === 'query'})
  const bodySchemas = _.filter(paramSchema, (it)=> {return it.in === 'body'})
  const formDataSchemas = _.filter(paramSchema, (it)=> {return it.in === 'formData'})

  let supportedValidMap = {
    'header': headerSchemas,
    'params': pathSchemas,
    'query': querySchemas,
    'body': bodySchemas,
    'form': formDataSchemas
  }
  ctx.body = ctx.request.body;

  let error = null;
  _.forEach(supportedValidMap, function valid (schema, dataPos) {
    if (schema.length) {
      let err = validJson(schema, ctx[dataPos]);
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

  return function* swaggerRequest() {
    let error = validRequest(this, paramSchema);

    debug('validRet: ', error);
    if (error) {
      this.status = 400
      this.throw(400, _.get(error, 'details.0.message'));
    }
  }
}

module.exports = exports = parse
