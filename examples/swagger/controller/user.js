'use strict';

function* isAdmin (next) {
  let ctx = this;

  if (ctx.query.user === 'admin') {
    yield next
  } else {
    this.status = 403
    this.body = 'admin required!'
  }
}

function* isLogin (next) {
  let ctx = this;

  if (ctx.query.user === 'user') {
    yield next
  } else {
    this.status = 403
    this.body = 'user required!'
  }
}

module.exports = {
  isAdmin: isAdmin,
  isLogin: isLogin
}
