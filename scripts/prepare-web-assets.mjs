import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(
  projectRoot,
  'node_modules',
  '@expo',
  'vector-icons',
  'build',
  'vendor',
  'react-native-vector-icons',
  'Fonts',
  'Ionicons.ttf',
);
const destinationDirectory = path.join(projectRoot, 'public', 'fonts');
const destination = path.join(destinationDirectory, 'Ionicons.ttf');

if (!existsSync(source)) {
  throw new Error(`Ionicons font was not found at ${source}. Run npm install before building the web dashboard.`);
}

mkdirSync(destinationDirectory, { recursive: true });
copyFileSync(source, destination);

const copiedBytes = statSync(destination).size;
if (copiedBytes === 0) {
  throw new Error(`Ionicons font copy is empty at ${destination}.`);
}

console.log(`Prepared public web font: /fonts/Ionicons.ttf (${copiedBytes} bytes)`);
