import test from 'tape'
import * as sinon from 'sinon'
import redis from 'redis'
import Bluebird from 'bluebird'
import { Sender, Strategies, Providers } from '../../src'

import config from './config'

test('sending SMS with 4 retries and 3 providers and rate limit exceeded', (t) => {
  t.plan(4)

  const db = redis.createClient()
  const removeOldLimitKey = Bluebird.promisify(db.del, { context: db })

  const twilioProvider = new Providers.TwilioProvider(config.twilio)
  const wavecellProvider = new Providers.WavecellProvider(config.wavecell)
  const nullProvider = new Providers.NullProvider()

  // Spies
  const twilioSendSpy = sinon.spy(twilioProvider, 'send')
  const wavecellSendSpy = sinon.spy(wavecellProvider, 'send')
  const nullSendSpy = sinon.spy(nullProvider, 'send')

  const sender = new Sender({
    providers: [ twilioProvider, wavecellProvider, nullProvider ],
    strategies: [
      new Strategies.RateLimitStrategy({
        db,
        max: 4
      }),

      new Strategies.RoundRobinStrategy({
        timeBeforeReset: 5 * 1000  // 5s.
      })
    ]
  })

  const sendOptions = {
    to: config.sendOptions.to,
    message: 'test message for multi-provider sms sender module parrotlet)'
  }

  removeOldLimitKey(`limit:${sendOptions.to}`)
    .then(() => sender.send(sendOptions))
    .then(() => sender.send(sendOptions))
    .then(() => sender.send(sendOptions))
    .then(() => sender.send(sendOptions))
    .then(() => sender.send(sendOptions))
    .then(() => {
      db.quit()

      t.error(new Error('Should not be on this path'))
    })
    .catch((error) => {
      db.quit()

      t.ok(twilioSendSpy.calledTwice, 'should call twilioProvider#send twice')
      t.ok(wavecellSendSpy.calledOnce, 'should call wavecellSendSpy#send once')
      t.ok(nullSendSpy.calledOnce, 'should call nullProvider#send once')
      t.ok(error instanceof Strategies.RateLimitStrategy.Errors.RateLimitExceededError, 'should be instance of RateLimitExceededError')

      if (!(error instanceof Strategies.RateLimitStrategy.Errors.RateLimitExceededError)) {
        t.error(error)
      }
    })
})
