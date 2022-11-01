<h1 align="center">env-parser</h1>
<p align="center">
  <em>Powerful Typescript environment variable parser</em>
</p>


<p align="center">
  <a href="https://img.shields.io/badge/License-MIT-green.svg" target="_blank">
    <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="license" />
  </a>
  <a href="https://badge.fury.io/js/@samhuk/env-parser.svg" target="_blank">
    <img src="https://badge.fury.io/js/@samhuk/env-parser.svg" alt="npm version" />
  </a>
</p>

## Overview

env-parser is a powerful, fully type-enforced Node environment variable parser. It supports environment type inference, arbitrary parsing and validation, and recursive property nesting.

## Why use?

env-parser combines a set of features that together no other environment variable parser package has:

* Delightful type inference of your environment according to your description of it.
* Recursive property nesting.
* Robust validation and error handling functionality.

## Usage Overview

Parse environment variables, from `process.env` by default or manually provided:

```typescript
import parseEnv from '@samhuk/env-parser'

const mockProcessEnv = {
  SERVER_PORT: '4001',
  SERVER_HOST: '10.0.0.1',
  NODE_ENV: 'production',
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DB_NAME: 'test-db',
  DB_OTHER_OPTIONS_TIMEOUT_SECONDS: '1000',
  ADMIN_USER_NAMES: '["root", "admin", "administrator"]',
  ENABLE_DATA_SCRAPE: '1',
}
const envResult = parseEnv({
  serverPort: { $default: 8080 },
  serverHost: { $default: 'localhost' },
  isProd: { $name: 'NODE_ENV', $default: false, $parse: v => v === 'production' },
  db: {
    host: { $default: 'localhost' },
    port: { $default: 5432, $validate: isNumberBetween(80, 60000) },
    name: { $default: 'db' },
    otherOptions: {
      timeoutSeconds: { $default: 1000, $validate: isNonNegativeNumber },
    },
  },
  adminUserNames: { $parse: 'arr' },
  enableDataScrape: { $parse: 'bool' },
}, mockProcessEnv)

console.log(envResult.value)
/* {
  serverPort: 4001,
  serverHost: '10.0.0.1',
  isProd: true,
  db: {
    host: 'localhost',
    port: 5432,
    name: 'test-db',
    otherOptions: {
      timeoutSeconds: 1000,
    },
  },
  adminUserNames: ['root', 'admin', 'administrator'],
  enableDataScrape: true,
}) */
console.log(envResult.hasErrors) // false
console.log(envResukt.errors) // []
```
The parsed environment is fully typed according to your description of it:
```typescript
type Env = typeof envResult['val']
/* type Env = {
    serverPort: number;
    serverHost: string;
    isProd: boolean;
    db: {
        host: string;
        port: number;
        name: string;
        otherOptions: {
            timeoutSeconds: number;
        };
    };
} */
```

## Development

Contributions welcome. See [./contributing/development.md](./contributing/development.md).

---

If you found this package delightful, feel free to [buy me a coffee](https://www.buymeacoffee.com/samhuk) ✨

*Package generated from [ts-npm-package-template](https://github.com/samhuk/ts-npm-package-template)*