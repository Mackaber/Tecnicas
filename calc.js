    json = [{
            'Stanford University': {
                articles: {
                    '2014': 289,
                    '2015': 297,
                    '2016': 411,
                    '2017': 524,
                    '2018': 572,
                    '2019': 429,
                },
                collaboration: {
                    '2014': 289,
                    '2015': 297,
                    '2016': 411,
                    '2017': 524,
                    '2018': 572,
                    '2019': 429
                }
            }
        },
        {
            'Stanford University 2': {
                articles: {
                    '2014': 289,
                    '2015': 297,
                    '2016': 411,
                    '2017': 524,
                    '2018': 572,
                    '2019': 429
                },
                collaboration: {
                    '2014': 289,
                    '2015': 297,
                    '2016': 411,
                    '2017': 524,
                    '2018': 572,
                    '2019': 429
                }
            }
        }
    ];

    function Mean(data) {
        var sum = data.reduce(function(sum, value) {
            return sum + value;
        }, 0);

        var avg = sum / data.length;
        return avg;
    }

    /**
     * The "median" is the "middle" value in the list of numbers.
     *
     * @param {Array} numbers An array of numbers.
     * @return {Number} The calculated median value from the specified numbers.
     */
    function Median(numbers) {
        // median of [3, 5, 4, 4, 1, 1, 2, 3] = 3
        var median = 0,
            numsLen = numbers.length;
        numbers.sort();

        if (
            numsLen % 2 === 0 // is even
        ) {
            // average of two middle numbers
            median = (numbers[numsLen / 2 - 1] + numbers[numsLen / 2]) / 2;
        } else { // is odd
            // middle number only
            median = numbers[(numsLen - 1) / 2];
        }

        return median;
    }

    function STD(numbers) {
        var avg = Mean(numbers);
        var squareDiffs = numbers.map(function(value) {
            var diff = value - avg;
            var sqr = diff * diff;
            return sqr;
        });
        var avgSquareDiff = Mean(squareDiffs);
        var stdDev = Math.sqrt(avgSquareDiff);

        return stdDev;
    }

    function getDiff(data) {
        var diffs = [];
        for (k = 0; k < data.length - 1; k++) {
            diffs.push(Math.abs(data[k] - data[k + 1]));
        }
        return diffs;
    }

    function returnObj(data) {
        mean = Mean(data);
        median = Median(data); //after median get array
        std = STD(data);
        return { 'mean': mean, 'median': median, "std": std };
    }

    function calc(arreglo) {
        for (i = 0; i < arreglo.length; i++) {
            universidad = arreglo[i]; //Universidad entity
            nombre = Object.keys(universidad)[0];
            attributos = universidad[nombre]; //objeto de atributos
            n_attr = Object.keys(attributos); //nombre de atributos en arreglo
            for (j = 0; j < n_attr.length; j++) {
                values = attributos[n_attr[j]];
                numbers = Object.values(values);


                numbers = Object.values(values);
                speedArr = getDiff(numbers);
                accArr = getDiff(speedArr);

                values["L5Y"] = returnObj(numbers);
                values["speed"] = returnObj(speedArr);
                values["acc"] = returnObj(accArr);
            }
        }
    }


    function createArffObject(arreglo) {
        names = [];
        data = [];
        currentYear = '2019';

        for (i = 0; i < arreglo.length; i++) {

            instance = [];

            universidad = arreglo[i]; //Universidad entity
            nombre = Object.keys(universidad)[0];
            attributos = universidad[nombre]; //objeto de atributos
            n_attr = Object.keys(attributos);
            for (j = 0; j < n_attr.length; j++) {
                values = attributos[n_attr[j]];
                instance.push(values[currentYear]);
                instance.push(values["L5Y"]["mean"]);
                instance.push(values["L5Y"]["median"]);
                instance.push(values["L5Y"]["std"]);
                instance.push(values["speed"]["mean"]);
                instance.push(values["speed"]["median"]);
                instance.push(values["speed"]["std"]);
                instance.push(values["acc"]["mean"]);
                instance.push(values["acc"]["median"]);
                instance.push(values["acc"]["std"]);

                if (i == 0) {
                    names.push(n_attr[j] + ".currentYear");
                    names.push(n_attr[j] + ".L5Y.mean");
                    names.push(n_attr[j] + ".L5Y.median");
                    names.push(n_attr[j] + ".L5Y.std");
                    names.push(n_attr[j] + ".speed.mean");
                    names.push(n_attr[j] + ".speed.median");
                    names.push(n_attr[j] + ".speed.std");
                    names.push(n_attr[j] + ".acc.mean");
                    names.push(n_attr[j] + ".acc.median");
                    names.push(n_attr[j] + ".acc.std");
                }
            }
            data.push(instance);
        }

        return { data: data, names: names };
    }

    function arffPrint(arreglo) {
        finalTxt = "@RELATION DB \n\n";
        nombres = arreglo["names"];
        datos = arreglo["data"];
        for (i = 0; i < nombres.length; i++) {
            finalTxt += "@ATTRIBUTE " + nombres[i] + "  NUMERIC \n";
        }
        finalTxt += "\n@DATA \n";
        for (i = 0; i < datos.length; i++) {
            finalTxt += datos[i].join() + "\n";
        }

        return finalTxt;
    }

    calc(json);
    arff = createArffObject(json);

    var text = arffPrint(arff),
        blob = new Blob([text], { type: 'text/plain' }),
        anchor = document.createElement('a');

    anchor.download = "hello.txt";
    anchor.href = (window.webkitURL || window.URL).createObjectURL(blob);
    anchor.dataset.downloadurl = ['text/plain', anchor.download, anchor.href].join(':');
    anchor.click();