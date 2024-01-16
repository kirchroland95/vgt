import express from "express";

const app = express();
const port = 3000;

app.use(express.static("public"));

app.get("/", async (req, res) => {
   res.render("index.ejs")
  });

app.get("/login", async (req, res) => {
  res.render("login.ejs")
  });

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});