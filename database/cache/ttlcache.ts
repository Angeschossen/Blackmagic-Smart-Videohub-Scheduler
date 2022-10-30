import TTLCache from "@isaacs/ttlcache"
import { Cache, Key } from "./cache"

class TTLCacheService implements Cache {
    private cache: TTLCache<Key, any>
    constructor(options?: TTLCache.Options<Key, any>) {
        this.cache = new TTLCache(options)
    }

    has = (key: Key) => {
        return this.cache.has(key)
    }

    delete = (key: Key) => {
        this.cache.delete(key)
    }

    get = (key: Key) => {
        return this.cache.get(key)
    }

    set = (key: Key, obj: any) => {
        this.cache.set(key, obj)
    }
}

export default TTLCacheService