import { EnvOption, EnvOptionParse, EnvOptions, EnvVarType, EnvVarTypeUnion, ErrorType, ParsedEnv, ParseEnvError, ParseEnvResult } from './types'

/**
 * @example
 * camelCaseToSnakeCase('dateCreated') // DATE_CREATED
 */
const camelCaseToUpperCaseSnakeCase = (s: string) => s.replace(/[A-Z]/g, m => `_${m}`).toUpperCase()

const isEnvOptionsLeafNode = (envOptions: EnvOptions, keys: string[]): envOptions is EnvOption => (
  !keys.some(s => !s.startsWith('$'))
)

const isEnvVarOptionParseEnvVarType = (parse?: EnvOptionParse): parse is EnvVarTypeUnion => (
  typeof parse === 'string'
)

const defaultIntParser = parseInt
const defaultFloatParser = parseFloat
const defaultStringParser = (v: any) => v
const defaultBoolParser = (v: any) => ({
  true: true,
  1: true,
  y: true,
  Y: true,
  T: true,
  t: true,
} as any)[v] ?? false
const defaultJsonParser = JSON.parse

const parseValueByParse = (rawValue: any, parse: EnvOptionParse) => {
  if (isEnvVarOptionParseEnvVarType(parse)) {
    switch (parse) {
      case EnvVarType.INT:
        return defaultIntParser(rawValue)
      case EnvVarType.FLOAT:
        return defaultFloatParser(rawValue)
      case EnvVarType.STR:
        return defaultStringParser(rawValue)
      case EnvVarType.BOOL:
        return defaultBoolParser(rawValue)
      case EnvVarType.OBJ:
        return defaultJsonParser(rawValue)
      case EnvVarType.ARR:
        return defaultJsonParser(rawValue)
      default:
        return rawValue
    }
  }
  else {
    return parse(rawValue)
  }
}

const parseValueByDefault = (rawValue: any, _default: any) => {
  switch (typeof _default) {
    case 'number':
      return defaultFloatParser(rawValue)
    case 'string':
      return defaultStringParser(rawValue)
    case 'boolean':
      return defaultBoolParser(rawValue)
    case 'object':
      return defaultJsonParser(rawValue)
    default:
      return rawValue
  }
}

const parseValue = (rawValue: any, envOption: EnvOption) => {
  const noParse = envOption.$parse == null
  const noDefault = envOption.$default == null

  if (noParse && noDefault)
    return rawValue

  if (!noParse)
    return parseValueByParse(rawValue, envOption.$parse)

  if (!noDefault)
    return parseValueByDefault(rawValue, envOption.$default)

  return rawValue
}

const _parseEnv = (
  envOptions: EnvOptions,
  defaultEnvVarName: string,
  processEnvVars: { [envVarName: string]: string },
  errors: ParseEnvError[],
): ParsedEnv => {
  const keys = Object.keys(envOptions)
  // If leaf node, parse leaf node
  if (isEnvOptionsLeafNode(envOptions, keys)) {
    const envVarName = envOptions.$name ?? defaultEnvVarName
    const rawValue = processEnvVars[envVarName]
    let value: any

    if (rawValue == null) {
      if (envOptions.$default === undefined) {
        errors.push({
          type: ErrorType.MISSING_VALUE,
          envVarName,
        })
        return null
      }

      value = envOptions.$default
    }

    try {
      value = parseValue(rawValue, envOptions)
    }
    catch (error: any) {
      errors.push({
        type: ErrorType.PARSE_VALUE_EXCEPTION,
        envVarName,
        rawValue,
        error,
      })
      return null
    }

    if (envOptions.$validate != null) {
      try {
        if (!envOptions.$validate(value)) {
          errors.push({
            type: ErrorType.VALIDATE_VALUE_FAIL,
            envVarName,
            rawValue,
          })
          return null
        }
      }
      catch (error: any) {
        errors.push({
          type: ErrorType.VALIDATE_VALUE_EXCEPTION,
          envVarName,
          rawValue,
          error,
        })
        return null
      }
    }

    return value
  }

  // If not leaf node, parse child nodes
  const parsedChildNodes: { [k in string]: ParsedEnv } = {}
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i]
    const childDefaultEnvVarName = (defaultEnvVarName != null ? `${defaultEnvVarName}_` : '').concat(camelCaseToUpperCaseSnakeCase(key))
    parsedChildNodes[key] = _parseEnv(envOptions[key], childDefaultEnvVarName, processEnvVars, errors)
  }
  return parsedChildNodes as any
}

export const parseEnv = <T extends EnvOptions>(
  envOptions: T,
  processEnvVars?: { [envVarName: string]: string },
): ParseEnvResult<T> => {
  const errors: ParseEnvError[] = []
  const value = _parseEnv(envOptions, null, processEnvVars ?? process.env, errors) as ParsedEnv<T>

  return {
    value,
    errors,
    hasErrors: errors.length > 0,
  }
}
