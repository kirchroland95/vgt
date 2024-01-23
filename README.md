# Video Game Traker

## Introduction
This website is made to track the games you have played and make a short note of your experience with it.

## How it works
- Homepage shows the list of a default user 
- Sign up to create your own list
- Once you signed in you can:
  - View your game list
  - Add a new game to the list
  - Edit existing games in the list

## Support
The website was designed for desktop usage. There is a second layout for the content if the screen gets too small. This results in rendering the left and right areas as top and bottom areas.

## Tech stack used:
- HTML
- CSS
- Bootstrap
- PostgreSQL
- Node.js
- Node packages:
  - Express
  - Body-parser
  - EJS
  - dotenv
  - Bcrypt
  - pg (node-postgres)

## Database Structure
CREATE TABLE UserCredentials (
uid SERIAL PRIMARY KEY,
email VARCHAR(60) NOT NULL,
password VARCHAR(60) NOT NULL
);

CREATE TABLE GameData (
id SERIAL PRIMARY KEY,
name VARCHAR(255) NOT NULL,
platform VARCHAR(50) NOT NULL,
achievement VARCHAR(10) NOT NULL,
review VARCHAR(1000) NOT NULL,
rating INT NOT NULL,
imgurl VARCHAR(255) NOT NULL,
imgpopurl VARCHAR(255) NOT NULL,
user_uid INT REFERENCES UserCredentials(uid) ON DELETE CASCADE
);

## Links
[GameTracker](https://www.google.com)
[3D card hover](https://codepen.io/gayane-gasparyan/pen/wvxewXO)


