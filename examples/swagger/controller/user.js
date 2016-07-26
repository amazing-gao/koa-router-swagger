'use strict';

function* isAdmin (next) {
  let ctx = this;

  if (ctx.query.who === 'admin') {
    yield next
  } else {
    this.status = 403
    this.body = 'admin required!'
  }
}

function* isLogin (next) {
  let ctx = this;

  if (ctx.query.who === 'user') {
    yield next
  } else {
    this.status = 403
    this.body = {msg: 'user required!'}
  }
}

module.exports = {
  isAdmin: isAdmin,
  isLogin: isLogin
}
