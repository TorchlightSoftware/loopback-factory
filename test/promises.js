'use strict'

const {expect} = require('chai')

const app = require('../sample-project/server/server.js')
const definitions = require('./fixtures/factory-patterns')
const F = require('..')

let Factory

describe('Promises', () => {
  before('start app', done => app.start(done))
  before('initialize factory', () => {
    const {models} = app
    Factory = F({models, definitions})
  })
  after('close app', done => app.server.close(done))

  it('should create a note', async () => {
    const note = await Factory.create('note')
    expect(note).to.include({
      title: 'Hello',
      content: 'Hello there',
    })
  })
})
