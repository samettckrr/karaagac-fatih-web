const fs = require('fs');
const html = fs.readFileSync('personel/pdf-performans/personelperformans.html', 'utf8');
const start = html.indexOf('<script>', html.indexOf('html2pdf'));
const end = html.indexOf('</script>', start);
const script = html.slice(start + 8, end);
fs.writeFileSync('personel/pdf-performans/_script_check.js', script);
const tryStart = script.indexOf('try {');
const catchPos = script.indexOf('} catch');
if (tryStart === -1 || catchPos === -1) {
  console.log('try/catch not found');
  process.exit(1);
}
let depth = 0;
let inTemplate = false;
let templateDepth = 0;
let inString = false;
let stringChar = '';
let pos = tryStart + 5;
depth = 1;
const lineStarts = [0];
for (let i = 0; i < script.length; i++) {
  if (script[i] === '\n') lineStarts.push(i + 1);
}
function getLine(p) {
  for (let i = 0; i < lineStarts.length; i++) {
    if (lineStarts[i] > p) return i;
  }
  return lineStarts.length;
}
while (pos < catchPos && pos < script.length) {
  const c = script[pos];
  if (inTemplate) {
    if (c === '`') { inTemplate = false; pos++; continue; }
    if (c === '$' && script[pos + 1] === '{') { templateDepth++; pos += 2; continue; }
    if (c === '}' && templateDepth > 0) { templateDepth--; pos++; continue; }
    pos++;
    continue;
  }
  if ((c === '"' || c === "'") && !inString) {
    inString = true;
    stringChar = c;
    pos++;
    continue;
  }
  if (inString) {
    if (c === '\\') { pos += 2; continue; }
    if (c === stringChar) { inString = false; pos++; continue; }
    pos++;
    continue;
  }
  if (c === '`') { inTemplate = true; templateDepth = 0; pos++; continue; }
  if (c === '{') { depth++; }
  if (c === '}') {
    depth--;
    if (depth === 0) {
      console.log('Depth 0 at position', pos, 'line', getLine(pos));
      console.log('Context:', script.slice(pos - 80, pos + 20));
    }
  }
  pos++;
}
console.log('At catch, depth =', depth);
