const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');
content = content.replace(/className=\{cn\(\n            "min-w-max",/g, 'className={cn(');
fs.writeFileSync('src/App.tsx', content);
