import { MemoryStore } from './data-stores'
import { MultiStrategyExecutor } from './multi-strategy-executor'

/**
 * @interface Provider
 */

/**
 * @property {String} Provider#name
 */

/**
 * @method
 * @name Provider#send
 * @param {Object} options   See Sender#send() options.
 *
 * @returns {Promise}
 */

export class Sender {
  /**
   * @param {Object} options
   * @param {Array<Provider>} options.providers   An array of Provider.
   * @param {Strategy} options.strategy           A Strategy instance, for send() execution.
   * @param {DataStore} [dataStore=MemoryStore]
   */
  constructor (options = {}) {
    if (!Array.isArray(options.providers) || !options.providers.length) {
      throw new Error('"providers" option is required and must be non-empty"')
    }

    if (typeof options.strategy !== 'object' && typeof options.strategies !== 'object') {
      throw new Error('"strategy" or "strategies" option is required')
    }

    if (options.strategies && !Array.isArray(options.strategies)) {
      throw new Error('"strategies" option must be an array')
    }

    this.providers = options.providers
    this.strategy = options.strategy
    this.strategies = options.strategies
    this.dataStore = options.dataStore || new MemoryStore()
  }

  /**
   * @param {Object} options
   * @param {String} options.to
   * @param {String} options.message
   *
   * @returns {Promise}
   */
  send (options = {}) {
    if (!options.to || !options.message) {
      return Promise.reject(new Error('"to" and "message" options are required'))
    }

    if (this.strategies) {
      return MultiStrategyExecutor.execute(this.strategies, this, options)
    }

    return this.strategy.execute(this, options)
  }
}
