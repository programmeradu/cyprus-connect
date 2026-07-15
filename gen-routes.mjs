import { Generator } from '@tanstack/router-generator';
import path from 'node:path';
const gen = new Generator({
  config: {
    routesDirectory: path.resolve('src/lovable-shell/routes'),
    generatedRouteTree: path.resolve('src/lovable-shell/routeTree.gen.ts'),
    routeFileIgnorePrefix: '-',
    quoteStyle: 'double',
    semicolons: true,
    target: 'react',
  },
  root: process.cwd(),
});
await gen.run();
console.log('generated');
