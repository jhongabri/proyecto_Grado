const fs = require('fs');
const content = fs.readFileSync('c:/Users/jhon banda/Proyectos/plataformacdi/frontend/src/pages/DocenteDashboard.jsx', 'utf8');

let braces = 0;
let parens = 0;
let brackets = 0;
let jsxTags = 0;

const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '{') braces++;
    if (char === '}') braces--;
    if (char === '(') parens++;
    if (char === ')') parens--;
    if (char === '[') brackets++;
    if (char === ']') brackets--;
  }
  if (braces < 0 || parens < 0 || brackets < 0) {
    console.log(`Unbalanced at line ${i + 1}: braces=${braces}, parens=${parens}, brackets=${brackets}`);
    // Reset to continue searching
    if (braces < 0) braces = 0;
    if (parens < 0) parens = 0;
    if (brackets < 0) brackets = 0;
  }
}

console.log(`Final balance: braces=${braces}, parens=${parens}, brackets=${brackets}`);
