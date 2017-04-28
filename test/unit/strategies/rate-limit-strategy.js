import test from 'tape'
import * as sinon from 'sinon'

import { RateLimitStrategy, RateLimitExceededError } from '../../../src/strategies/rate-limit-strategy'

test('executing rate-limit-strategy', (t) => {
  t.plan(13)

  const db = {}

  const stubbedGetCall = sinon.stub()
    .onFirstCall().yields(null, {
      total: 2,
      remaining: 10,
      reset: 5000
    })
    .onSecondCall().yields(null, {
      total: 2,
      remaining: 1,
      reset: 5000
    })
    .onThirdCall().yields(null, {
      total: 2,
      remaining: 0,
      reset: 5000
    })

  class StubbedLimiter {
    get (callback) {
      stubbedGetCall(callback)
    }
  }

  const rateLimitStrategy = new RateLimitStrategy({
    db,
    max: 2,
    duration: 24 * 60 * 60 * 1000,
    Limiter: StubbedLimiter
  })

  const providerA = {
    name: 'providerA',
    send: sinon.stub().returns(Promise.resolve({}))
  }

  const providerB = {
    name: 'providerB',
    send: sinon.stub().returns(Promise.resolve({}))
  }

  const providerC = {
    name: 'providerC',
    send: sinon.stub().returns(Promise.resolve({}))
  }

  const sender = {
    providers: [ providerA, providerB, providerC ]
  }

  const sendOptions = {
    to: '+66111222333',
    message: 'test message for multi-provider sms sender module (parrotlet)'
  }

  rateLimitStrategy.execute(sender, sendOptions)
    .then(() => {
      t.ok(stubbedGetCall.calledOnce)
      t.ok(providerA.send.calledOnce)
      t.ok(providerB.send.notCalled)
      t.ok(providerC.send.notCalled)

      return rateLimitStrategy.execute(sender, sendOptions)
    })
    .then(() => {
      t.ok(stubbedGetCall.calledTwice)
      t.ok(providerA.send.calledTwice)
      t.ok(providerB.send.notCalled)
      t.ok(providerC.send.notCalled)

      return rateLimitStrategy.execute(sender, sendOptions)
    })
    .then(() => t.error(new Error('Should not be on this path')))
    .catch((error) => {
      t.ok(error instanceof RateLimitExceededError, 'should be instance of RateLimitExceededError')
      t.ok(stubbedGetCall.calledThrice)
      t.ok(providerA.send.calledTwice)
      t.ok(providerB.send.notCalled)
      t.ok(providerC.send.notCalled)
    })
})
