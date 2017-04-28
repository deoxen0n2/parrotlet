import axios from 'axios'
import querystring from 'querystring'

export class WavecellProvider {
  /**
   * @param {Object} options
   * @param {String} options.accountId
   * @param {String} options.subAccountId
   * @param {String} options.password
   * @param {String} options.source
   * @param {String} [options.name='wevecell']
   */
  constructor (options) {
    if (typeof options !== 'object') {
      throw new Error('"options" is required as the first parameter')
    }

    if (!options.accountId || !options.subAccountId || !options.password || !options.source) {
      throw new Error('"accountId", "subAccountId", "password", and "source" options are required')
    }

    const { accountId, subAccountId, password, source } = options

    this.accountId = accountId
    this.subAccountId = subAccountId
    this.password = password
    this.source = source
    this.name = options.name || 'wavecell'
  }

  /**
   * @param {Object} options   See Provider#send() options.
   */
  send (options) {
    const { to, message } = options
    const wavecellSendOptions = {
      AccountId: this.accountId,
      SubAccountId: this.subAccountId,
      Password: this.password,
      Source: this.source,
      Destination: to,
      Body: message,
      Encoding: WavecellProvider.ENCODING,
      ScheduledDateTime: '',
      UMID: ''
    }
    const wavecellSendOptionsAsQueryString = querystring.stringify(wavecellSendOptions)

    console.log('wavecellSendOptionsAsQueryString:', wavecellSendOptionsAsQueryString)

    return axios.get(WavecellProvider.BASE_URL, { params: wavecellSendOptions })
  }
}

WavecellProvider.BASE_URL = 'https://wms1.wavecell.com/Send.asmx/SendMT'
WavecellProvider.ENCODING = 'UNICODE'
