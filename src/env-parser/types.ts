/**
 * For creating types like:
 *
 * @example
 * enum Type { STRING, NUMBER }
 * type Map = {
 *   [Type.STRING]: { upperCase: string },
 *   [Type.NUMBER]: { isInteger: boolean },
 * }
 * type Field<T extends Type> = TypeDependantBaseIntersection<Type, Map, T, "dataType">
 * const field1: Field = {
 *   dataType: Type.STRING,
 *   upperCase: false
 * }
 */
export type TypeDependantBaseIntersection<
  TType extends string|number,
  TMap extends { [k in TType]: any },
  TSpecificEnumType extends string|number = TType,
  TTypePropertyName extends string = 'type',
> = {
  [K in TType]: { [k in TTypePropertyName]: K } & TMap[K]
}[TType] & { [k in TTypePropertyName]: TSpecificEnumType }

export enum EnvVarType {
  INT = 'int',
  FLOAT = 'float',
  STR = 'str',
  BOOL = 'bool',
  OBJ = 'obj',
  ARR = 'arr'
}

export type EnvVarTypeUnion = `${EnvVarType}`

export type EnvVarTypeToType = {
  [EnvVarType.INT]: number
  [EnvVarType.FLOAT]: number
  [EnvVarType.STR]: string
  [EnvVarType.BOOL]: boolean
  [EnvVarType.OBJ]: Object
  [EnvVarType.ARR]: any[]
}

export type EnvOptionParse = EnvVarTypeUnion | ((s: string) => any)

export type EnvOption = {
  /**
   * Optional name of the environment variable.
   *
   * If this is not defined, the node name and parent node names are used.
   *
   * @default undefined
   */
  $name?: string
  /**
   * Default value of the environment variable if it is not defined.
   */
  $default?: any
  /**
   * Optional function to parse the environment variable.
   *
   * If this is not defined, the environment variable is taken as-is, i.e. a string,
   *
   * @default 'str'
   */
  $parse?: EnvOptionParse
  /**
   * Optional function to validate the value of the environment variable.
   */
  $validate?: (v: any) => boolean
}

export type EnvOptions = EnvOption | {
  [k in string]: EnvOptions
}

export type ParsedEnv<T extends EnvOptions = EnvOptions> =
  // If the node contains no non-"$..." keys, then it's a leaf node...
  Exclude<keyof T, `$${string}`> extends never
    // If the node has a parse property...
    ? T extends { $parse: any }
      // And it is an env var type...
      ? T['$parse'] extends EnvVarTypeUnion
        // Then map env var type to type
        ? EnvVarTypeToType[T['$parse']]
        // Else if parse is a parser function...
        : T['$parse'] extends ((s: string) => any)
          // Then use return type of the parser function
          ? ReturnType<T['$parse']>
          // Else the node isn't valid!
          : never
      // Else if the node has a default
      : T extends { $default: any }
        // Then use the type of the default
        ? T['$default']
        // Else default to string
        : string
    // Else (node contains non-"$..." keys) parse the children
    : {
      [TPropName in Extract<Exclude<keyof T, `$${string}`>, string>]: ParsedEnv<T[TPropName]>
    }

export enum ErrorType {
  /**
   * Occurs when an environment variable value was not present and had no defined default.
   */
  MISSING_VALUE = 'missing_value',
  /**
   * Occurs when an environment variable's `$parse` function throws an exception.
   */
  PARSE_VALUE_EXCEPTION = 'parse_value_exception',
  /**
   * Occurs when an environment variable's `$validate` function returns false.
   */
  VALIDATE_VALUE_FAIL = 'validate_value_fail',
  /**
   * Occurs when an environment variable's `$validate` function throws an exception.
   */
  VALIDATE_VALUE_EXCEPTION = 'validate_value_exception',
}

export type ParseEnvError = {
  /**
   * The type of error, e.g. `ErrorType.MISSING_VALUE`, `ErrorType.PARSE_VALUE`, `ErrorType.VALIDATE_VALUE`, etc.
   */
  type: ErrorType
  /**
   * The name of the environment variable, e.g. `'NODE_ENV'`
   */
  envVarName: string
} & TypeDependantBaseIntersection<
  ErrorType,
  {
    [ErrorType.MISSING_VALUE]: {},
    [ErrorType.PARSE_VALUE_EXCEPTION]: {
      rawValue: string
      error: Error
    },
    [ErrorType.VALIDATE_VALUE_EXCEPTION]: {
      rawValue: string
      error: Error
    },
    [ErrorType.VALIDATE_VALUE_FAIL]: {
      rawValue: string
    },
  }
>

export type ParseEnvResult<T extends EnvOptions = EnvOptions> = {
  /**
   * The result of parsing the environment variables.
   */
  value: ParsedEnv<T>
  /**
   * Indicated whether any errors occured during parsing the environment variables.
   */
  hasErrors: boolean
  /**
   * The errors, if any, that occured during parsing the environment variables.
   */
  errors: ParseEnvError[]
}
