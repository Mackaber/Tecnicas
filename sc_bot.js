const cheerio = require('cheerio');
const fs = require('fs')
var request = require('request-promise');
var request = request.defaults({ jar: true })

parseUniversities = (file) => {

    const results = [];
    lines = fs.readFileSync(file, "utf8").split("\n")
    lines.shift()
    lines.forEach((line) => {
        entry = line.split(",");
        results.push({ name: entry[0], scopus_id: entry[1], scival_id: entry[3] })
    });

    // Dummy
    //return [{ name: "Stanford University", scopus_id: "60012708", scival_id: "Institution/508219" }]
    return results
}

sum = (arr) => {
    var total = 0
    for (var i = 1; i < arr.length; i++) {
        total += parseInt(arr[i].children[0].data)
    }
    return total
}

metric = (name, label) => {
    return {
        "id": "yAxisBenchmarkMetric",
        "key": "benchmarkingDefault",
        "name": name,
        "value": name,
        "label": label,
        "snowball": "true",
        "decimals": "0",
        "percentage": "false",
        "nullable": "false",
        "description": "",
        "suboptions": [{
                "key": "benchmarkingDefault",
                "name": "selfCitationOnly",
                "value": "true",
                "label": "Include self-citations",
                "type": "checkbox",
                "decimals": 0,
                "percentage": "false"
            },
            {
                "key": "benchmarkingDefault",
                "name": "DocType",
                "value": "all",
                "label": "All publication types",
                "type": "radio",
                "decimals": 0,
                "percentage": "false"
            }
        ]
    }
}

analyseParams = (id) => {
    return {
        "entityURI": id,
        "sortColumn": 0,
        "sortDirection": "asc",
        "startYear": 2014,
        "endYear": 2019,
        "xAxisOptionsId": "xAxisBenchmarkMetric",
        "xAxisOptionsKey": "benchmarkingDefault",
        "yAxisOptionsId": "yAxisBenchmarkMetric",
        "yAxisOptionsKey": "benchmarkingDefault",
        "zAxisOptionsId": null,
        "zAxisOptionsKey": null
    }
}


updateMetric = (name, label) => {
    link = scival_url + "/benchmarking/metricOptions/updateMetricSelection"
    data = {
        ajax: true,
        metricOptionId: "yAxisBenchmarkMetric",
        metricOptionSessionId: "",
        metricOptionKey: "benchmarkingDefault",
        selectedOptions: JSON.stringify(metric(name, label))
    }
    return request.post({ url: link, jar: jar, form: data })
}

getSciValValues = (field) => {
    link = scival_url + "/benchmarking/analyse/analysePerformanceData"
    requests = []
    university_list.forEach((university) => {
        data = {
            analyseParams: JSON.stringify(analyseParams(university.scival_id))
        }

        requests.push(
            request.post({ url: link, jar: jar, form: data })
            .then((body) => {
                universities[university.name][field] = {}
                JSON.parse(body).chartItems[0].yAxis.values.forEach((row) => {
                    universities[university.name][field][row.criterion] = row.value
                })
            })
        )
    })
    return requests
}

getSciValInternalValues = () => {
    link = scival_url + "/search"
    requests = []

    university_list.forEach((university) => {
        fields = ["authors_count", "authors_total", "countries_count", "countries_total", "articles_count", "conf_count", "field_count", "field_total"]
        fields.forEach((field) => {
            universities[university.name][field] = {}
        })
        years.forEach((year) => {
            data = {
                ajax: true,
                uri: university.scival_id,
                miscfilter: "bmy",
                startyear: year,
                endyear: year,
                searchtype: "",
                subjectfilter: true,
                fieldnormalized: false
            }

            requests.push(
                request.post({ url: link, jar: jar, form: data })
                .then((body) => {
                    $ = cheerio.load(body)

                    // Authors
                    nodes = $("#facetItem_authorIds").find(".facetPerc")
                    universities[university.name]["authors_count"][year] = nodes.length
                    universities[university.name]["authors_total"][year] = sum(nodes)

                    // Collaborating Country
                    nodes = $("#facetItem_countryCode").find(".facetPerc")
                    universities[university.name]["countries_count"][year] = nodes.length
                    universities[university.name]["countries_total"][year] = sum(nodes)

                    // Document Type
                    nodes = $("#facetItem_docType").find(".facetPerc")
                    universities[university.name]["articles_count"][year] = parseInt(nodes[1].children[0].data)
                    universities[university.name]["conf_count"][year] = parseInt(nodes[2].children[0].data)

                    // Field
                    nodes = $("#facetItem_mainAsjcCode").find(".facetPerc")
                    universities[university.name]["field_count"][year] = nodes.length
                    universities[university.name]["field_total"][year] = sum(nodes)
                })
            )
        })
    })
    return requests
}

