'use strict'

const {expect} = require('chai')

const app = require('../sample-project/server/server.js')
const definitions = require('./fixtures/factory-patterns')
const F = require('..')

let Factory

describe('Callbacks', () => {
  before('start app', done => app.start(done))
  before('initialize factory', () => {
    const {models} = app
    Factory = F({models, definitions})
  })
  after('close app', done => app.server.close(done))

  it('should create a note', (done) => {
    Factory.create('note', (err, note) => {
      if (err) return done(err)
      expect(note).to.include({
        title: 'Hello',
        content: 'Hello there',
      })
      done()
    })
  })
})
