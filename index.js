import 'dotenv/config'
import express from "express";
import bodyParser from "body-parser"
import pg from "pg"
import bcrypt from "bcrypt"

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
let loggeduser="";
// toggle for login and signup screen
let signupon=false;
const saltRounds = 10;

// render homepage
app.get("/", async (req, res) => {
   res.render("index.ejs",{
    loggeduser: loggeduser
   })
  });

// render login page
app.get("/login", async (req, res) => {
  // if user clicked on logout button, check if the user was logged in
  if(loggeduser!=""){
    // if he was, log him out and set user back to default
    loggeduser="";
  }
  // signup screen should be disabled on first visit on the login page
  signupon=false;
  res.render("login.ejs",{
    loggeduser: loggeduser,
    signupon: signupon
  })
  });

app.get("/signup", async (req, res) => {
  // set signup flag to true, showing that signup form should be active
  signupon=true;
  // render login page again, with this flag active
  res.render("login.ejs",{
    loggeduser: loggeduser,
    signupon: signupon
  })
  });


app.post("/login", async (req, res) => {
  // get user and password from form and get password from database
  const {username, password}=req.body;
  const get_user = (await db.query("SELECT * FROM usercredentials WHERE username = $1;",[username])).rows
  // if a user exists with that name, check the password
  if(get_user.length>0){
      bcrypt.compare(password, get_user[0].password, function(err, result) {
        if(result){
          loggeduser=get_user[0].username;
          res.render("index.ejs",{
            loggeduser: loggeduser
           })
        }else{
          console.log("wrong password");
        }
    });
  }else{
    console.log("user does not exist");
  }
  });

app.post("/signup", async (req, res) => {
  const {username, password, confirmpassword}=req.body;
  // check if the 2 passwords match
  if(password!=confirmpassword){
    console.log("Passwords don't match!")
    // if they don't, render signup screen again
    res.render("login.ejs",{
      loggeduser: loggeduser,
      signupon: signupon
    })
  }else{
    // if passwords are the same, check if user exists in the database
    const get_user = (await db.query("SELECT * FROM usercredentials WHERE username = $1;",[username])).rows
    if(get_user.length>0){
      console.log("User already exists!")
      // if they do, render signup screen again
      res.render("login.ejs",{
        loggeduser: loggeduser,
        signupon: signupon
      })
    }else{
      // encrypt password with bcrypt
      bcrypt.hash(password, saltRounds, async function(err, hash) {
        try {
          // insert new user and hashed password into the database
          const result = await db.query("INSERT INTO usercredentials (username, password) VALUES ($1, $2)",[username, hash]);
          // set logged user to registered user value to instantly log them in and render homescreen 
          loggeduser=username
          res.render("index.ejs",{
            loggeduser: loggeduser
          })
        } catch (error) {
          console.log(error);
        }
        
      });
      

      
    }
  }
  

  });

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});