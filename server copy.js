//IMPORTING MODULES
const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const session = require("express-session");

//SETTING EXPRESS APP
const app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: "This is my secret",
    saveUninitialized: false,
    resave: false,
  })
);

//CREATING DATABASE CONNECTION
const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "dining_management_system",
});
con.connect((err) => {
  if (err) {
    console.log(err);
  } else {
    console.log("Connection to database established successfully");
  }
});
let time;
//FUNCTION TO GET BOOKINGS
async function getBookings(id) {
  let sql =
    "SELECT * FROM booking WHERE customer_id = ? AND booking_status not like 'closed';";
  con.query(sql, id, (err, result) => {
    if (err) throw err;
    console.log(result);
    let len = result.length;
    console.log(len);
    return len;
  });
}

//LOGOUT ROUTE
app.get("/logout", (req, res) => {
  res.sendFile(__dirname + "/logout.html");
});

app.post("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

//LOGIN ROUTE
app.post("/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  let sql = "SELECT id, password FROM customer where email = ?;";
  con.query(sql, [email], (err, result) => {
    if (err) throw err;
    if (result.length > 0) {
      if (result[0].password !== password) {
        res.render("login.ejs", { error_string: "Invalid username/password" });
      } else {
        req.session.user = result[0].id;
        res.send("User logged in"); //replace with dashboard page
      }
    } else {
      res.render("login.ejs", { error_string: "Invalid username/password" });
    }
  });
});

app.get("/login", (req, res) => {
  if (typeof req.session.user != "undefined") {
    res.sendFile(__dirname + "/logout.html"); //to be replaced with redirection to dashboard page
  } else {
    res.render("login.ejs", { error_string: "" }); //to be replaced with login page
  }
});

//HOME PAGE
app.get("/", (req, res) => {
  res.render("index.ejs"); //to be replaced with homepage
});

//REGISTER NEW ACCOUNT

app.post("/register", (req, res) => {
  let fname = req.body.fname;
  let lname = req.body.lname;
  let gender = req.body.gender;
  let email = req.body.email;
  let phone = parseInt(req.body.phone);
  let password = req.body.password;
  //   console.log(
  //     id + " " + name + " " + gender + " " + email + " " + phone + " " + password
  //   );
  let sql =
    "INSERT INTO customer(fname, lname, gender, phone, email, password) VALUES (?, ?, ?, ?, ?, ?);";
  con.query(
    sql,
    [fname, lname, gender, phone, email, password],
    (err, result) => {
      if (err)
        res.render("login.ejs", {
          error_string: "Email/Phone already exists. Try logging in",
        });
      //Replace with register failure page
      else {
        console.log("Insertion successful");
        res.redirect("/login"); //Replace with registration success page
      }
    }
  );
});

//BOOKING ROUTE
app.get("/book-table", (req, res) => {
  if (typeof req.session.user != "undefined") {
    let no_of_bookings = getBookings(req.session.user);
    console.log("final:" + no_of_bookings);
    if (no_of_bookings > 0) {
      res.send("Table already booked");
    } else {
      let sql = "SELECT * FROM branch;";
      con.query(sql, (err, reslt) => {
        if (err) throw err;
        res.render("booking.ejs", { branch: reslt, error_string: "" });
      });
    }
  } else {
    res.redirect("/login");
  }
});

app.post("/book-table", (req, res) => {
  let id = req.body.branch;
  let timeStart = req.body.timeStart;
  let timeEnd = req.body.timeEnd;
  if (timeStart > timeEnd || time > timeStart) {
    //TIME VALIDATION
    let sql = "SELECT * FROM branch;";
    con.query(sql, (err, result) => {
      if (err) throw err;
      res.render("booking.ejs", {
        branch: result,
        error_string:
          "We can't go back in time, but that doesn't mean i dont have a time machine",
      });
    });
  } else {
    let sql1 =
      "SELECT table_no from dining_table where branch_id = ? AND availability = 'V' limit 1;";
    con.query(sql1, id, (err, result) => {
      if (err) throw err;
      console.log("Table successfully selected");
      console.log(result[0]);
      let table = result[0].table_no;
      let sql2 =
        "INSERT INTO booking (customer_id, branch_id, table_no, time_slot_start, time_slot_end, booking_status) values (?, ?, ?, ?, ?, 'confirmed');";
      let sql3 =
        "UPDATE dining_table set availability = 'E' where branch_id = ? AND table_no = ?;";
      con.query(
        sql2,
        [req.session.user, id, table, timeStart, timeEnd],
        (error, reslt) => {
          if (error) throw error;
          console.log("Inserted suuccessfully");
        }
      );
      con.query(sql3, [id, table], (error, reslt) => {
        if (error) throw error;
        console.log("Updated successfully");
      });
      res.send("table no. " + table + " booked in branch" + id);
    });
  }
});

//BOOKING AND TABLE_NO UPDATION
setInterval(() => {
  let date = new Date();
  time = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
  let sql2 =
    "update booking b set booking_status = 'active' where time_slot_start <= ? and b.time_slot_end >= ? and booking_status not like 'active';";
  con.query(sql2, [time, time], (err, result) => {
    if (err) throw err;
    if (typeof result[0] != "undefined") console.log(result[0]);
  });
  let sql1 =
    "update booking set booking_status = 'closed' WHERE time_slot_end <= ? and booking_status not like 'closed';";
  con.query(sql1, time, (err, result) => {
    if (err) {
      throw err;
    }
    if (typeof result[0] != "undefined") console.log(result[0]);
  });
  // console.log(time);
}, 1);

//SERVER LISTENING
let port = process.env.PORT || 3000;
app.listen(port, () => {
  ``;
  console.log("Server is listening on port " + port);
});
