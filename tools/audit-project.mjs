import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

// Follow static and lazy imports using the same aliases as the compiler.
const root = process.cwd();
const config = ts.readConfigFile(path.join(root, 'tsconfig.json'), ts.sys.readFile);
const options = ts.parseJsonConfigFileContent(config.config, ts.sys, root).options;
const skip = new Set(['node_modules', 'vendor', '.git', 'graphify-out', 'dist']);
function files(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (skip.has(entry.name)) return [];
    return entry.isDirectory() ? files(file) : /\.[cm]?[jt]sx?$/.test(file) ? [file] : [];
  });
}
const candidates = files(path.join(root, 'frontend'));
const tests = files(path.join(root, 'tests')).filter((file) => /\.test\.ts$/.test(file));
const roots = [path.join(root, 'frontend/main.tsx'), ...tests,
  ...['vite.config.ts', 'vitest.config.ts', 'eslint.config.mjs'].map((file) => path.join(root, file))];
const reached = new Set();
const dependencies = new Map();
const edges = [];
const unresolved = [];
function visit(file) {
  file = path.resolve(file);
  if (reached.has(file) || !fs.existsSync(file) || file.includes(`${path.sep}node_modules${path.sep}`)) return;
  reached.add(file);
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  function walk(node) {
    let specifier;
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      specifier = node.moduleSpecifier.text;
    } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) {
      specifier = node.arguments[0].text;
    }
    if (specifier) {
      const resolved = ts.resolveModuleName(specifier, file, options, ts.sys).resolvedModule;
      if (resolved && !resolved.isExternalLibraryImport) {
        edges.push({ from: path.relative(root, file), to: path.relative(root, resolved.resolvedFileName) });
        visit(resolved.resolvedFileName);
      } else if (specifier.startsWith('.') || specifier.startsWith('@/')) {
        const candidate = specifier.startsWith('@/') ? path.join(root, 'frontend', specifier.slice(2)) : path.resolve(path.dirname(file), specifier);
        if (!fs.existsSync(candidate)) unresolved.push({ from: path.relative(root, file), specifier });
      } else if (!specifier.startsWith('node:')) {
        const pkg = specifier.startsWith('@') ? specifier.split('/').slice(0, 2).join('/') : specifier.split('/')[0];
        dependencies.set(pkg, (dependencies.get(pkg) || 0) + 1);
      }
    }
    ts.forEachChild(node, walk);
  }
  walk(source);
}
roots.forEach(visit);
const relative = (file) => path.relative(root, file).replaceAll(path.sep, '/');
const unused = candidates.filter((file) => !reached.has(file)).map(relative).sort();
const assetText = [...candidates, path.join(root, 'frontend/globals.css'), path.join(root, 'index.html')]
  .map((file) => fs.readFileSync(file, 'utf8')).join('\n');
const referencedAssets = [...new Set(assetText.match(/\/(?:auth|brand|fonts|tracking-cities)\/[a-zA-Z0-9._-]+\.(?:png|webp|woff2)/g) || [])].sort();
const missingAssets = referencedAssets.filter((asset) => !fs.existsSync(path.join(root, 'public', asset.slice(1))));
function publicAssets(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? publicAssets(file) : [file];
  });
}
const unusedPublicAssets = publicAssets(path.join(root, 'public')).map((file) => '/'+path.relative(path.join(root, 'public'), file).replaceAll(path.sep, '/'))
  .filter((asset) => !referencedAssets.includes(asset));
const scaffoldPaths = ['components', 'lib', 'backend/package.json', 'backend/vite.config.js', 'backend/resources/js', 'backend/resources/css'];
const unexpectedScaffolding = scaffoldPaths.filter((file) => fs.existsSync(path.join(root, file)));
const report = {
  entrypoints: roots.map(relative), sourceFiles: candidates.length,
  reachableSourceFiles: candidates.length - unused.length,
  unusedSourceFiles: unused, unresolvedLocalImports: unresolved, referencedAssets, missingAssets, unusedPublicAssets,
  unexpectedScaffolding, importedPackages: Object.fromEntries(dependencies), edges,
  caveat: 'Static source reachability includes tests and lazy imports. Laravel conventions, SQL, assets, CLI scripts and documentation require separate review.',
};
fs.mkdirSync('output/audit', { recursive: true });
fs.writeFileSync('output/audit/source-usage.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify({ sourceFiles: report.sourceFiles, reachable: report.reachableSourceFiles, unused, unresolved, missingAssets, unusedPublicAssets, unexpectedScaffolding }));
if (process.argv.includes('--check') && (unused.length || unresolved.length || missingAssets.length || unusedPublicAssets.length || unexpectedScaffolding.length)) process.exitCode = 1;
