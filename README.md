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

env-parser is a powerful, fully type-enforced Node environment variable parser. It supports arbitrary parsing, validation, and property nesting (recursively).

## Usage Overview

```typescript
import { parseEnv } from '@samhuk/env-parser'

const mockProcessEnv = {
  SERVER_PORT: '4001',
  SERVER_HOST: '10.0.0.1',
  NODE_ENV: 'production',
  DB_HOST: '11.0.0.1',
  DB_PORT: '7534',
  DB_NAME: 'test-db',
  DB_OTHER_OPTIONS_TIMEOUT_SECONDS: '1000',
}

const env = fn({
  serverPort: { $default: 8080, },
  serverHost: { $default: 'localhost' },
  isProd: {
    $name: 'NODE_ENV',
    $default: false,
    $parse: v => v === 'production',
  },
  db: {
    host: { $default: 'localhost' },
    port: {
      $default: 5432,
      $parse: parseInt,
      $validate: v => !Number.isNaN(v) && v > 3000 && v < 60000,
    },
    name: { $default: 'db' },
    otherOptions: {
      timeoutSeconds: {
        $default: 1000,
        $validate: v => !Number.isNaN(v) && v > 0,
      },
    },
  },
}, mockProcessEnv)

type Env = typeof env
/*
type Env = {
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
}
*/
```

## Development

Contributions welcome. See [./contributing/development.md](./contributing/development.md)

---

If you found this package delightful, feel free to [buy me a coffee](https://www.buymeacoffee.com/samhuk) ✨
