import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import session from 'express-session';
import favicon from 'serve-favicon'
// start express app
const app = express();
// declare port to use by express
const port = 3000;

// create database connection using .env values and connect to it
const db = new pg.Client({
  user: process.env.POSTGRESUSER,
  host: process.env.POSTGRESHOST,
  database: process.env.POSTGRESDB,
  password: process.env.POSTGRESPASSWD,
  port: process.env.POSTGRESPORT,
});
db.connect();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

// use public folder for static path
app.use(express.static("public"));
app.use(session({
  secret: process.env.SESSION_SECRET, // Replace with a strong secret key
  resave: false,
  saveUninitialized: true,
}));
app.set("view engine", "ejs");

// toggle for login and signup screen
let signupon = false;
const saltRounds = 10;
// store a users game list here
let gamelist = [];
// used for error handling on login and sign up
let wrongCredentials = "no error";

app.use(favicon('./favicon.ico')); 

// render homepage
app.get("/", async (req, res) => {
  // Retrieve user from the session
  const loggeduser = req.session.loggeduser || "";
  let loggeduserID;
  if (loggeduser == "") {
    loggeduserID = 1; // use this user as a default
  } else {
    // if the user is logged in, search for his entry 
    const getuserID = (
      await db.query("SELECT * FROM usercredentials WHERE email = $1;", [
        loggeduser,
      ])
    ).rows;
    // store logged in user ID
    loggeduserID = getuserID[0].uid;
  }

  // update gamelist with loggeduserID games
  gamelist = (
    await db.query("SELECT * FROM gamedata WHERE user_uid = $1;", [
      loggeduserID,
    ])
  ).rows;
  // render the homepage
  res.render("index.ejs", {
    loggeduser: loggeduser,
    gamelist: gamelist,
  });
});

// render login page
app.get("/login", async (req, res) => {
  wrongCredentials="no error";
  let loggeduser = req.session.loggeduser || "";
  // if user clicked on logout button, check if the user was logged in
  if (loggeduser != "") {
    // if he was, log him out and set user back to default
    req.session.loggeduser = "";
    loggeduser = "";
  }
  // signup screen should be disabled on first visit on the login page
  signupon = false;
  // render login screen
  res.render("login.ejs", {
    loggeduser: loggeduser,
    signupon: signupon,
    wrongCredentials: wrongCredentials
  });
});

// switch to sign up screen
app.get("/signup", async (req, res) => {
  const loggeduser = req.session.loggeduser || "";
  wrongCredentials="no error";
  // set sign up flag to true, showing that sign up form should be active
  signupon = true;
  // render login page again, with this flag active
  res.render("login.ejs", {
    loggeduser: loggeduser,
    signupon: signupon,
    wrongCredentials: wrongCredentials
  });
});

// render new item page
app.get("/new", async (req, res) => {
  const loggeduser = req.session.loggeduser;
  res.render("new.ejs", {
    loggeduser: loggeduser,
    gamelist: gamelist,
  });
});

// order content by newest 
app.get("/ordernew", async (req, res) => {
  const loggeduser = req.session.loggeduser || "";
  if (loggeduser != "") {
    gamelist = (await db.query("SELECT gd.* FROM GameData gd JOIN UserCredentials uc ON gd.user_uid = uc.uid WHERE uc.email = $1 ORDER BY gd.id DESC;",[loggeduser])).rows
  }else{
    gamelist = (await db.query("SELECT * FROM GameData WHERE user_uid = 1 ORDER BY id DESC;")).rows
  }
  res.render("index.ejs", {
    loggeduser: loggeduser,
    gamelist: gamelist,
  });
});

// order content by oldest 
app.get("/orderold", async (req, res) => {
  const loggeduser = req.session.loggeduser || "";
  if (loggeduser != "") {
    gamelist = (await db.query("SELECT gd.* FROM GameData gd JOIN UserCredentials uc ON gd.user_uid = uc.uid WHERE uc.email = $1 ORDER BY gd.id ASC;",[loggeduser])).rows
  }else{
    gamelist = (await db.query("SELECT * FROM GameData WHERE user_uid = 1 ORDER BY id ASC;")).rows
  }
  res.render("index.ejs", {
    loggeduser: loggeduser,
    gamelist: gamelist,
  });
});

