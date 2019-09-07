const cheerio = require('cheerio');
var request = require('request-promise');
var request = request.defaults({jar: true})

parseUniversities = (file) => {
    // return list
    // Dummy
    return [{name: "Stanford University", scopus_id: "60012708", scival_id: "Institution/508219"}]
}

getArticles = (university,universities) => {
    id = university.scopus_id
    link = scival_url + "/benchmarking/analyse/analysePerformanceData"

    data = {
        analyseParams: JSON.stringify({
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
        })
    } 

    return request.post({url: link, jar: jar, form: data})
            .then((body) => {
                universities[university.name]["articles"] = {}
                JSON.parse(body).chartItems[0].yAxis.values.forEach((row) => {
                universities[university.name]["articles"][row.criterion] = row.value
            })
        }
    )

}

getAffiliation = (university,universities) => {
    updateMetric("scholarlyOutput")

    id = university.scopus_id
    link = scival_url + "/benchmarking/analyse/analysePerformanceData"

    data = {
        analyseParams: JSON.stringify({
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
        })
    } 

    return request.post({url: link, jar: jar, form: data})
            .then((body) => {
                universities[university.name]["collaboration"] = {}
                JSON.parse(body).chartItems[0].yAxis.values.forEach((row) => {
                universities[university.name]["collaboration"][row.criterion] = row.value
            })
        }
    )

}











// Initialization Stuff
universities = {}
university_list = parseUniversities("universities.csv")
years = ["2019", "2018", "2017", "2016", "2015","2014"]

const jar = request.jar();

const scival_url = "https://www.scival.com"
//const scival_url = "https://0-www-scival-com.millenium.itesm.mx"
const scival_cookies = [
    request.cookie('JSESSIONID=C2F281A453D6BA9A7F1ED276A04AB433.mcKQsAwrVg1SzotO7VlpSA'), 
    request.cookie('_pendo_accountId.7947f9ed-a4c7-4d3b-4528-31020bb4986f=60245'), // this one doesn't change
    request.cookie('AWSALB=UlSs/j7yOIvesG9RbunPeV65qsTqHn4oE9JnQADathW0s8MkrWx2/+yuKlU2hYxbgbKx/4tB5ENkZL7UluLxJ0zNBicqKB6aqxuZXm6QjCTYCtVFs65hD365Ql/w'),
    //request.cookie('IIIV3395912885="#BEGMD5#500953ea9d7d90d72d743d9a6567d472#ENDMD5#4-mtyr|616503|45|45|0|0"'), // This one is only necessary when accessing though millenium
];

scival_cookies.forEach((cookie)=> {
    jar.setCookie(cookie,scival_url)
});

// Begin getting thingies...
promises = []
university_list.forEach(university => {
    universities[university.name] = {}

    // Things in SCIVAL 
    promises.push(getArticles(university,universities))
    //promises.push(getAffiliation(university,universities))
    //getArtsPerAuthor(university,universities)
    //getCollabCountry(university,universities)
    //getDocType(university,universities)
    //getArea(university,universities)
    //getCites(university,universities)

    //// Things in SCOPUS
    //getAccessType(university,universities)
    //getSponsor(university,universities)
});

Promise.all(promises).then(() => { 
    console.log(universities);
}).catch((err)=> {
    console.log(err);
});