const fs = require('fs');
const path = require('path');

// makes the animals.json file available here
// very curious about by animals is between curly brackets
//  - it's a json.file not an object?
const { animals } = require('./data/animals.json');

// imports the express package
const express = require('express');

// sets the port we will be using
// when heroku rruns our app, it sets an evironment variable called process.env.PORT
const PORT = process.env.PORT || 3001;

// initialicezes the express.js server
const app = express();

// middleware function
// parse incoming string or array data
// app.use is a method that mounts a function to our server. our requests will pass through this function before getting to the intended endpoint
// .urlencoded takes incoming POST data and converts it to key/value pairings
// ({ extended: true }) informs the server that there maybe a subarray data nested in it as well
app.use(express.urlencoded({ extended: true }));

// middleware function
// takes incoming POST data in the form of JSON and parses it into the req.body
app.use(express.json());

// The parameters
//  - query
//      - the .get() sends this here. it is the req.query
//          - re.query takes the the query paramters and turns it into a JSON
function filterByQuery(query, animalsArray) {
    // i believe this creates an empty array for us to push too
    let personalityTraitsArray = [];

    // note that we save the animalsArray as filteredResults here
    let filteredResults = animalsArray;

    // basically if the query is for personalityTraits then...
    // if we were to type http://localhost:3001/api/animals?personalityTraits=loving
    // then our function would continue here 
    // query. is a property of the req object
    if (query.personalityTraits) {
        // save personalityTraits as a dedicated array
        // if personalityTraits is a string, then we are only searching for one personanlityTrait
        //  - because if we had searched for for two or more, query.persoanlityTrait would be an array
        //      - example: ['quirky', 'rash']
        if (typeof query.personalityTraits === 'string') {
            // this places the single query string ino an array
            personalityTraitsArray = [query.personalityTraits];
        }
        else {
            personalityTraitsArray = query.personalityTraits;
        }
        // loop through each trait in the personalityTraits array:

        personalityTraitsArray.forEach(trait => {
            // Check the trait against each animal in the filteredResults array
            // Remember, it is initially a copy of the animalsArray, but here we're updating it for trait in the .forEach() loop
            // for each trait being targeted by the filter, the filteredResults array will then contain only the entries that contain the trait,
            // so that at the end we'll have an array of animals that have every one
            // of the traits when the .forEach() loop is finished.
            filteredResults = filteredResults.filter(
                animal => animal.personalityTraits.indexOf(trait) !== -1
            );
        });
    }
    if (query.diet)  {
        // filter out into a new array all animals that that have a diet paramter that is equal to ourquery request
        filteredResults = filteredResults.filter(animal => animal.diet === query.diet);
    }
    if (query.species) {
        filteredResults = filteredResults.filter(animal => animal.species === query.species);
    }
    if (query.name) {
        filteredResults = filteredResults.filter(animal => animal.name === query.name);
    }
    // return filtered results:
    return filteredResults;
}

function findById(id, animalsArray) {
    const result = animalsArray.filter(animal => animal.id === id)[0];
    return result;
} 

// body - post route's req.body value
// animalsArray the array we want to add the data to. 
//  - on this case animalsArray because the function is for adding a new animal to the catalog
function createNewAnimal(body, animalsArray) {
    const animal = body;
    animalsArray.push(animal);
    fs.writeFileSync(
        // joins all given path segments together using the platform-specific seperator
        // __dirname represent the directory of the file we executed
        path.join(__dirname, './data/animals.json'),
        JSON.stringify({ animals: animalsArray }, null, 2)
    );
    return animal;
}

function validateAnimal(animal) {
    if (!animal.name || typeof animal.name !== 'string') {
      return false;
    }
    if (!animal.species || typeof animal.species !== 'string') {
      return false;
    }
    if (!animal.diet || typeof animal.diet !== 'string') {
      return false;
    }
    if (!animal.personalityTraits || !Array.isArray(animal.personalityTraits)) {
      return false;
    }
    return true;
}

// where does this api come from? there is no folder called API?
// routes HTTP GET requests to the specified path with the specified call function
app.get('/api/animals', (req, res) => {
    // sets the result variable equal to the aniamls variabe which i believe is the JSON file with all the data
    let results = animals;
    if (req.query) {
        // first variable is the request we made, second variable is the animals JSON file
        results = filterByQuery(req.query, results);
    }
    res.json(results);
});

app.get('/api/animals/:id', (req, res) => {
    const result = findById(req.params.id, animals);
    if (result) {
        res.json(result);
    }
    else {
        res.send(404);
    }
})

app.post('/api/animals', (req, res) => {
    // set id based on what the next index of the array will be
    req.body.id = animals.length.toString();

    // if any data in req.body is incorrect, send 400 error back
    if(!validateAnimal(req.body)) {
        res.status(400).send('The animal is not properly formatted');
    }
    else {
        const animal = createNewAnimal(req.body, animals);
        res.json(animal);
    }
});

app.listen(PORT, () => {
    console.log(`API server now on port ${PORT}!`);
});