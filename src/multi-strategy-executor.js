import ExtendableError from 'es6-error'
import Bluebird from 'bluebird'

export class ExecutionError extends ExtendableError {
}

export class MultiStrategyExecutor {
  /**
   * @param {Array<Strategy>} strategies
   * @param {Sender} sender
   * @param {Object} options
   *
   * @returns {Promise}
   */
  static execute (strategies, sender, options) {
    return Bluebird.reduce(strategies, (providers, strategy) => this._reduce(providers, strategy, sender, options), [])
      .then(providers => this._send(providers, sender, options))
  }

  /**
   * @param {Strategy} strategy
   *
   * @returns {Promise<Array<Provider>>}
   */
  static _reduce (providers, strategy, sender, options) {
    return strategy.execute(sender, options, true, providers)
  }

  /**
   * @param {Array<Provider}} providers
   *
   * @returns {Promise}
   */
  static _send (providers, sender, options) {
    if (!providers.length) {
      return Promise.reject(new ExecutionError('No available provider'))
    }

    // Always execute the first one.
    const provider = providers[0]

    return provider.send(options)
  }
}
