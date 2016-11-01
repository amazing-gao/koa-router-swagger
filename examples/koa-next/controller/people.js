'use strict';

let people = {name: 'bitebit'};

function get (ctx, next) {
  ctx.body = people;
}

function post (ctx, next) {
  people = this.body;
  ctx.body = people;
}

module.exports = {
  get: get,
  post: post
}
