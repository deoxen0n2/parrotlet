import twilio from 'twilio'

export class TwilioProvider {
  /**
   * @param {Object} options
   * @param {String} options.accountSid
   * @param {String} options.authToken
   * @param {String} [options.name='twilio']
   */
  constructor (options) {
    if (typeof options !== 'object') {
      throw new Error('"options" is required as the first parameter')
    }

    if (!options.accountSid || !options.authToken) {
      throw new Error('"accountSid" and "authToken" options are required')
    }

    const { accountSid, authToken } = options

    this.client = twilio(accountSid, authToken)
    this.from = options.from
    this.name = options.name || 'twilio'
  }

  /**
   * @param {Object} options   See Provider#send() options.
   */
  send (options) {
    const from = options.from || this.from
    const { to, message } = options
    const twilioSendOptions = {
      from,
      to,
      body: message
    }

    return this.client.sms.messages.post(twilioSendOptions)
  }
}
