'use strict';

let _ = require('lodash');
let debug = require('debug')('koa-router-swagger:json-schema');
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

function initJoiWithType (type, format) {
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

function schemaToParameters (field) {
  let parameters = _.map(field.schema.properties, (value, key)=> {
    value.name = key;
    value.in = 'body';
    value.required = _.includes(field.schema.required, key);

    return value;
  })

  return parameters;
}

function limitter (joi, field) {
  debug(joi, field.pattern);
  // default setter
  if (field.default) joi = joi.default(field.default).optional();

  // enum checker
  if (field.enum) joi = joi.valid(field.enum);

  // minimum checker
  if (joi._type === 'number' && field.minimum && !field.exclusiveMinimum) joi = joi.min(field.minimum);
  // exclusiveMinimum checker
  if (joi._type === 'number' && field.minimum && field.exclusiveMinimum) joi = joi.greater(field.minimum);
  // maximum checker
  if (joi._type === 'number' && field.maximum && !field.exclusiveMaximum) joi = joi.max(field.maximum);
  // exclusiveMaximum checker
  if (joi._type === 'number' && field.maximum && field.exclusiveMaximum) joi = joi.less(field.maximum);

  // string pattern
  if (joi._type === 'string' && field.pattern) joi = joi.regex(new RegExp(field.pattern));
  // string minLength checker
  if (joi._type === 'string' && field.minLength) joi = joi.min(field.minLength);
  // string maxLength checker
  if (joi._type === 'string' && field.maxLength) joi = joi.min(field.maxLength);

  // array minItems checker
  if (joi._type === 'array' && field.minItems) joi = joi.min(field.minItems);
  // array maxItems checker
  if (joi._type === 'array' && field.maxItems) joi = joi.min(field.maxItems);

  return joi;
}

function JsonSchema (schema, data) {
  debug('schema: ', schema);
  debug('data: ', data);

  this.___data___ = data || {};
  this.___schema___ = {};
  this.___originSchema___ = schema || {};

  _.forEach(schema, (field)=> {
    if (field.in === 'body') {
      this.___schema___ = _.merge(this.___schema___, parseField(field));
    } else {
      this.___schema___[field.name] = parseField(field);
    }
  })
};

function compose (field) {
  let joi = initJoiWithType(field.type, field.format);
  joi = limitter(joi, field);

  if (field.required)
    joi = joi.required();
  else
    joi = joi.optional();

  return joi;
}

function parseField (field) {
  debug('filed: ', field);

  if (field.in === 'body' && field.schema) {
    const parameters = schemaToParameters(field);
    let obj = {};

    for (let key in parameters) {
      const subField = parameters[key];
      const joi = compose(subField);
      _.set(obj, parameters[key].name, joi);
    }

    return Joi.object(obj);
  } else {
    return compose(field);
  }
}

JsonSchema.prototype.valid = function() {
  return Joi.validate(this.___data___, this.___schema___, {allowUnknown: true});
};
