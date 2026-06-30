export type TokenCategory =
  | "keyword"
  | "type"
  | "ident"
  | "number"
  | "string"
  | "char"
  | "operator"
  | "punct"
  | "comment"
  | "boolean"
  | "null"
  | "builtin"
  | "error"

export interface Token {
  /** Uppercase token type, e.g. VAR, IDENTIFIER, INTEGER */
  type: string
  lexeme: string
  line: number
  column: number
  /** Broad category used for syntax highlighting */
  category: TokenCategory
}

export interface OptimizationFlags {
  constantFolding: boolean
  cascada: boolean
  sethiUllman: boolean
  peephole: boolean
}

export interface OptimizationDetail {
  key: keyof OptimizationFlags
  title: string
  description: string
  applied: boolean
  notes: string[]
}

export interface AstNode {
  label: string
  kind: string
  children?: AstNode[]
}

export interface CompileResult {
  success: boolean
  tokens: Token[]
  parseStatus: string
  parseSuccess: boolean
  optimizations: OptimizationFlags
  optimizationDetails: OptimizationDetail[]
  assembly: string
  optimizedAssembly: string
  ast: AstNode | null
  errors: string[]
  scannerStatus: string
  scannerSuccess: boolean
  stats: {
    tokenCount: number
    lineCount: number
    functionCount: number
  }
}
