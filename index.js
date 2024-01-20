import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";

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
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

// use public folder for static path
app.use(express.static("public"));
app.set("view engine", "ejs");

// keep track of the user after login
let loggeduser = "";
// toggle for login and signup screen
let signupon = false;
const saltRounds = 10;
let gamelist = [];
let wrongCredentials = "no error";

// render homepage
app.get("/", async (req, res) => {
  let loggeduserID;
  if (loggeduser == "") {
    loggeduserID = 1;
  } else {
    const getuserID = (
      await db.query("SELECT * FROM usercredentials WHERE email = $1;", [
        loggeduser,
      ])
    ).rows;
    loggeduserID = getuserID[0].uid;
  }

  gamelist = (
    await db.query("SELECT * FROM gamedata WHERE user_uid = $1;", [
      loggeduserID,
    ])
  ).rows;
  res.render("index.ejs", {
    loggeduser: loggeduser,
    gamelist: gamelist,
  });
});

// render login page
app.get("/login", async (req, res) => {
  wrongCredentials="no error";
  // if user clicked on logout button, check if the user was logged in
  if (loggeduser != "") {
    // if he was, log him out and set user back to default
    loggeduser = "";
  }
  // signup screen should be disabled on first visit on the login page
  signupon = false;
  res.render("login.ejs", {
    loggeduser: loggeduser,
    signupon: signupon,
    wrongCredentials: wrongCredentials
  });
});

app.get("/signup", async (req, res) => {
  wrongCredentials="no error";
  // set signup flag to true, showing that signup form should be active
  signupon = true;
  // render login page again, with this flag active
  res.render("login.ejs", {
    loggeduser: loggeduser,
    signupon: signupon,
    wrongCredentials: wrongCredentials
  });
});

// render homepage
app.get("/new", async (req, res) => {
  res.render("new.ejs", {
    loggeduser: loggeduser,
    gamelist: gamelist,
  });
});

// order by newest 
app.get("/ordernew", async (req, res) => {
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

// order by oldest 
app.get("/orderold", async (req, res) => {
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

// order by highest rated 
app.get("/orderbest", async (req, res) => {
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

// order by lowest rated 
app.get("/orderworst", async (req, res) => {
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

// search for an entry
app.post("/search", async (req, res) => {
  const {search} = req.body;
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
      async function (err, result) {
        if (result) {
          loggeduser = get_user[0].email;
          gamelist = (
            await db.query("SELECT * FROM gamedata WHERE user_uid = $1;", [
              get_user[0].uid,
            ])
          ).rows;

          res.render("index.ejs", {
            loggeduser: loggeduser,
            gamelist: gamelist,
          });
        } else {
          console.log("wrong password");
          wrongCredentials="wrongpass";
          res.render("login.ejs", {
            loggeduser: loggeduser,
            signupon: signupon,
            wrongCredentials: wrongCredentials
          });
        }
      }
    );
  } else {
    console.log("user does not exist");
    wrongCredentials="wrongpass";
    res.render("login.ejs", {
      loggeduser: loggeduser,
      signupon: signupon,
      wrongCredentials: wrongCredentials
    });
  }
});

app.post("/signup", async (req, res) => {
  const { username, password, confirmpassword } = req.body;
  // check if the 2 passwords match
  if (password != confirmpassword) {
    console.log("Passwords don't match!");
    wrongCredentials="missmatchpass";
    // if they don't, render signup screen again
    res.render("login.ejs", {
      loggeduser: loggeduser,
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
    if (get_user.length > 0) {
      console.log("User already exists!");
      wrongCredentials="userexist";
      // if they do, render signup screen again
      res.render("login.ejs", {
        loggeduser: loggeduser,
        signupon: signupon,
        wrongCredentials: wrongCredentials
      });
    } else {
      // encrypt password with bcrypt
      bcrypt.hash(password, saltRounds, async function (err, hash) {
        try {
          // insert new user and hashed password into the database
          const result = await db.query(
            "INSERT INTO usercredentials (email, password) VALUES ($1, $2)",
            [username, hash]
          );
          // set logged user to registered user value to instantly log them in and render homescreen
          loggeduser = username;
          const get_registered_user = (
            await db.query("SELECT * FROM usercredentials WHERE email = $1;", [
              loggeduser,
            ])
          ).rows;
          gamelist = (
            await db.query("SELECT * FROM gamedata WHERE user_uid = $1;", [
              get_registered_user[0].uid,
            ])
          ).rows;
          res.render("index.ejs", {
            loggeduser: loggeduser,
            gamelist: gamelist,
          });
        } catch (error) {
          console.log(error);
        }
      });
    }
  }
});

app.post("/new", async (req, res) => {
  const { name, platform, achievements, rating, imgurl, imgpopurl, review } =
    req.body;
  const get_user = (
    await db.query("SELECT * FROM usercredentials WHERE email = $1;", [
      loggeduser,
    ])
  ).rows;
  try {
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
    gamelist = (
      await db.query("SELECT * FROM gamedata WHERE user_uid = $1;", [
        get_user[0].uid,
      ])
    ).rows;
  } catch (error) {
    console.log(error);
  }
  res.render("index.ejs", {
    loggeduser: loggeduser,
    gamelist: gamelist,
  });
});

app.post("/edit", async (req, res) => {
  const itemid = req.body.id;
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
  res.render("edit.ejs", {
    loggeduser: loggeduser,
    item: item_data,
  });
});

app.post("/editsave", async (req, res) => {
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
  try {
    const result = await db.query(
      "UPDATE gamedata SET name = $1, platform = $2, achievement = $3, review = $4, rating = $5, imgurl = $6, imgpopurl =$7 WHERE id = $8",
      [name, platform, achievements, review, rating, imgurl, imgpopurl, id]
    );
    gamelist = (
      await db.query("SELECT * FROM gamedata WHERE user_uid = $1;", [user_uid])
    ).rows;
  } catch (error) {
    console.log(error);
  }
  res.render("index.ejs", {
    loggeduser: loggeduser,
    gamelist: gamelist,
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