getScopusValues = () => {
    requests = []
    university_list.forEach((university) => {
        fields = ["access_open_count", "access_closed_count", "sponsor_count", "sponsor_total"]
        fields.forEach((field) => {
            universities[university.name][field] = {}
        })
        years.forEach((year) => {
            link = scopus_url + "/results/results.uri?sort=plf-f&src=s&st1=&st2=&nlo=1&nlr=20&nls=afcnt-f&sot=afnl&sdt=afsp&sl=40&cluster=scopubyr%2c" + year + "%2ct&s=%28AF-ID%28" + university.scopus_id + "%29+%29&origin=AffiliationNamesList&"

            requests.push(
                request({ url: link, jar: jar })
                .then((body) => {
                    $ = cheerio.load(body)

                    // AccessType
                    nodes = $("#clusterAttribute_openaccess").find(".dropdownGroup").find(".btnText")
                    universities[university.name]["access_open_count"][year] = parseInt(nodes[0].children[0].data.replace(/,/g, ""))
                    universities[university.name]["access_closed_count"][year] = parseInt(nodes[1].children[0].data.replace(/,/g, ""))

                    // Sponsor
                    nodes = $("#clusterAttribute_FUND-SPONSOR").find(".dropdownGroup").find(".btnText")
                    universities[university.name]["sponsor_count"][year] = nodes.length
                    universities[university.name]["sponsor_total"][year] = sum(nodes)
                })
            )
        })
    })

    return requests
}

// Initialization Stuff
universities = {}
university_list = parseUniversities("block_1.csv")
years = ["2019", "2018", "2017", "2016", "2015", "2014"]

const jar = request.jar();

//const scival_url = "https://www.scival.com"
const scival_url = "https://0-www-scival-com.millenium.itesm.mx"
const scopus_url = "https://0-www-scopus-com.millenium.itesm.mx"
const scival_cookies = [
    request.cookie('JSESSIONID=13B5FF428C3A529C709B467262F7867C.mcKQsAwrVg1SzotO7VlpSA'),
    request.cookie('_pendo_accountId.7947f9ed-a4c7-4d3b-4528-31020bb4986f=60245'), // this one doesn't change
    request.cookie('AWSALB=MJKvmm91SMVSO1D3hUmZr3x+X1y/6bSwBUiQOyCvZlUrztGF6lYjuGg4LLDPrY2Dvkap5Bg6nkHDaClOVqUV73E+cDdj/ToXMO5Rjc0blHbNR/7AwdhDo9jQyl47'),
    request.cookie('IIIV3395912885="#BEGMD5#500953ea9d7d90d72d743d9a6567d472#ENDMD5#4-mtyr|616503|45|45|0|0"'), // (no change) This one is only necessary when accessing though millenium
];

scival_cookies.forEach((cookie) => {
    jar.setCookie(cookie, scival_url)
});

const scopus_cookies = [
    request.cookie('AUTH_TOKEN_COOKIE=53476e4a4868744a326a383d'),
    request.cookie('SCSessionID=6BA12E9B5FF4A2EBBDF2F7ED26862DB4.wsnAw8kcdt7IPYLO0V48gA'),
    request.cookie('scopusSessionUUID=2df1e622-ef68-4644-9'),
    request.cookie('AWSELB=CB9317D502BF07938DE10C841E762B7A33C19AADB16584E315808EC23F251EF9F95A63B032A1A0E35F22536CF1709FE0D66C340EBAA31AAC5A6BDE3E4B4DACF34F3854CEEB03950EAB4AAC55A933BE79DEA87CE9B1'),
    request.cookie('IIIV3395912885="#BEGMD5#500953ea9d7d90d72d743d9a6567d472#ENDMD5#4-mtyr|616503|45|45|0|0"'),
]

scopus_cookies.forEach((cookie) => {
    jar.setCookie(cookie, scopus_url)
});

university_list.forEach(
    (u) => universities[u.name] = {}
)

//Main loop
updateMetric("citationCount", "Citation Count")
    .then(() => Promise.all(getSciValValues("cites_count")))
    .then(() => updateMetric("citesPerPub", "Citations per Publication"))
    .then(() => Promise.all(getSciValValues("cites_publication")))
    .then(() => updateMetric("scholarlyOutput", "Scholarly Output"))
    .then(() => Promise.all(
        getSciValValues("publications")
        .concat(getSciValInternalValues())
        .concat(getScopusValues())))
    .then(() => {
        console.log(universities);
    })
    .catch((err) => {
        console.log(universities);
        console.log(err);
    })