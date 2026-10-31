/* eslint-disable @typescript-eslint/no-require-imports -- Node's test runner loads this TSX component without a DOM. */
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const typescript = require("typescript");

require.extensions[".tsx"] = (module, fileName) => {
  const compiled = typescript.transpileModule(readFileSync(fileName, "utf8"), {
    compilerOptions: {
      jsx: typescript.JsxEmit.ReactJSX,
      module: typescript.ModuleKind.CommonJS,
      target: typescript.ScriptTarget.ES2022,
    },
  }).outputText;
  module._compile(compiled, fileName);
};
require.extensions[".css"] = (module) => {
  module.exports = {
    __esModule: true,
    default: new Proxy({}, { get: (_styles, key) => String(key) }),
  };
};

const { NotFoundContent } = require("../features/not-found/components/NotFoundContent.tsx");

test("renderiza contenido 404 semántico y el enlace de retorno indicado", () => {
  const html = renderToStaticMarkup(
    React.createElement(NotFoundContent, {
      homeHref: "/home",
      homeLabel: "Volver al home",
      matchesHref: "/partidos",
      matchesLabel: "Ver partidos",
      variant: "account",
    }),
  );

  assert.match(html, /<h1[^>]*>Página no encontrada<\/h1>/i);
  assert.match(html, /href="\/home"/);
  assert.match(html, /href="\/partidos"/);
  assert.match(html, /class="screen account"/);
});

test("ofrece destino público e incluye el wallpaper instalado", () => {
  const html = renderToStaticMarkup(
    React.createElement(NotFoundContent, {
      homeHref: "/",
      homeLabel: "Ir al inicio",
      matchesHref: "/competitions",
      matchesLabel: "Explorar competiciones",
      variant: "public",
    }),
  );
  const wallpaperPath = path.join(__dirname, "..", "public", "wallpapers", "404-wallpaper.png");

  assert.match(html, /href="\/"/);
  assert.match(html, /href="\/competitions"/);
  assert.match(html, /class="screen public"/);
  assert.equal(require("node:fs").existsSync(wallpaperPath), true);
});
