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
