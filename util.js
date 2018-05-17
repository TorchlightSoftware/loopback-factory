const _ = require('lodash')
    , {join} = require('path')
    , async = require('async')

module.exports = {
  obj(key, val) {
    const result = {}
    result[key] = val
    return result
  },
  require(...path) {
    return require(this.rel.apply(this, path))
  },
  getType(obj) {
    const ptype = Object.prototype.toString.call(obj).slice(8, -1)
    return ptype === 'Object' ? obj.constructor.name.toString() : ptype
  },
  getModelSummary(model) {
    return _.pick(model.definition, ['properties', 'settings', 'relations', 'indexes'])
  },
  objMapAsync(obj, iter, done) {
    const wrappedIter = (results, key, next) => {
      const interpret = (err, result) => {
        results[key] = result
        return next(err, results)
      }
      return iter(obj[key], interpret, key)
    }
    return async.reduce(Object.keys(obj), {}, wrappedIter, done)
  },
}

