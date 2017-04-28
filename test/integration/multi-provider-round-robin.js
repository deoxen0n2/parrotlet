import test from 'tape'
import * as sinon from 'sinon'
import { Sender, Strategies, Providers } from '../../src'

import config from './config'

test('sending SMS with 4 retries and 3 providers', (t) => {
  t.plan(3)

  const twilioProvider = new Providers.TwilioProvider(config.twilio)
  const wavecellProvider = new Providers.WavecellProvider(config.wavecell)
  const nullProvider = new Providers.NullProvider()

  // Spies
  const twilioSendSpy = sinon.spy(twilioProvider, 'send')
  const wavecellSendSpy = sinon.spy(wavecellProvider, 'send')
  const nullSendSpy = sinon.spy(nullProvider, 'send')

  const sender = new Sender({
    providers: [ twilioProvider, wavecellProvider, nullProvider ],
    strategy: new Strategies.RoundRobinStrategy({
      timeBeforeReset: 5 * 1000  // 5s.
    })
  })

  const sendOptions = {
    to: config.sendOptions.to,
    message: 'test message for multi-provider sms sender module parrotlet)'
  }

  sender.send(sendOptions)
    .then(() => sender.send(sendOptions))
    .then(() => sender.send(sendOptions))
    .then(() => sender.send(sendOptions))
    .then(_doAssert)
    .catch(t.error)

  function _doAssert () {
    t.ok(twilioSendSpy.calledTwice, 'should call twilioProvider#send twice')
    t.ok(wavecellSendSpy.calledOnce, 'should call wavecellSendSpy#send once')
    t.ok(nullSendSpy.calledOnce, 'should call nullProvider#send once')
  }
})

test('sending SMS with 3 retries and 3 providers and reset timed out', (t) => {
  t.plan(3)

  const clock = sinon.useFakeTimers()

  const twilioProvider = new Providers.TwilioProvider(config.twilio)
  const wavecellProvider = new Providers.WavecellProvider(config.wavecell)
  const nullProvider = new Providers.NullProvider()

  // Spies
  const twilioSendSpy = sinon.spy(twilioProvider, 'send')
  const wavecellSendSpy = sinon.spy(wavecellProvider, 'send')
  const nullSendSpy = sinon.spy(nullProvider, 'send')

  const sender = new Sender({
    providers: [ twilioProvider, wavecellProvider, nullProvider ],
    strategy: new Strategies.RoundRobinStrategy({
      timeBeforeReset: 5 * 1000  // 5s.
    })
  })

  const sendOptions = {
    to: config.sendOptions.to,
    message: 'test message for multi-provider sms sender module (parrotlet'
  }

  sender.send(sendOptions)
    .then(() => sender.send(sendOptions))
    .then(() => clock.tick(6 * 1000))
    .then(() => sender.send(sendOptions))
    .then(_doAssert)
    .catch(t.error)
    .then(() => clock.restore)

  function _doAssert () {
    t.ok(twilioSendSpy.calledTwice, 'should call twilioProvider#send twice')
    t.ok(wavecellSendSpy.calledOnce, 'should call wavecellSendSpy#send once')
    t.ok(nullSendSpy.notCalled, 'should not call nullProvider#send')
  }
})
