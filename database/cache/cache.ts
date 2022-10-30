export type Key = number | string

export interface Cache {
    set: (key: Key, obj: any) => void,
    get: (key: Key) => any | undefined,
    delete: (key: Key) => void,
    has: (key: Key) => boolean,
}