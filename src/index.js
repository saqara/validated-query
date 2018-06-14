/**
 * @export
 * @class ValidatedQuery
 */
export default class ValidatedQuery {
  /**
   * @constructs
   * @param {Object} options
   * @param {Array<Function>} [options.mixins=[]],
   * @param {String} options.name
   * @param {Function} options.resolve
   * @param {Function} [options.validate=() => {}]
   * @param {*} options.others
   * @throws {TypeError}
   */
  constructor ({
    mixins = [],
    name,
    resolve,
    validate = () => {},
    ...others
  }) {
    if (!Array.isArray(mixins)) {
      throw new TypeError('[ValidatedQuery] - `mixins` must be an array of function.')
    }
    if (typeof name !== 'string') {
      throw new TypeError('[ValidatedQuery] - `name` must be a string.')
    }
    if (typeof resolve !== 'function') {
      throw new TypeError('[ValidatedQuery] - `resolve` must be a function.')
    }
    if (typeof validate !== 'function') {
      throw new TypeError('[ValidatedQuery] - `validate` must be a function.')
    }

    this.options = {
      ...others,
      mixins: [...mixins, ...ValidatedQuery.globalMixins],
      name,
      resolve,
      run: resolve,
      validate
    }

    this._applyMixins()
  }

  /**
   * @summary Apply mixin options
   * @locus Server
   * @memberof ValidatedQuery
   * @method _applyMixins
   * @instance
   * @private
   * @return {Object}
   * @throws {Error}
   */
  _applyMixins () {
    const { mixins, name } = this.options

    mixins.forEach((mixin) => {
      const options = mixin(this.options)

      if (typeof options !== 'object') {
        const mixinName = mixin.toString().match(/function\s(\w+)/)
        const msg = (mixinName) ? `The function '${mixinName[ 1 ]}'` : 'One of the mixins'

        throw new Error(`Error in ${name} method: ${msg} didn't return the options object.`)
      }
      options.resolve = options.run
      this.options = options
    })
  }

  /**
   * @summary Returns resolver function
   * @locuse Server
   * @memberof ValidatedQuery
   * @method resolver
   * @instance
   * @return {Function}
   */
  resolver () {
    return async (obj, args, context) => {
      const { resolve, validate } = this.options
      let result
      try {
        validate(args)
        result = await resolve.call(context, obj, args, context)
      } catch (err) {
        ValidatedQuery.onError(err)
      }
      return result
    }
  }
}

ValidatedQuery.globalMixins = []
ValidatedQuery.onError = (e) => { throw e }
