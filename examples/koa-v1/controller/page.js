'use strict';

function* userPage (next) {
  let ctx = this;

  this.status = 200
  this.body = 'hi, welcome user!'
}

function* adminPage (next) {
  let ctx = this;

  this.status = 200
  this.body = 'hi, welcome admin!'
}

module.exports = {
  userPage: userPage,
  adminPage: adminPage,
}
