import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";

/** Testiramo stvarne TS module i njihove akcije, uz zamene samo na spoljnim granicama. */
export function loadTypeScript(entry, mocks = {}) {
  const cache = new Map();
  const root = path.resolve(import.meta.dirname, "..");
  function load(file) {
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} };
    cache.set(file, module);
    const source = fs.readFileSync(file, "utf8");
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
      fileName: file,
    });
    const nativeRequire = createRequire(file);
    const localRequire = (specifier) => {
      if (Object.hasOwn(mocks, specifier)) return mocks[specifier];
      if (specifier.startsWith("@/")) return load(path.join(root, `${specifier.slice(2)}.ts`));
      if (specifier.startsWith(".")) return load(path.resolve(path.dirname(file), `${specifier}.ts`));
      return nativeRequire(specifier);
    };
    const wrapper = vm.runInThisContext(`(function(require, module, exports) { ${outputText}\n})`, { filename: file });
    wrapper(localRequire, module, module.exports);
    return module.exports;
  }
  return load(path.resolve(root, entry));
}
