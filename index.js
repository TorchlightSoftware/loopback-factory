'use strict'

const async = require('async')
    , _ = require('lodash')

const {getModelSummary, objMapAsync, getType} = require('./util')

// PRIVATE METHODS
// call possibly async functions
const callFn = (fn, next) =>
  fn.length === 0 ? next(null, fn()) : fn(next)

// resolve property that is possibly a function or a promise
const resolveProperty = (prop, next) => {
  if (getType(prop) === 'Function') {
    callFn(prop, next)
  } else if (getType(prop) === 'Promise') {
    prop.catch(next).then(result => next(null, result))
  } else {
    next(null, prop)
  }
}

// resolve all properties
const resolveProperties = (props, next) => objMapAsync(props, resolveProperty, next)

// return a promise if no callback was provided
const promisify = (fn) => function(...args) {

  // if we got a callback then call the function as normal
  const last = args[args.length - 1]
  if (getType(last) === 'Function') {
    fn.call(this, ...args)

    // otherwise wrap it in a promise
  } else {
    return new Promise((resolve, reject) =>
      fn.call(this, ...args, (err, result) => err ? reject(err) : resolve(result))
    )
  }
}

module.exports = function({models, definitions}) {

  // PUBLIC Factory API
  const Factory = {
    __definitions: {},
    models: models,
    define(name, model, props) {
      if (!model) throw new Error(`Factory: Invalid definition for '${name}'.  Model does not exist.`)
      return this.__definitions[name] = {
        model: model,
        props: props
      }
    },
    create: promisify(function(name, props, done) {
      if ((getType(props) === 'Function') && (done == null)) {
        done = props
        props = {}
      }

      const template = this.__definitions[name]
      if (!template) return done(new Error(`Factory: No definition for '${name}'.`))

      const tempProps = getType(template.props) === 'Function' ?
        template.props() : template.props
      const finalProps = _.merge({}, tempProps, props)

      if (getType(template.model) === 'String') {
        return this.create(template.model, finalProps, done)
      } else {

        // call functions if we got 'em
        return resolveProperties(finalProps, function(err, resolvedProps) {
          if (err) return done(err)

          return template.model.create(resolvedProps, done)
        })
      }
    }),
    createRef: promisify(function(name, fields, done) {
      return this.create(name, fields, (err, obj) => done(err, obj != null ? obj.id : undefined))
    }),
    assemble(name, fields) {
      return (cb) => this.createRef(name, fields, cb)
    },
    assembleGroup(name, records, shared) {
      records || (records = [{}])
      if ((typeof records) === 'number') {
        records = _.times(records, r => {})
      }
      records = _.map(records, r => _.merge({}, shared, r))
      return (cb) => async.map(records, this.createRef.bind(this, name), cb)
    },
    createGroup: promisify(function(name, records, shared, done) {
      if (arguments.length === 3) {
        return this.createGroup(name, records, null, shared)
      }
      if ((typeof records) === 'number') {
        records = _.times(records, r => {})
      }
      records = _.map(records, r => _.merge({}, shared, r))
      return async.map(records, this.create.bind(this, name), done)
    }),
    clearAll: promisify(function(done) {
      const removeData = (model, next) => model.destroyAll ? model.destroyAll({}, next) : next()
      return objMapAsync(models, removeData, done)
    }),
    service: (action, {args}, next) => Factory[action](...args, next)
  }
  definitions(Factory)
  return Factory
}
