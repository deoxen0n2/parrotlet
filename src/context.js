import crypto from 'crypto'

export class Context {
  /**
   * @param {DataStore} dataStore
   * @param {Object} options        See Sender#send() options.
   *
   * @returns {Promise<Object>}   A promise that will be resolved with object representing context.
   */
  static get (dataStore, options) {
    const contextKey = this._getContextKey(options)

    return dataStore.get(contextKey)
  }

  /**
   * @param {DataStore} dataStore
   * @param {Object} options        See Sender#send() options.
   * @param {Object} context
   *
   * @returns {Promise<Object>}   A promise that will be resolved with object representing context.
   */
  static set (dataStore, options, context) {
    const contextKey = this._getContextKey(options)

    return dataStore.set(contextKey, context)
  }

  static _getContextKey (options) {
    const { to, message } = options
    const composed = `${to}$${message}`
    const hash = crypto.createHash(Context.KEY_HASH_ALGORITHM).update(composed).digest('hex')

    return hash
  }
}

Context.KEY_HASH_ALGORITHM = 'sha256'
