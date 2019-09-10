# Assigment QS

# Installation
----
The project needs to have NodeJS installed and all its dependencies this can be done by running:

```
$npm install
```

# Steps to Follow
----
The process for scrapping was the following:

- Given a list of universities in ```universtities.txt``` file (In this case from QS) they are searched using Scopus and Scival
to retrive their id in both platforms using the command ```$node qs_bot.js > universities.csv```
(In our task, this had missing values that were later added manually)

- Then having ```universities.csv``` we used for ```$node sc_bot.js > result.json```to grad all the attributes from Scopus and Scival
and having it as a json file with raw attributes

- Finally the ```result.json``` was used for ```$node calc.js > Database.arff```to have all the attributes with their calculations
as specified in the assigment document

(The idea of doing the scrapping in different steps was to avoid being blocked by Scopus and Scival, and also having the raw
attributes in case we need to have another type of calculation in the future)
