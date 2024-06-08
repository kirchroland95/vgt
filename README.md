# Video Game Traker

## Introduction
This website is made to track the games you have played and make a short note of your experience with it.
Check it out here: [GameTracker](https://gametracker-6enp.onrender.com)

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
  - Express-session
  - Body-parser
  - EJS
  - dotenv
  - Bcrypt
  - pg (node-postgres)
  - serve-favicon

## Database Structure
CREATE TABLE UserCredentials (
uid SERIAL PRIMARY KEY,
email VARCHAR(60) NOT NULL,
password VARCHAR(60) NOT NULL,
username VARCHAR(60) NOT NULL,
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


## PostgreSQL
create table
  usercredentials (
    uid serial,
    email text not null,
    password text not null,
    username text not null,
    constraint usercredentials_pkey primary key (uid)
  ) tablespace pg_default;

create table
  gamedata (
    id serial,
    name text not null,
    platform text not null,
    achievement text not null,
    review text not null,
    rating integer not null,
    imgurl text null,
    imgpopurl text null,
    user_uid integer null,
    constraint gamedata_pkey primary key (id),
    constraint gamedata_user_uid_fkey foreign key (user_uid) references usercredentials (uid) on delete cascade
  ) tablespace pg_default;

## Environment variables:
- POSTGRESUSER
- POSTGRESHOST
- POSTGRESDB
- POSTGRESPASSWD
- POSTGRESPORT
- SESSION_SECRET
- PORT

## Links
[3D card hover](https://codepen.io/gayane-gasparyan/pen/wvxewXO)
