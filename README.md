Extensible multi-provider SMS sender with multi-strategy support.

> **Development status:** need more feedback from real-world usage to reach v1. And upon API is stable more data stores, providers, and strategies will be added as needed. PR is always welcome.

## Install

```sh
$ yarn add parrotlet   # or npm install --save parrotlet
```

## Usage

```js
import redis from 'redis'
import { Sender, DataStores, Strategies, Providers } from 'parrotlet'

const db = redis.createClient()

// See example configuration at the Providers subsection below.
const config = {
  // ...
}

// Provider configurations.
const twilioProvider = new Providers.TwilioProvider(config.twilio)
const wavecellProvider = new Providers.WavecellProvider(config.wavecell)

// Sender configuration.
const sender = new Sender({
  providers: [ twilioProvider, wavecellProvider ],
  strategies: [
    new Strategies.RateLimitStrategy({
      db,
      max: 4,             // 4 messages per phone number within 1 hour.
      duration: 3600000   // Limit will be reset after 1 hour.
    }),

    new Strategies.RoundRobinStrategy({
      timeBeforeReset: 50 * 1000   // After 50 seconds, it will reset to the first provider.
    })
  ]
})

// Send options.
const sendOptions = {
  to: '+66111222333',
  message: 'test message for multi-provider sms sender module (parrotlet)'
}

// Sending messages.
sender.send(sendOptions)                  // Will be sent by Twilio
  .then(() => sender.send(sendOptions))   // Will be sent by Wavecell
  .then(() => sender.send(sendOptions))   // Will be sent by Twilio
  .then(() => sender.send(sendOptions))   // Will not be sent but rejected with RateLimitExceededError
  .catch((error) => {
    assert(error instanceof Strategies.RateLimitStrategy.Errors.RateLimitExceededError)   // true
  })
```

## Tests

```sh
$ yarn test               # or npm test, run unit test, does not require external setup.

$ yarn test-integration   # or npm run test-integration, run integration test,
                          # requires external setup, see `test/integration/config.js.example`.
```

# API

## Sender(options)

#### options

##### dataStore

Type: `DataStore`
Required: `false`  
Default: `new DataStores.MemoryStore()`

A `DataStore` instance that will be used as context store for each strategy execution. Any `DataStore`-compatible object can be used instead of the default in-memory store.

##### providers

Type: `Array<Provider>`  
Required: `true`

An array of available `Provider`(s). This provider list will go through each strategy execution and eventually be reduced to 1 provider on each `Sender#send([sendOptions])` call.

##### strategy

Type: `Strategy` (See `Strategy` class description below)  
Required: `true` if `strategies` is not provided

A strategy that will be executed when sending message to determine how to send.

##### strategies

Type: `Array<Strategy>`  
Required: `true` if `strategy` is not provided

An array of `Strategy` that will be executed, in order as provided, when sending message to determine how to send.

### send(sendOptions)

Send an SMS message to the specified destination phone number. Return `Promise`.

#### sendOptions

##### to

Type: `String`  
Required: `true`

The destination phone number to send message to.

##### message

Type: `String`  
Required: `true`

A Unicode-encoded message to send to destination phone number.

## DataStore(options)

A key-value store. A `DataStore` instance is just any object with `#get()` and `#set()` methods as specified below. Bundled `DataStore` is `MemoryStore`.

### get(key)

Retrieve an associated value using key.

#### key

Type: `String`  
Required: `true`

A key that will be used to retrieve an associated value.

### set(key, value)

Retrieve an associated value using key.

#### key

Type: `String`  
Required: `true`

A key that will be used to retrieve an associated value.

#### value

Type: `Object`  
Required: `true`

Any value that can be serialized using `JSON.stringify`. This value will be associated with the provided key and can be retrieved later by using that key.

## Provider(options)

A `Provider` instance is just any object with `#send()` method as specified below. Bundled `Provider`s are `TwilioProvider`, `WavecellProvider` and `NullProvider`.

### send(sendOptions)

Send an SMS message to the specified destination phone number. Return `Promise`.

#### sendOptions

Type: `Object`  
Required: `true`

See `Sender#send()`.

## Strategy(options)

A `Strategy` instance is just any object with `#execute()` method as specified below. Bundled `Strategy`s are `RateLimitStrategy` and `RoundRobinStrategy`.

#### options

Vary for each type of strategy. See bundled `Strategy`s below for example.

### execute(sender, sendOptions, multi=false, reducedProviders = [])

#### sender

Type: `Sender`  
Required: `true`

A `Sender` instance. The list of available providers and the data store will be obtained from this instance.

#### sendOptions

Type: `Object`  
Required: `true`

See `Sender#send()`.

#### multi

Type: `Object`  
Required: `false`  
Default: `false`

Will be true when the strategy is executed as part of the multi-strategy execution.

#### reducedProviders

Type: `Array`  
Required: `false`  
Default: `[ ]`

An array of `Provider`(s) that is reduced from previous strategy execution as part of the multi-strategy execution.

# DataStores

Bundled data stores are `MemoryStore`.

## MemoryStore

In-memory data store. Simple and easiest way to use this module.

```js
const memoryStore = new DataStores.MemoryStore()

memoryStore.get(key)
memoryStore.set(key, value)
```

# Providers

Bundled strategies are `TwilioProvider`, `WavecellProvider`, and `NullProvider`.

## TwilioProvider

Send SMS message via Twilio. Twilio credentials is required.

```js
const twilioProvider = new Providers.TwilioProvider({
  accountSid: 'account_sid_here',
  authToken: 'auth_token_here',
  from: 'from_phone_number_here'
})

twilioProvider.send(sendOptions)
```

## WavecellProvider

Send SMS message via Wavecell. Wavecell credentials is required.

```js
const wavecellProvider = new Providers.WavecellProvider({
  accountId: 'account_id_here',
  subAccountId: 'sub_account_id_here',
  password: 'password_here',
  source: 'source_here'
})

wavecellProvider.send(sendOptions)
```

## NullProvider

When calling `#send()` will not actually send any message. Useful for development and testing.

```js
const nullProvider = new Providers.NullProvider()

nullProvider.send(sendOptions)   // Not sending anything.
```

# Strategies

Bundled strategies are `RateLimitStrategy` and `RoundRobinStrategy`.

## RateLimitStrategy

Limit number of messages that can be sent to each destination phone number within the specified duration. Use `ratelimiter` package internally. Redis instance is required.

```js
import redis from 'redis'   // can use `ioredis` instead.

const db = redis.createClient()

const rateLimitStrategy = new Strategies.RateLimitStrategy({
  db,
  max: 4,             // 4 messages per phone number within 1 hour.
  duration: 3600000   // Limit will be reset after 1 hour.
})
```

## RoundRobinStrategy

All provided providers will be used as SMS message sender for each message sending attempt, in round-robin manner. Message sending attempt is identical if destination phone number and message body are the same.

```js
const roundRobinStrategy = new Strategies.RoundRobinStrategy({
  timeBeforeReset: 50 * 1000   // After 50 seconds, it will reset to the first provider.
})
```

# License

Copyright 2017 Saran Siriphantnon &lt;deoxen0n2@gmail.com&gt; MIT License.
