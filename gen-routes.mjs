import { Generator } from "@tanstack/router-generator";
import { getConfig } from "@tanstack/router-generator";

const config = getConfig({
  routesDirectory: "src/lovable-shell/routes",
  generatedRouteTree: "src/lovable-shell/routeTree.gen.ts",
  target: "react",
});
const gen = new Generator({ config, root: process.cwd() });
await gen.run();
console.log("routeTree generated");
