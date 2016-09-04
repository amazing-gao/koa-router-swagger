'use strict';

let people = {};

function get (ctx, next) {
  console.log('get')
  ctx.body = people;
}

function post (ctx, next) {
  console.log('post')
  people = this.body;
  ctx.body = people;
}

module.exports = {
  get: get,
  post: post
}