import 'dotenv/config'
import express from "express";
import bodyParser from "body-parser"
import pg from "pg"

// start express app
const app = express();
// declare port to use by express
const port = 3000;

// create database connection using .env values
const db = new pg.Client({
  user: process.env.POSTGRESUSER,
  host: process.env.POSTGRESHOST,
  database: process.env.POSTGRESDB,
  password: process.env.POSTGRESPASSWD,
  port: process.env.POSTGRESPORT,
});
db.connect();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

// use public folder for static path
app.use(express.static("public"));
app.set('view engine','ejs');

// keep track of the user after login
const loggeduser="";

// render homepage
app.get("/", async (req, res) => {
   res.render("index.ejs")
  });

// render login page
app.get("/login", async (req, res) => {
  res.render("login.ejs")
  });

app.post("/login", async (req, res) => {
  const {username, password}=req.body;
  const get_user = (await db.query("SELECT * FROM usercredentials WHERE username = $1 AND password = $2;",[username, password])).rows
  if(get_user.length>0){
    loggeduser=get_user[0].username;
    console.log(get_user[0]);
  }else{
    console.log("wrong pass");
  }
  });

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});