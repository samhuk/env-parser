import { parseEnv } from '.'

describe('env-parser', () => {
  describe('parseEnv', () => {
    const fn = parseEnv

    const isNumberBetween = (l: number, u: number) => (
      (v: number) => !Number.isNaN(v) && v > l && v < u
    )
    const isNonNegativeNumber = (v: number) => !Number.isNaN(v) && v > 0

    test('basic test', () => {
      const mockProcessEnv = {
        SERVER_PORT: '4001',
        SERVER_HOST: '10.0.0.1',
        NODE_ENV: 'production',
        DB_HOST: 'localhost',
        DB_PORT: '5432',
        DB_PORT2: '79',
        DB_PORT4: '80',
        DB_PORT5: '80',
        DB_NAME: 'test-db',
        DB_OTHER_OPTIONS_TIMEOUT_SECONDS: '1000',
        ADMIN_USER_NAMES: '["root", "admin", "administrator"]',
        ENABLE_DATA_SCRAPE: '1',
      }
      const env = fn({
        serverPort: { $default: 8080 },
        serverHost: { $default: 'localhost' },
        isProd: { $name: 'NODE_ENV', $default: false, $parse: v => v === 'production' },
        db: {
          host: { $default: 'localhost' },
          port: { $default: 5432, $validate: isNumberBetween(80, 60000) },
          port2: { $validate: isNumberBetween(80, 60000) },
          port3: { $parse: 'int' },
          port4: { $parse: v => {
            throw new Error('failed parsing value')
          } },
          port5: { $validate: v => {
            throw new Error('failed validating value')
          } },
          name: { $default: 'db' },
          otherOptions: {
            timeoutSeconds: { $default: 1000, $validate: isNonNegativeNumber },
          },
        },
        adminUserNames: { $parse: 'arr' },
        enableDataScrape: { $parse: 'bool' },
      }, mockProcessEnv)

      expect(env).toEqual({
        value: {
          serverPort: 4001,
          serverHost: '10.0.0.1',
          isProd: true,
          db: {
            host: 'localhost',
            port: 5432,
            port2: null,
            port3: null,
            port4: null,
            port5: null,
            name: 'test-db',
            otherOptions: {
              timeoutSeconds: 1000,
            },
          },
          adminUserNames: ['root', 'admin', 'administrator'],
          enableDataScrape: true,
        },
        hasErrors: true,
        errors: [
          {
            envVarName: 'DB_PORT2',
            rawValue: '79',
            type: 'validate_value_fail',
          },
          {
            envVarName: 'DB_PORT3',
            type: 'missing_value',
          },
          {
            envVarName: 'DB_PORT4',
            rawValue: '80',
            type: 'parse_value_exception',
            error: new Error('failed parsing value'),
          },
          {
            envVarName: 'DB_PORT5',
            rawValue: '80',
            type: 'validate_value_exception',
            error: new Error('failed validating value'),
          },
        ],
      })
    })
  })
})
