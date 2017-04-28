export class MemoryStore {
  constructor () {
    this.data = {}
  }

  get (key) {
    const value = this.data[key] || {}

    return Promise.resolve(value)
  }

  set (key, value) {
    this.data[key] = value

    return Promise.resolve(value)
  }
}
