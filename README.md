# Loopback-Factory

It's for making test data generation easy.  Inspired by factory-worker et al.

## Usage

Define reusable data generators in `fixtures/test-data.js` like such:

```js
module.exports = (Factory) => {
  // you'll be passed a Factory object with a models property on it that includes all the loopback models
  const {Account, AccountCompany, AccountUser} = Factory.models

  // derive your generator from an existing model
  Factory.define('Account', Account, {
    pricing_tier: 'Basic',
  })

  // add related data using 'assemble' - this additional record will be created as a prerequisite
  Factory.define('User', User, {
    account_id: Factory.assemble('Account'),
    email: 'foo@bar.com',
    password: 'foobar',
    user_type: 'Member',
    first_name: 'Kevin',
    last_name: 'Doolittle',
  })
}
```

Then in your mocha tests you can have:

```js
describe('my tests', function() {
  before('initialize factory', function() {
    const definitions = require('../fixtures/test-data')
    const {models} = app = require('../server/server.js') # or where ever your loopback server is defined
    this.Factory = F({models, definitions})
  })

  describe('AccountUser', function() {
    beforeEach('create a user', function(done) {
      Factory.create('AccountUser', {email: 'foo@bar.com', password: 'foobar'}, done)
    })
  })
})
```

TODO: document the rest of the features:

```
createRef
assembleGroup
createGroup
clearAll
service
```