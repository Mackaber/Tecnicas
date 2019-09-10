const cheerio = require('cheerio');
const fs = require('fs');
var request = require('request-promise');
var request = request.defaults({ jar: true })

universities = {}
requests = []
university_list = fs.readFileSync("universities.txt", "utf8").split("\n")

const jar = request.jar();

const scival_url = "https://0-www-scival-com.millenium.itesm.mx"
const scopus_url = "https://0-www-scopus-com.millenium.itesm.mx"
const scival_cookies = [
    request.cookie('JSESSIONID=A2118155E49557AAAFCC6AFC97383957.mcKQsAwrVg1SzotO7VlpSA'),
    request.cookie('_pendo_accountId.7947f9ed-a4c7-4d3b-4528-31020bb4986f=60245'), // this one doesn't change
    request.cookie('AWSALB=DjH9hekjqkL6oydPPMn6KPQJqqVU64yd33lbYgY/Xf2+iXM11Zzv6bTd1arbqOAYSRvxbfKXeK7Say+FkWNdw+OqKSX/Y3RpTestUEkqm00QHD6G2r6mt97Z6sk7'),
    request.cookie('IIIV3395912885="#BEGMD5#500953ea9d7d90d72d743d9a6567d472#ENDMD5#4-mtyr|616503|45|45|0|0"'), // (no change) This one is only necessary when accessing though millenium
];

scival_cookies.forEach((cookie) => {
    jar.setCookie(cookie, scival_url)
});

const scopus_cookies = [
    request.cookie('AUTH_TOKEN_COOKIE=53476e4a4868744a326a383d'),
    request.cookie('SCSessionID=12ED7CFAF1AF91E57AEDDFB31ED77FEF.wsnAw8kcdt7IPYLO0V48gA'),
    request.cookie('scopusSessionUUID=2f391d6c-e02a-4316-a'),
    request.cookie('AWSELB=CB9317D502BF07938DE10C841E762B7A33C19AADB1283185EF88BE05F9193128AC7A7354A91FEC8AD6043491F4E1DD0D3A2D8FAC6610BA32070D9964CEACBAE7C5777723B74F47F6AC02F92DBAD46D60E57EA16239'),
    request.cookie('IIIV3395912885="#BEGMD5#500953ea9d7d90d72d743d9a6567d472#ENDMD5#4-mtyr|616503|45|45|0|0"'),
]

scopus_cookies.forEach((cookie) => {
    jar.setCookie(cookie, scopus_url)
});

university_list.forEach(university => {

    universities[university] = {}

    link = "https://0-www-scopus-com.millenium.itesm.mx/results/affiliationResults.uri?origin=SearchAffiliationLookup&affilName=" + encodeURI(university)
    requests.push(
        request({ url: link, jar: jar }).then((body) => {
            $ = cheerio.load(body)
            scopus_node = $(".docTitle")[0].children[1]
            universities[university]["scopus_id"] = scopus_node.attribs.href.substring(29, 100).replace(/&.*/, "")
            universities[university]["scopus_name"] = scopus_node.children[0].data.replace(/\n/g, "")
        }).catch((err) => {
            universities[university]["scopus_id"] = ""
            universities[university]["scopus_name"] = ""
        })
    )

    link = "https://0-www-scival-com.millenium.itesm.mx/find/institution"
    data = {
        ajax: true,
        term: university,
        maxTerms: 1
    }
    requests.push(
        request.post({ url: link, jar: jar, form: data }).then((body) => {
            result = JSON.parse(body)
            universities[university]["scival_id"] = result[0].uri
            universities[university]["scival_name"] = result[0].name
        }).catch(() => {
            universities[university]["scival_id"] = ""
            universities[university]["scival_name"] = ""
        })
    )
});

Promise.all(requests).then(() => {
        file = "qs_name,scopus_id,scopus_name,scival_id,scival_name\n";

        university_list.forEach((u) => {
            file += (`${u},${universities[u]["scopus_id"]},${universities[u]["scopus_name"]},${universities[u]["scival_id"]},${universities[u]["scival_name"]}\n`)
        });
        console.log(file)
    })
    .catch((err) => {
        console.log(err);
    })