'use strict';

var loopback = require('loopback');
var boot = require('loopback-boot');

var app = module.exports = loopback();

app.booted = false
app.once('booted', () => {
  app.booted = true
  return true
})
app.onBoot = fn => {
  app.booted ? fn() : app.once('booted', fn)
}

app.status = 'not started'

app.start = function(done) {
  done || (done = () => {})

  if (app.status === 'starting') {
    return app.once('started', done)
  } else if (app.status === 'started') {
    return done()
  } else if (app.status === 'not started') {
    app.once('started', done)
  }

  // start the web server
  app.server = app.listen(function() {
    app.emit('started')
    var baseUrl = app.get('url').replace(/\/$/, '')
    console.log('Web server listening at: %s', baseUrl)
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath)
    }
  })
  return app.server
}

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module)
    app.start();
});
