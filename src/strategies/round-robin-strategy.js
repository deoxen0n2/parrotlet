import Debug from 'debug'
import { Context } from '../context'

const debug = Debug('parrotlet:strategies:round-robin')

export class RoundRobinStrategy {
  /**
    * @param {Object} options
    * @param {Number} options.timeBeforeReset   Time before reset to start the round-robin over again, in millisecond.
    */
  constructor (options = {}) {
    this.timeBeforeReset = options.timeBeforeReset
  }

  /**
   * @param {Sender} sender
   * @param {Object} options                          See Sender#send() options.
   * @param {Boolean} [multi=false]                   If true will be executed as part of the multi-strategy execution.
   * @param {Array<Provider>} [reducedProviders=[]]   An array of providers reduced from other previous strategies' executions.
   *
   * @returns {Promise<SendResult|Array<Provider>>}
   */
  execute (sender, options, multi = false, reducedProviders = []) {
    debug('executing')
    debug('  with options', options)

    return this._getContext(sender, options)
      .then(context => this._decideProvider(sender, options, context, reducedProviders).then(({ provider, isReset }) => ({ provider, context, isReset })))
      .then(({ provider, context, isReset }) => this._setNewContext(sender, provider, options, context, isReset).then(() => ({ provider })))
      .then(({ provider }) => {
        if (multi) {
          return [ provider ]
        }

        return provider.send(options)
      })
  }

  /**
   * @param {Sender} sender
   * @param {Object} options  See Sender#send() options.
   *
   * @returns {Promise<Object>}   A promise that will be resolved with object representing context.
   */
  _getContext (sender, options) {
    const { dataStore } = sender

    return Context.get(dataStore, options)
  }

  /**
   * @param {Sender} sender
   * @param {Object} options                      See Sender#send() options.
   * @param {Object} context
   * @param {Number} context.last_reset_at        A Unix timestamp, in millisecond.
   * @param {String} context.last_provider_name
   * @param {Number} context.last_delivered_at    A Unix timestamp, in millisecond.
   *
   * @returns {Promise<Object>}   A promise that will be resolved with object representing context.
   */
  _setContext (sender, options, context) {
    const { dataStore } = sender

    return Context.set(dataStore, options, context)
  }

  /**
   * @param {Sender} sender
   * @param {Object} options                          See Sender#send() options.
   * @param {Object} context
   * @param {Number} context.last_reset_at            A Unix timestamp, in millisecond.
   * @param {String} context.last_provider_name
   * @param {Number} context.last_delivered_at        A Unix timestamp, in millisecond.
   * @param {Array<Provider>} [reducedProviders=[]]   An array of providers reduced from other previous strategies' executions.
   *
   * @returns {Promise<Provider>}   A promise that will be resolved with a Provider instance.
   */
  _decideProvider (sender, options, context, reducedProviders = []) {
    const providers = (reducedProviders && reducedProviders.length) ? reducedProviders : sender.providers
    let provider

    if (this._isResetable(context)) {
      debug('reseting')

      provider = providers[0]

      return Promise.resolve({ provider, isReset: true })
    }

    provider = providers[this._findNextProviderIndex(providers, context)]

    debug('context', context)
    debug('next provider:', provider.name)

    return Promise.resolve({ provider, isReset: false })
  }

  /**
   * @param {Array<Provider>} options.providers   An array of Provider.
   * @param {Object} context
   * @param {Number} context.last_reset_at        A Unix timestamp, in millisecond.
   * @param {String} context.last_provider_name
   */
  _findNextProviderIndex (providers, context) {
    const lastProviderName = context.last_provider_name
    const lastProviderIndex = providers.findIndex(provider => provider.name === lastProviderName)

    debug('last provider name:', lastProviderName)
    debug('last provider index:', lastProviderIndex)

    return (lastProviderIndex + 1) % providers.length
  }

  _setNewContext (sender, provider, options, context, isReset) {
    const newContext = {
      last_reset_at: isReset ? (+new Date()) : context.last_reset_at,
      last_provider_name: provider.name,
      last_delivered_at: +new Date()
    }

    debug('set new context:', newContext)

    return this._setContext(sender, options, newContext)
  }

  /**
   * @param {Object} context
   * @param {Number} context.last_reset_at        A Unix timestamp, in millisecond.
   */
  _isResetable (context) {
    const lastResetAt = context.last_reset_at || 0
    const now = +new Date()

    return (now - lastResetAt) > this.timeBeforeReset
  }
}
