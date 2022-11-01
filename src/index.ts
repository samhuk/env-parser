/**
 * This file defines the public API of the package. Everything here will be available from
 * the top-level package name when importing as an npm package.
 *
 * E.g. `import { ... } from '@samhuk/env-parser`
 */

import { parseEnv } from './env-parser'

export * from './types'

export default parseEnv
