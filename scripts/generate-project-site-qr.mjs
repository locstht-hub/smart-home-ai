import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import { toQR } from 'toqr';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assetDirectory = path.join(root, 'project-site', 'assets');
const dashboardUrl = 'https://dashboard.smarthomeai.id.vn/';

function setPixel(image, x, y, color) {
  const offset = (image.width * y + x) << 2;
  image.data[offset] = color[0];
  image.data[offset + 1] = color[1];
  image.data[offset + 2] = color[2];
  image.data[offset + 3] = 255;
}

function createDashboardQr() {
  const modules = toQR(dashboardUrl, 2);
  const matrixSize = Math.sqrt(modules.length);
  const moduleSize = 8;
  const qrPixSize = matrixSize * moduleSize;
  const targetSize = 382;
  const quietZoneX = Math.floor((targetSize - qrPixSize) / 2);
  const quietZoneY = Math.floor((targetSize - qrPixSize) / 2);
  const image = new PNG({ width: targetSize, height: targetSize });
  const white = [255, 255, 255];
  const ink = [7, 17, 15];

  for (let y = 0; y < targetSize; y += 1) {
    for (let x = 0; x < targetSize; x += 1) {
      setPixel(image, x, y, white);
    }
  }

  for (let row = 0; row < matrixSize; row += 1) {
    for (let column = 0; column < matrixSize; column += 1) {
      if (!modules[row * matrixSize + column]) continue;
      const startX = quietZoneX + column * moduleSize;
      const startY = quietZoneY + row * moduleSize;
      for (let y = startY; y < startY + moduleSize; y += 1) {
        for (let x = startX; x < startX + moduleSize; x += 1) {
          setPixel(image, x, y, ink);
        }
      }
    }
  }

  fs.writeFileSync(path.join(assetDirectory, 'web-dashboard-qr.png'), PNG.sync.write(image));
}

function extractExistingAppQr() {
  const posterPath = path.join(root, 'outputs', 'Smart_Home_App_QR_Poster.png');
  if (!fs.existsSync(posterPath)) {
    throw new Error(`Existing app QR poster was not found: ${posterPath}`);
  }

  const poster = PNG.sync.read(fs.readFileSync(posterPath));
  const sourceX = Math.floor((poster.width - 350) / 2);
  const sourceY = Math.floor(poster.height * 0.58);
  const quietZone = 16;
  const output = new PNG({ width: 382, height: 382 });
  output.data.fill(255);
  PNG.bitblt(poster, output, sourceX, sourceY, 350, 350, quietZone, quietZone);
  fs.writeFileSync(path.join(assetDirectory, 'app-download-qr.png'), PNG.sync.write(output));
}

fs.mkdirSync(assetDirectory, { recursive: true });
extractExistingAppQr();
createDashboardQr();
console.log(`Generated project QR assets for ${dashboardUrl}`);
