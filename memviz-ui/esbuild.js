const fs = require("fs");
const path = require("path");

const esbuild = require("esbuild");
const vuePlugin = require("esbuild-plugin-vue3");

const production = process.argv.includes("--production");
const watch = process.argv.includes("--watch");

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
  name: "esbuild-problem-matcher",

  setup(build) {
    build.onStart(() => {
      console.log("[watch] build started");
    });
    build.onEnd((result) => {
      result.errors.forEach(({ text, location }) => {
        console.error(`✘ [ERROR] ${text}`);
        console.error(
          `    ${location.file}:${location.line}:${location.column}:`,
        );
      });
      console.log("[watch] build finished");
    });
  },
};

const OUTPUT_PATHS = ["dist/index.js", "dist/index.css"];

// Copy built bundle to the extension's dist directory
const copyFileToExtension = {
  name: "copy-file-to-extension",
  setup(build) {
    build.onEnd(async (result) => {
      if (result.errors.length === 0) {
        console.log("Copying output file to extension");
        await fs.promises.mkdir("../extension/dist", { recursive: true });
        for (const file of OUTPUT_PATHS) {
          await fs.promises.copyFile(
            file,
            `../extension/dist/${path.basename(file)}`,
          );
        }
      }
    });
  },
};

// Export LeaderLine constructor from the leader-line library
const exportLeaderLinePlugin = {
  name: "export-leader-line",
  setup(build) {
    build.onLoad({ filter: /leader-line/ }, async (args) => {
      let contents = await fs.promises.readFile(args.path, "utf8");
      contents += "export {LeaderLine};";
      return { contents };
    });
  },
};

async function main() {
  const ctx = await esbuild.context({
    entryPoints: ["src/index.ts"],
    bundle: true,
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: "browser",
    outdir: "dist",
    logLevel: "silent",
    plugins: [
      vuePlugin(),
      esbuildProblemMatcherPlugin,
      copyFileToExtension,
      exportLeaderLinePlugin,
    ],
  });

  if (watch) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
