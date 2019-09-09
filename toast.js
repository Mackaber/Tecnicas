const cheerio = require('cheerio');
const fs = require('fs');

var contents = fs.readFileSync('cos.html', 'utf8');

$ = cheerio.load(contents)