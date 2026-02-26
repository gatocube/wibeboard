/**
 * engine/core — foundational building blocks.
 *
 * Re-exports everything from Registry and utils so consumers
 * can write:  import { Registry, generateId } from '@/engine/core'
 */

export { Registry, type RegistryItem } from './Registry'
export {
    generateId,
    shortId,
    deepClone,
    now,
    truncate,
    capitalize,
} from './utils'
