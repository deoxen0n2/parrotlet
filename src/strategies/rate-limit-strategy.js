import Limiter from 'ratelimiter'
import ExtendableError from 'es6-error'
import Debug from 'debug'

const debug = Debug('parrotlet:strategies:rate-limit')

export class RateLimitExceededError extends ExtendableError {
  /**
   * @param {Object} limit
   * @param {Number} limit.total
   * @param {Number} limit.remaining
   * @param {Number} limit.reset
   * @param {String} [message='Rate limit exceeded, please try again in ...]
   */
  constructor (message, limit) {
    if (!message) {
      const delta = (limit.reset * 1000) - Date.now() | 0

      message = `Rate limit exceeded, please try again in ${delta} ms`
    }

    super(message)

    this.limit = limit
  }
}

export class RateLimitStrategy {
  /**
    * @param {Object} options
    * @param {Redis} options.db
    * @param {Number} [options.max=2500]
    * @param {Number} [options.duration=3600000]
    * @param {Class} [options.Limiter=Limiter]     An optional `ratelimiter` compatible implementation. Also useful for unit test.
    */
  constructor (options) {
    if (typeof options !== 'object') {
      throw new Error('"options" is required as the first parameter')
    }

    if (!options.db) {
      throw new Error('"db" option is required and must be either redis- or ioredis-compatible instance')
    }

    this.db = options.db
    this.max = options.max
    this.duration = options.duration
    this.Limiter = options.Limiter || Limiter
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

    const providers = (reducedProviders && reducedProviders.length) ? reducedProviders : sender.providers

    const id = this._getLimiterId(sender, options)
    const { db, max, duration } = this

    const limiter = new this.Limiter({ id, db, max, duration })

    return new Promise((resolve, reject) => {
      limiter.get((error, limit) => {
        if (error) {
          return reject(error)
        }

        if (!limit.remaining) {
          const rateLimitError = new RateLimitExceededError(limit)

          return reject(rateLimitError)
        }

        if (multi) {
          return resolve(providers)
        }

        // Always execute the first one.
        const provider = providers[0]

        return provider.send(options)
          .then((result) => resolve(result))
      })
    })
  }

  /**
   * @param {Sender} sender
   * @param {Object} options   See Sender#send() options.
   */
  _getLimiterId (sender, options) {
    const id = options.to

    return id
  }
}

RateLimitStrategy.Errors = {
  RateLimitExceededError
}
