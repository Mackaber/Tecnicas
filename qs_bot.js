const cheerio = require('cheerio');
var request = require('request-promise');
var request = request.defaults({ jar: true })

parseUniversities = (file) => {
    // return list
    // Dummy
    return [{ name: "Stanford University", scopus_id: "60012708", scival_id: "Institution/508219" }]
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


updateCitesCountMetric = () => {
    console.log("cites metric")
    link = scival_url + "/benchmarking/metricOptions/updateMetricSelection"
    data = {
        ajax: true,
        metricOptionId: "yAxisBenchmarkMetric",
        metricOptionSessionId: "",
        metricOptionKey: "benchmarkingDefault",
        selectedOptions: JSON.stringify(metric("citationCount", "Citation+Count"))
    }
    return request.post({ url: link, jar: jar, form: data })
}

getCitesCount = () => {
    link = scival_url + "/benchmarking/analyse/analysePerformanceData"
    requests = []
    university_list.forEach((university) => {
        data = {
            analyseParams: JSON.stringify(analyseParams(university.scival_id))
        }

        requests.push(
            request.post({ url: link, jar: jar, form: data })
            .then((body) => {
                universities[university.name]["cites_count"] = {}
                JSON.parse(body).chartItems[0].yAxis.values.forEach((row) => {
                    universities[university.name]["cites_count"][row.criterion] = row.value
                })
            })
        )
    })
    return requests
}

updateCitesPublicationMetric = () => {
    console.log("publication metric")
    link = scival_url + "/benchmarking/metricOptions/updateMetricSelection"
    data = {
        ajax: true,
        metricOptionId: "yAxisBenchmarkMetric",
        metricOptionSessionId: "",
        metricOptionKey: "benchmarkingDefault",
        selectedOptions: JSON.stringify(metric("citesPerPub", "Citations+per+Publication"))
    }
    return request.post({ url: link, jar: jar, form: data })
}

getCitesPublication = () => {
    link = scival_url + "/benchmarking/analyse/analysePerformanceData"
    requests = []

    university_list.forEach((university) => {
        data = {
            analyseParams: JSON.stringify(analyseParams(university.scival_id))
        }

        requests.push(
            request.post({ url: link, jar: jar, form: data })
            .then((body) => {
                universities[university.name]["cites_publication"] = {}
                JSON.parse(body).chartItems[0].yAxis.values.forEach((row) => {
                    universities[university.name]["cites_publication"][row.criterion] = row.value
                })
            })
        )
    })
    return requests
}

// Initialization Stuff
universities = {}
university_list = parseUniversities("universities.csv")
years = ["2019", "2018", "2017", "2016", "2015", "2014"]

const jar = request.jar();

//const scival_url = "https://www.scival.com"
const scival_url = "https://0-www-scival-com.millenium.itesm.mx"
const scival_cookies = [
    request.cookie('JSESSIONID=A2118155E49557AAAFCC6AFC97383957.mcKQsAwrVg1SzotO7VlpSA'),
    request.cookie('_pendo_accountId.7947f9ed-a4c7-4d3b-4528-31020bb4986f=60245'), // this one doesn't change
    request.cookie('AWSALB=eSMjsDjuIqEfQ1VWfAN4xuFdp3TpuihlILg2R7OcR9P9HH83mlMl4TlQpmXFO0EFP0h8W/2ZiOkuKxFNFFsU6yrRahARcGnG5MGvYbQ5kAAOGbLtRiQ1J15M29Oy'),
    request.cookie('IIIV3395912885="#BEGMD5#500953ea9d7d90d72d743d9a6567d472#ENDMD5#4-mtyr|616503|45|45|0|0"'), // (no change) This one is only necessary when accessing though millenium
];

scival_cookies.forEach((cookie) => {
    jar.setCookie(cookie, scival_url)
});

university_list.forEach(
    (u) => universities[u.name] = {}
)

updateCitesCountMetric()
    .then(() => Promise.all(getCitesCount()))
    .then(() => updateCitesPublicationMetric())
    .then(() => Promise.all(getCitesPublication()))
    .then(() => update)
    ////.then(() => Promise.all([getPublications(), getAccessType(), getSponsor()]))
    .then(() => {
        console.log(universities);
    })
    .catch((err) => {
        console.log(err);
    })