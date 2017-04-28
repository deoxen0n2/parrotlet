import test from 'tape'
import * as sinon from 'sinon'
import { Sender } from '../../src/sender'
import { RoundRobinStrategy } from '../../src/strategies/round-robin-strategy'

test('sending SMS with 4 retries and 3 providers', (t) => {
  t.plan(3)

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

  const sender = new Sender({
    providers: [ providerA, providerB, providerC ],
    strategy: new RoundRobinStrategy({
      timeBeforeReset: 5 * 1000  // 5s.
    })
  })

  const sendOptions = {
    to: '+66111222333',
    message: 'test message for multi-provider sms sender module (parrotlet)'
  }

  sender.send(sendOptions)
    .then(() => sender.send(sendOptions))
    .then(() => sender.send(sendOptions))
    .then(() => sender.send(sendOptions))
    .then(_doAssert)
    .catch(t.error)

  function _doAssert () {
    t.ok(providerA.send.calledTwice)
    t.ok(providerB.send.calledOnce)
    t.ok(providerC.send.calledOnce)
  }
})

test('sending SMS with 3 retries and 3 providers and reset timed out', (t) => {
  t.plan(3)

  const clock = sinon.useFakeTimers()

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

  const sender = new Sender({
    providers: [ providerA, providerB, providerC ],
    strategy: new RoundRobinStrategy({
      timeBeforeReset: 5 * 1000  // 5s.
    })
  })

  const sendOptions = {
    to: '+66111222333',
    message: 'test message for multi-provider sms sender module (parrotlet)'
  }

  sender.send(sendOptions)
    .then(() => sender.send(sendOptions))
    .then(() => clock.tick(6 * 1000))
    .then(() => sender.send(sendOptions))
    .then(_doAssert)
    .catch(t.error)
    .then(() => clock.restore)

  function _doAssert () {
    t.ok(providerA.send.calledTwice)
    t.ok(providerB.send.calledOnce)
    t.ok(providerC.send.notCalled)
  }
})
