import { EnvOption, EnvOptionParse, EnvOptions, EnvVarType, EnvVarTypeUnion, ParsedEnv } from './types'

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

const _parseEnv = (envOptions: EnvOptions, defaultEnvVarName: string, processEnvVars: { [envVarName: string]: string }): ParsedEnv => {
  const keys = Object.keys(envOptions)
  // If leaf node, parse leaf node
  if (isEnvOptionsLeafNode(envOptions, keys))
    return parseValue(processEnvVars[envOptions.$name ?? defaultEnvVarName], envOptions)

  // If not leaf node, parse child nodes
  const parsedChildNodes: { [k in string]: EnvOptions } = {}
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i]
    const childDefaultEnvVarName = (defaultEnvVarName != null ? `${defaultEnvVarName}_` : '').concat(camelCaseToUpperCaseSnakeCase(key))
    parsedChildNodes[key] = _parseEnv(envOptions[key], childDefaultEnvVarName, processEnvVars) as any
  }
  return parsedChildNodes as any
}

export const parseEnv = <T extends EnvOptions>(
  envOptions: T,
  processEnvVars?: { [envVarName: string]: string },
): ParsedEnv<T> => (
  _parseEnv(envOptions, null, processEnvVars ?? process.env) as ParsedEnv<T>
  )
