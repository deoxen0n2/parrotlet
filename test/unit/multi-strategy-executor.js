import test from 'tape'
import * as sinon from 'sinon'
import { MultiStrategyExecutor } from '../../src/multi-strategy-executor'

test('executing multi-strategy', (t) => {
  t.plan(7)

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

  const strategyA = {
    execute: sinon.stub().returns(Promise.resolve([ providerA, providerB, providerC ]))
  }

  const strategyB = {
    execute: sinon.stub().returns(Promise.resolve([ providerA, providerC ]))
  }

  const strategyC = {
    execute: sinon.stub().returns(Promise.resolve([ providerA, providerC ]))
  }

  const strategies = [ strategyA, strategyB, strategyC ]

  const sender = {
    send: sinon.stub().returns(Promise.resolve({}))
  }

  const options = {
  }

  MultiStrategyExecutor.execute(strategies, sender, options)
    .then(() => {
      t.ok(providerA.send.calledOnce)
      t.ok(providerB.send.notCalled)
      t.ok(providerC.send.notCalled)

      t.ok(providerA.send.calledWithExactly(options))
      t.ok(strategyA.execute.calledWithExactly(sender, options, true, []))
      t.ok(strategyB.execute.calledWithExactly(sender, options, true, [ providerA, providerB, providerC ]))
      t.ok(strategyC.execute.calledWithExactly(sender, options, true, [ providerA, providerC ]))
    })
    .catch(t.error)
})
