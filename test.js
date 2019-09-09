const cheerio = require('cheerio');
var request = require('request-promise');
var request = request.defaults({ jar: true })

request("https://google.com").then(() => {
    console.log("External 1 done");
    return Promise.all([request("https://google.com").then(() => console.log("Internal 1 done"))])
}).then(() => {
    console.log("External 2 done");
    return Promise.all([request("https://google.com").then(() => console.log("Internal 2 done"))])
})