const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all files with window.addEventListener
const output = execSync('git grep -l window.addEventListener', { encoding: 'utf8' });
const files = output.trim().split('\n').filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));

const basePath = 'c:/Transcriver-v-10';

files.forEach(file => {
  const fullPath = path.join(basePath, file);
  if (!fs.existsSync(fullPath)) return;
  
  let content = fs.readFileSync(fullPath, 'utf8');
  const original = content;

  // Let's manually review these later or skip the complex ones, 
  // but for simple ones, we can just remove the window.addEventListener
  // and inject useAppStore hooks. Actually, this is too complex for simple regex.
  // I will just replace the exact line of addEventListener and removeEventListener with nothing,
  // and map the corresponding hook to the useEffect dependency array.
});
