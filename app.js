const express = require("express");
const https = require("https");
const bodyParser = require("body-parser");
const config = require('./config');

const app = express();

var resultsPage = `
<!DOCTYPE html>
<html lang="en" dir="ltr">
  <head>
    <meta charset="utf-8">
    <title>Results</title>
    <!-- Bootstrap core CSS -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.2.0/css/bootstrap.min.css" integrity="sha512-XWTTruHZEYJsxV3W/lSXG1n3Q39YIWOstqvmFsdNEEQfHoZ6vm6E9GK2OrF6DSJSpIbRbi+Nn0WDPID9O7xB2Q=="
    crossorigin="anonymous" referrerpolicy="no-referrer" />
    <style>
    body {
      margin: 40px 150px 25px;
    }
</style>

  </head>
  <body>

`


function jobTemplate(job,currency){

  if (job.salary_max) {
    myResult = `
    <div class="card">
      <div class="card-body">
      <h4 class="card-title">${job.title} up to ${currency}${job.salary_max}</h4>
      <h5>${job.location.display_name}</h5>
      <p class="card-text">${job.description}</p>
      <a href="${job.redirect_url}">View Job</a>
      </div>
    </div>
    `;
    return myResult
  }

  if (job.salary_is_predicted == "0"){
    myResult =  `
    <div class="card">
      <div class="card-body">
      <h4 class="card-title">${job.title}</h4>
      <h5>${job.location.display_name}</h5>
      <h5> Salary : Not disclosed</h5>
      <p class="card-text">${job.description}</p>
      <a href="${job.redirect_url}">View Job</a>
      </div>
    </div>
    `;
    return myResult
  }

}


countryList = {'Australia':'au','Canada':'ca','France':'fr','Great Britain':'gb',
'India':'in','USA':'us','New Zealand':'nz'};

currencyList = {'Australia':'A$','Canada':'C$','France':'€','Great Britain':'£',
'India':'₹','USA':'$','New Zealand':'NZ$'};


app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

const APP_ID = config.APP_ID;
const APP_KEY = config.APP_KEY;

app.get("/",function(req,res){
  res.sendFile(__dirname+"/index.html");
});

app.post("/",function(req,res){

  var countryName = req.body.country;
  var countryCode = countryList[countryName];
  var currency = currencyList[countryName];
  var skill = req.body.skill;
  skill = skill.toLowerCase()
  var city = req.body.city;
  city = city.toLowerCase();
  const baseURL = 'https://api.adzuna.com/v1/api/jobs/'+countryCode+'/search/1?';
  const baseParams = 'app_id='+ APP_ID +'&app_key=' + APP_KEY + '&results_per_page=25&content-type=application/json';
  var userParams = '&what='+ skill + '&where=' + city;

  var targetURL = baseURL+baseParams+userParams;
  // console.log(targetURL);
  https.get(targetURL, function(response){
    if (response.statusCode = 200){
      let finalData = '';
      response.on("data",function(data){
        finalData += data.toString();
      });

      response.on("end",function(){
        const parsedData = JSON.parse(finalData);
        var jobsArray = parsedData.results;
        if (jobsArray.length > 0){
          var jobsResults = jobsArray.map(job => jobTemplate(job,currency)).join('');
          res.write(resultsPage);
          res.write(jobsResults);
          res.send();

        } else { res.sendFile(__dirname+"/errorpage.html"); }

      });

    } else {
      res.sendFile(__dirname+"/errorpage.html");

    }

  });

});

app.listen(process.env.PORT || 3000,function(){
  console.log("Server has started on port 3000");
});
