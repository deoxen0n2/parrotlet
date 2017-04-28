export class NullProvider {
  /**
   * @param {Object} [options]
   * @param {String} [options.name='null']
   */
  constructor (options = {}) {
    this.name = options.name || 'null'
  }

  /**
   * @param {Object} options   See Provider#send() options.
   */
  send (options) {
    return Promise.resolve({ delivered: true })
  }
}
