'use strict';

let people = {};

function* get () {
  this.body = people;
}

function* post () {
  people = this.body;
  this.body = people;
}

function* put() {
  for(key in this.body) {
    people[key] = this.body[key];
  }
  this.body = people;
}

module.exports = {
  get: get,
  post: post
}
