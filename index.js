const async = require('async')
    , _ = require('lodash')
    , torch = require('torch')

const {getModelSummary, objMapAsync, getType} = require('./util')

module.exports = function({models, definitions}) {

  // PRIVATE METHODS
  // call possibly async functions
  const callFn = (fn, next) =>
    fn.length === 0 ? next(null, fn()) : fn(next)

  // resolve property that is possibly a function
  const resolveProperty = (prop, next) =>
    getType(prop) === 'Function' ? callFn(prop, next) : next(null, prop)

  // resolve all properties
  const resolveProperties = (props, next) => objMapAsync(props, resolveProperty, next)

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
    create(name, props, done) {
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

          // torch.magenta 'creating:', {name, finalProps, resolvedProps}
          return template.model.create(resolvedProps, done)
        })
      }
    },
    createRef(name, fields, done) {
      return this.create(name, fields, (err, obj) => done(err, obj != null ? obj.id : undefined))
    },
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
    createGroup(name, records, shared, done) {
      if (arguments.length === 3) {
        return this.createGroup(name, records, null, shared)
      }
      if ((typeof records) === 'number') {
        records = _.times(records, r => {})
      }
      records = _.map(records, r => _.merge({}, shared, r))
      return async.map(records, this.create.bind(this, name), done)
    },
    clearAll(done) {
      const removeData = (model, next) => model.destroyAll ? model.destroyAll({}, next) : next()
      return objMapAsync(models, removeData, done)
    },
    service: (action, {args}, next) => Factory[action](...args, next)
  }
  definitions(Factory)
  return Factory
}
