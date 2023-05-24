const path = require('path');
const fs = require('fs-extra');

const filesToCopy = [
  {
    source: 'node_modules/sql.js/dist/sql-wasm.wasm',
    destination: 'src/renderer/static/sql-wasm.wasm',
  },
  {
    source: 'node_modules/pdfjs-dist/build/pdf.worker.min.js',
    destination: 'src/renderer/static/pdf.worker.min.js',
  },
];

filesToCopy.forEach(({ source, destination }) => {
  const sourcePath = path.join(__dirname, source);
  const destPath = path.join(__dirname, destination);

  try {
    fs.copySync(sourcePath, destPath);
    console.log(`${source} copied to ${destination} successfully!`);
  } catch (err) {
    console.error(`Error copying ${source} to ${destination}:`, err);
  }
});
