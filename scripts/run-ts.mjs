import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import Module from "node:module"
import { resolve } from "node:path"

const require = createRequire(import.meta.url)
const ts = require("typescript")

// Hook into Node module resolution to support @/ path alias (maps to src/)
const originalResolveFilename = Module._resolveFilename
Module._resolveFilename = function patchedResolve(request, parent, isMain, options) {
  if (typeof request === "string" && request.startsWith("@/")) {
    const resolved = resolve(process.cwd(), "src", request.slice(2))
    return originalResolveFilename.call(this, resolved, parent, isMain, options)
  }
  return originalResolveFilename.call(this, request, parent, isMain, options)
}

require.extensions[".ts"] = function compileTs(module, filename) {
  const source = readFileSync(filename, "utf8")
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: filename,
  })
  module._compile(outputText, filename)
}

const [, , script, ...args] = process.argv

if (!script) {
  console.error("Usage: pnpm tsx <script.ts> [...args]")
  process.exit(1)
}

const scriptPath = resolve(script)
process.argv = [process.argv[0], scriptPath, ...args]
require(scriptPath)
