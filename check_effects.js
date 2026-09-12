const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/**/*.tsx').concat(glob.sync('src/**/*.ts'));
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('useEffect(')) {
    console.log(`\n--- ${file} ---`);
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (line.includes('useEffect(')) {
         console.log(`${i+1}: ${line}`);
      }
    });
  }
});
