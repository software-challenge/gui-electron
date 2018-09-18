import * as v from 'validate-typescript'

export function loadFromStorage<T>(key: string, schema: any, defaults: T): T {
    var loaded = window.localStorage[key];
    if (loaded == null) {
        return defaults;
    } else {
        const parsed: T = JSON.parse(loaded);
        try {
          console.log(v.validate(schema, parsed))
          return parsed
        } catch(e) {
          console.log("Cache validation for " + key + " failed", e)
          window.localStorage[key] = null
          return defaults
        }
    }
}