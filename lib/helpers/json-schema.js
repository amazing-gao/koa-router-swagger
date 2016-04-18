'use strict';

let _ = require('lodash');
let debug = require('debug')('koa-swagger-router:json-schema');
let Joi = require('joi');

module.exports = JsonSchema;

// Supported data types
var dataTypes = ['string', 'number', 'integer', 'boolean', 'array', 'object', 'file'];

// Some older versions of Node don't define these constants
var MIN_SAFE_INTEGER = Number.MIN_SAFE_INTEGER || -9007199254740991;
var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || 9007199254740991;
var MAX_VALUE = Number.MAX_VALUE || 1.7976931348623157e+308;
var MIN_VALUE = -MAX_VALUE;
var EPSILON = Number.EPSILON || 2.220446049250313e-16;

// Numeric type ranges
var ranges = {
  int32: {
    min: -2147483648,
    max: 2147483647
  },

  int64: {
    min: MIN_SAFE_INTEGER,
    max: MAX_SAFE_INTEGER
  },

  byte: {
    min: 0,
    max: 255
  },

  float: {
    min: -3.402823e38,
    max: 3.402823e38
  },

  double: {
    min: MIN_VALUE,
    max: MAX_VALUE
  }
};

function formatString (format) {
  if (format === 'byte')
    return Joi.binary().encoding('base64');
  else if (format === 'binary')
    return Joi.binary();
  else if (format === 'email')
    return Joi.string().email();
  else if (format === 'uuid')
    return Joi.string().guid();
  else if (format === 'date')
    return Joi.date()
  else if (format === 'date-time')
    return Joi.date()
  else if (format === 'password')
    return Joi.string();
  else
    return Joi.string()
}

function formatInteger (joi, format) {
  if (format === 'int32')
    return joi.min(ranges.int32.min).max(ranges.int32.max);
  else if (format === 'int64')
    return joi.min(ranges.int64.min).max(ranges.int64.max);
  else
    return joi;
}

function formatNumber (joi, format) {
  if (format === 'float')
    return joi.min(ranges.float.min).max(ranges.float.max);
  else if (format === 'double')
    return joi.min(ranges.double.min).max(ranges.double.max);
  else
    return joi;
}

function TypeFormat2Joi (type, format) {
  if (dataTypes.indexOf(type) == -1)
    return Joi.any();

  let joi = null;
  if (type === 'string') {
    joi = formatString(format);
  }
  else if (type === 'number') {
    joi = formatNumber(Joi.number(), format);
  }
  else if (type === 'integer') {
    joi = formatInteger(Joi.number().integer(), format);
  }
  else if (type === 'boolean') {
    joi = Joi.boolean();
  }
  else if (type === 'array') {
    joi = Joi.array();
  }
  else if (type === 'object') {
    joi = Joi.object();
  }
  else if (type === 'file') {
    joi = Joi.any();
  }
  else {
    joi = Joi.any();
  }

  return joi;
}

function JsonSchema (schema, data) {
  debug('new JosnSchema: ', schema, data);

  this.___data___ = data || {};
  this.___schema___ = {};
  this.___originSchema___ = schema || {};

  _.forEach(schema, (field)=> {
    this.___schema___[field.name] = parseField(field);
  })
};

function parseField (field) {
  debug('parseField: ', field);
  let joi = TypeFormat2Joi(field.type, field.format);

  if (field.required) {
    debug('required...')
    joi = joi.required();
  }

  return joi;
}

JsonSchema.prototype.valid = function() {

  return Joi.validate(this.___data___, this.___schema___, {allowUnknown: true});
};
