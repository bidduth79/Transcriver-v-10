const fs = require('fs');
const glob = require('glob');

const files = glob.sync('**/*.tsx', { ignore: 'node_modules/**' }).concat(glob.sync('**/*.ts', { ignore: 'node_modules/**' }));
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('useEffect(') || content.includes('useEffect (')) {
    console.log(`\n--- ${file} ---`);
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (line.includes('useEffect(') || line.includes('useEffect (')) {
         console.log(`${i+1}: ${line}`);
      }
    });
  }
});
