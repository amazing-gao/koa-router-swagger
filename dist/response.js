'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

let _ = require('lodash');
let debug = require('debug')('koa-router-swagger:responses');
let statuses = require('statuses');

function getResponseSchema(responsesSchema, status) {
  return responsesSchema[`${ status }`] || responsesSchema.default;
}

function response(responsesSchema) {
  debug('response: ', responsesSchema);

  return (() => {
    var _ref = _asyncToGenerator(function* (ctx, next) {
      try {
        yield next();
        //let responseSchema = getResponseSchema(responsesSchema, ctx.status);
      } catch (e) {
        //let responseSchema = getResponseSchema(responsesSchema, ctx.status);

        ctx.status = e.status || 500;

        const responseSchema = getResponseSchema(responsesSchema, ctx.status);

        const errMsgKey = _.findKey(responseSchema.schema.properties, function (it) {
          return it.type.toLowerCase() === 'string';
        });
        const errCodeKey = _.findKey(responseSchema.schema.properties, function (it) {
          return it.type.toLowerCase() === 'integer' || it.type.toLowerCase() === 'number';
        });

        const errorInfo = _.pick(e, _.keys(responseSchema.schema.properties));
        errorInfo[errMsgKey] = errorInfo[errMsgKey] ? errorInfo[errMsgKey] : e.message;
        errorInfo[errCodeKey] = errorInfo[errCodeKey] ? errorInfo[errCodeKey] : ctx.status;

        ctx.body = errorInfo;

        // since we handled this manually we'll
        // want to delegate to the regular app
        // level error handling as well so that
        // centralized still functions correctly.
        ctx.app.emit('error', e, ctx);
      }
    });

    return function (_x, _x2) {
      return _ref.apply(this, arguments);
    };
  })();
}

module.exports = exports = response;