// order content by highest rated 
app.get("/orderbest", async (req, res) => {
  const loggeduser = req.session.loggeduser || "";
  if (loggeduser != "") {
    gamelist = (await db.query("SELECT gd.* FROM GameData gd JOIN UserCredentials uc ON gd.user_uid = uc.uid WHERE uc.email = $1 ORDER BY gd.rating DESC;",[loggeduser])).rows
  }else{
    gamelist = (await db.query("SELECT * FROM GameData WHERE user_uid = 1 ORDER BY rating DESC;")).rows
  }
  res.render("index.ejs", {
    loggeduser: loggeduser,
    gamelist: gamelist,
  });
});

// order content by lowest rated 
app.get("/orderworst", async (req, res) => {
  const loggeduser = req.session.loggeduser || "";
  if (loggeduser != "") {
    gamelist = (await db.query("SELECT gd.* FROM GameData gd JOIN UserCredentials uc ON gd.user_uid = uc.uid WHERE uc.email = $1 ORDER BY gd.rating ASC;",[loggeduser])).rows
  }else{
    gamelist = (await db.query("SELECT * FROM GameData WHERE user_uid = 1 ORDER BY rating ASC;")).rows
  }
  res.render("index.ejs", {
    loggeduser: loggeduser,
    gamelist: gamelist,
  });
});

// search content for an entry
app.post("/search", async (req, res) => {
  const {search} = req.body;
  const loggeduser = req.session.loggeduser || "";
  if (loggeduser != "") {
    gamelist = (await db.query("SELECT gd.* FROM GameData gd JOIN UserCredentials uc ON gd.user_uid = uc.uid WHERE uc.email = $1 AND LOWER(gd.name) LIKE LOWER($2) ORDER BY gd.id DESC;",[loggeduser,"%"+search+"%"])).rows
  }else{
    gamelist = (await db.query("SELECT * FROM GameData WHERE user_uid = 1 AND LOWER(name) LIKE LOWER($1) ORDER BY rating DESC;",["%"+search+"%"])).rows
  }
  res.render("index.ejs", {
    loggeduser: loggeduser,
    gamelist: gamelist,
  });
});

// evaluate login data
app.post("/login", async (req, res) => {
  // get user and password from form and get password from database
  const { username, password } = req.body;
  const get_user = (
    await db.query("SELECT * FROM usercredentials WHERE email = $1;", [
      username,
    ])
  ).rows;
  // if a user exists with that name, check the password
  if (get_user.length > 0) {
    bcrypt.compare(
      password,
      get_user[0].password,
      async function (err, result) { // result can be true or false based on matching password with the one from the database
        if (result) { // true, password matched
          // Set the user in the session
          req.session.loggeduser = username;
          // get user gamelist
          gamelist = (
            await db.query("SELECT * FROM gamedata WHERE user_uid = $1;", [
              get_user[0].uid,
            ])
          ).rows;
          // render homepage with logged in user details
          res.render("index.ejs", {
            loggeduser: username,
            gamelist: gamelist,
          });
        } else { // result was false, password didn't match
          wrongCredentials="wrongpass";
          res.render("login.ejs", {
            loggeduser: "",
            signupon: signupon,
            wrongCredentials: wrongCredentials
          });
        }
      }
    );
  } else { // user doesn't exist, render login screen again
    wrongCredentials="wrongpass";
    res.render("login.ejs", {
      loggeduser: "",
      signupon: signupon,
      wrongCredentials: wrongCredentials
    });
  }
});

