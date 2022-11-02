const TTLCache = require('@isaacs/ttlcache');

module.exports = class TTLCacheService {
    constructor(options) {
        this.cache = new TTLCache(options)
    }

    has = (key) => {
        return this.cache.has(key)
    }

    getEntries = () => {
        return this.cache.entries()
    }

    clear = () => {
        this.cache.clear()
    }

    delete = (key) => {
        this.cache.delete(key)
    }

    get = (key) => {
        return this.cache.get(key)
    }

    set = (key, obj) => {
        this.cache.set(key, obj)
    }
}