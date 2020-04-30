const express = require("express");
const bodyParser = require("body-parser");
const connectDB = require("./config/db");
const pino = require("express-pino-logger")();
const client = require("twilio")(
  process.env.TWILIO_ACCOUT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
var cors = require("cors");
const users = require("./routes/api/users");
const fetch = require("node-fetch");
const GsmCharsetUtils = require("@trt2/gsm-charset-utils");

const CronJob = require("cron").CronJob;
var moment = require("moment-timezone");
var Sentiment = require("sentiment");
var sentiment = new Sentiment();
const stripHtml = require("string-strip-html");

const NEWS_API_BASE_URL = "http://newsapi.org/v2/everything?";

const app = express();
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);
app.use(bodyParser.json());
app.use(pino);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ extended: false }));

//Connect the mongoDB database
connectDB();

//Cron job that will run every minute
var job = new CronJob(
  "* * * * *",
  function() {
    console.log("You will se this message every minute");

    fetch("http://localhost:8082/api/users")
      .then(res => res.json())
      .then(json => {
        json.forEach(person => {
          var time = moment
            .tz(person.timeZone)
            .format()
            .substr(11, 5);
          var today = moment
            .tz(person.timeZone)
            .format()
            .substr(0, 10);
          var yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);

          if (time === "08:55") {
            queryNewsArticles(person, yesterday.toISOString().substr(0, 10));
          }
        });
      });
  },
  null,
  true
);

//Have to run job.start() to actually get cron to work
job.start();

//Uses all the methods from /routes/api/users
app.use("/api/users", users);

async function queryNewsArticles(user, dateFrom) {
  console.log("Trying to query articles");
  var topics = `(coronavirus OR covid19) AND ${user.location}`;

  var from = dateFrom;

  const params = new URLSearchParams({
    q: topics,
    from: from,
    sortBy: "popularity",
    language: "en",
    apiKey: process.env.NEWS_API_KEY
  });
  var API_URL = NEWS_API_BASE_URL + params.toString();
  console.log(API_URL);
  var approvedArticles = `Good Morning ${user.name}!\n\n`;

  await fetch(API_URL)
    .then(res => res.json())
    .then(allArticles => {
      allArticles.articles.forEach(element => {
        var currentString = `- ${element.title}\n${element.description}`;
        currentString = stripHtml(currentString);

        if (approvedArticles.length + currentString.length < 1300) {
          var result = sentiment.analyze(currentString);
          currentString = GsmCharsetUtils.removeNonGsmChars(currentString, " ");
          if (result.score >= 2) {
            approvedArticles += `${currentString}\n\n`;
          }
        } else {
          return;
        }
      });
    })
    .then(() => {
      postMessage(approvedArticles, user.phoneNumber);
    })
    .catch(error => {
      console.log("Error with fetching the news", error);
    });
}

function postMessage(text, phoneNumber) {
  if (text.length != 0) {
    console.log(text.length);
    fetch("http://localhost:8082/api/messages", {
      method: "POST",
      body: JSON.stringify({
        body: text,
        to: phoneNumber
      }),
      headers: { "Content-Type": "application/json" }
    })
      .then(res => res.json())
      .then(res => {});
  }
}

//This is where the message actually goes to the API
app.post("/api/messages", (req, res) => {
  res.header("Content-Type", "application/json");
  client.messages
    .create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: req.body.to,
      body: req.body.body
    })
    .then(() => {
      res.send(JSON.stringify({ success: true }));
    })
    .catch(err => {
      console.log(err);
      res.send(JSON.stringify({ success: false }));
    });
});

app.listen(8082, () => console.log("Express server is on localhost:8082"));
