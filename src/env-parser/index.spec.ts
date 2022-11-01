import { parseEnv } from '.'

describe('env-parser', () => {
  describe('parseEnv', () => {
    const fn = parseEnv

    test('basic test', () => {
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
      const env = fn({
        serverPort: { $default: 8080 },
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
        adminUserNames: { $parse: 'arr' },
        enableDataScrape: { $parse: 'bool' },
      }, mockProcessEnv)

      expect(env).toEqual({
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
      })
    })
  })
})