// sign up a new user
app.post("/signup", async (req, res) => {
  const { username, password, confirmpassword } = req.body;
  // check if the 2 passwords match
  if (password != confirmpassword) {
    wrongCredentials="missmatchpass";
    // if they don't, render signup screen again
    res.render("login.ejs", {
      loggeduser: "",
      signupon: signupon,
      wrongCredentials: wrongCredentials
    });
  } else {
    // if passwords are the same, check if user exists in the database
    const get_user = (
      await db.query("SELECT * FROM usercredentials WHERE email = $1;", [
        username,
      ])
    ).rows;
    if (get_user.length > 0) { // if user already exists
      wrongCredentials="userexist";
      // render signup screen again
      res.render("login.ejs", {
        loggeduser: "",
        signupon: signupon,
        wrongCredentials: wrongCredentials
      });
    } else { // user does not exist and passwords match, add new user
      // encrypt password with bcrypt
      bcrypt.hash(password, saltRounds, async function (err, hash) {
        try {
          // insert new user and hashed password into the database
          const result = await db.query(
            "INSERT INTO usercredentials (email, password) VALUES ($1, $2)",
            [username, hash]
          );
          // Set the user in the session to instantly log them in and render homescreen
          req.session.loggeduser = username;
          const get_registered_user = (
            await db.query("SELECT * FROM usercredentials WHERE email = $1;", [
              username,
            ])
          ).rows;
          // set the gamelist to the registered users gamelist, should be empty array as no data should exist
          gamelist = (
            await db.query("SELECT * FROM gamedata WHERE user_uid = $1;", [
              get_registered_user[0].uid,
            ])
          ).rows;
          // render homepage with the new user already registered
          res.render("index.ejs", {
            loggeduser: username,
            gamelist: gamelist,
          });
        } catch (error) {
          console.log(error);
        }
      });
    }
  }
});

// add a new game to the list
app.post("/new", async (req, res) => {
  const { name, platform, achievements, rating, imgurl, imgpopurl, review } =
    req.body;
  const loggeduser = req.session.loggeduser || "";
    //get the logged in user data to have his id for later query
  const get_user = (
    await db.query("SELECT * FROM usercredentials WHERE email = $1;", [
      loggeduser,
    ])
  ).rows;
  try {
    // add the new data into the gamedata table from the database
    const result = await db.query(
      "INSERT INTO gamedata (name, platform, achievement, review, rating, imgurl, imgpopurl, user_uid) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [
        name,
        platform,
        achievements,
        review,
        rating,
        imgurl,
        imgpopurl,
        get_user[0].uid,
      ]
    );
    // get the newly updated gamelist from the database
    gamelist = (
      await db.query("SELECT * FROM gamedata WHERE user_uid = $1 ORDER BY id DESC;", [
        get_user[0].uid,
      ])
    ).rows;
  } catch (error) {
    console.log(error);
  }
  // after adding the item, return to the homepage
  res.render("index.ejs", {
    loggeduser: loggeduser,
    gamelist: gamelist,
  });
});

// load in the edit form with existing data from the games
app.post("/edit", async (req, res) => {
  const itemid = req.body.id;
  const loggeduser = req.session.loggeduser;
  // use the id passed through by the form to get the data for the item
  const get_item = (
    await db.query("SELECT * FROM gamedata WHERE id = $1;", [itemid])
  ).rows;
  const item_data = {
    id: itemid,
    name: get_item[0].name,
    platform: get_item[0].platform,
    achievement: get_item[0].achievement,
    review: get_item[0].review,
    rating: get_item[0].rating,
    imgurl: get_item[0].imgurl,
    imgpopurl: get_item[0].imgpopurl,
    user_uid: get_item[0].user_uid,
  };
  // render edit screen with the existing data
  res.render("edit.ejs", {
    loggeduser: loggeduser,
    item: item_data,
  });
});

// save the changes made in the edit page
app.post("/editsave", async (req, res) => {
  // store data from the form
  const {
    name,
    platform,
    achievements,
    rating,
    imgurl,
    imgpopurl,
    review,
    id,
    user_uid,
  } = req.body;
  const loggeduser = req.session.loggeduser;
  try {
    // update the existing entry
    const result = await db.query(
      "UPDATE gamedata SET name = $1, platform = $2, achievement = $3, review = $4, rating = $5, imgurl = $6, imgpopurl =$7 WHERE id = $8",
      [name, platform, achievements, review, rating, imgurl, imgpopurl, id]
    );
    // get the updated gamelist
    gamelist = (
      await db.query("SELECT * FROM gamedata WHERE user_uid = $1;", [user_uid])
    ).rows;
  } catch (error) {
    console.log(error);
  }
  // show the homepage again
  res.render("index.ejs", {
    loggeduser: loggeduser,
    gamelist: gamelist,
  });
});

app.listen(process.env.PORT, () => {
  console.log(`Server running`);
});
