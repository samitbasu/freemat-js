const p = require('./freemat.js');
const top = process.argv[2].replace(/\\n/g,'\n');
console.log(`parse string ${top}`);
const y = p.parse(top);
console.log(JSON.stringify(y, null, 2));
