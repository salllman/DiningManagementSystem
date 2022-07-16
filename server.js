//IMPORTING MODULES
const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const session = require("express-session");
const favicon = require("serve-favicon");
const path = require("path");

//SETTING EXPRESS APP
const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(favicon(path.join(__dirname, "public", "/images/faviconfinal.png")));
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
let time2;
//FUNCTION TO GET BOOKINGS
function getBookings(id, callback) {
  var sql =
    "SELECT COUNT(*) AS count FROM booking WHERE customer_id = ? AND booking_status NOT LIKE 'closed';";
  con.query(sql, id, function (err, results) {
    if (err) {
      throw err;
    }
    console.log(results[0].count);
    return callback(results[0].count);
  });
}

//FUNCTION TO GET VACANT TABLE
function getVacantTables(branch_id, callback) {
  var sql =
    "SELECT table_no from dining_table where branch_id = ? AND availability = 'V' limit 1;;";
  con.query(sql, branch_id, function (err, result) {
    if (err) {
      throw err;
    }
    console.log(result);
    if (
      typeof result === "undefined" ||
      result === "[]" ||
      typeof result[0].table_no === "undefined"
    ) {
      return callback(0);
    } else {
      return callback(result[0].table_no);
    }
  });
}

//FUNCTION TO GET COUNT OF ALL TABLES IN DB
function getCount(callback) {
  let sql =
    "SELECT (SELECT COUNT(*) FROM booking) AS bookings,(SELECT COUNT(*) FROM customer) AS customers,(SELECT COUNT(*) FROM branch) AS branches, (SELECT COUNT(*)FROM dining_table) AS tables;";
  con.query(sql, (err, result) => {
    return callback(result);
  });
}

//FUNCTION TO GET COUNT OF TABLES IN EACH BRANCH
function getTableCount(callback) {
  let sql = "SELECT * from tables;";
  con.query(sql, (err, result) => {
    return callback(result);
  });
}

//LOGOUT ROUTE
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

//LOGIN ROUTE
app.post("/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  //FOR ADMIN
  if (email === "admin@dms.com" && password === "iamadmin") {
    req.session.user = 0;
    res.redirect("/admin");
  }
  //FOR CUSTOMERS
  else {
    let sql = "SELECT id, password FROM customer where email = ?;";
    con.query(sql, [email], (err, result) => {
      if (err) throw err;
      if (result.length > 0) {
        if (result[0].password !== password) {
          res.render("login.ejs", {
            error_string: "Invalid username/password",
          });
        } else {
          req.session.user = result[0].id;
          res.redirect("/dashboard"); //replace with dashboard page
        }
      } else {
        res.render("login.ejs", {
          error_string: "Invalid username/password",
          success_string: "",
        });
      }
    });
  }
});

app.get("/login", (req, res) => {
  if (typeof req.session.user != "undefined" && req.session.user !== 0) {
    res.redirect("/book-table"); //to be replaced with redirection to dashboard page
  } else if (req.session.user === 0) {
    res.redirect("/admin");
  } else {
    res.render("login.ejs", { error_string: "", success_string: "" }); //to be replaced with login page
  }
});

//HOME PAGE
app.get("/", (req, res) => {
  if (typeof req.session.user === "undefined") {
    res.render("index.ejs"); //to be replaced with homepage
  } else {
    res.redirect("/dashboard");
  }
});

//REGISTER NEW ACCOUNT

app.post("/register", (req, res) => {
  let fname = req.body.fname;
  let lname = req.body.lname;
  let gender = req.body.gender;
  let email = req.body.email;
  let phone = req.body.phone;
  let password = req.body.password;
  //   console.log(
  //     id + " " + name + " " + gender + " " + email + " " + phone + " " + password
  //   );
  let sql =
    "INSERT INTO customer(fname, lname, gender, phone, email, password) VALUES (?, ?, ?, ?, ?, ?);";
  con.query(
    sql,
    [fname, lname, gender, phone, email, password],
    (err, result, fields) => {
      if (err) {
        res.render("login.ejs", {
          error_string: "Email/Phone already exists. Try logging in",
          success_string: "",
        });
      } else {
        console.log("Insertion successful");
        res.render("login.ejs", {
          error_string: "",
          success_string: "Customer is successfully registered",
        }); //Replace with registration success page
      }
    }
  );
});

//BOOKING ROUTE
app.get("/book-table", (req, res) => {
  if (typeof req.session.user != "undefined" && req.session.user !== 0) {
    let sql1 =
      "SELECT * FROM booking WHERE customer_id = ? AND booking_status not like 'closed';";
    con.query(sql1, req.session.user, (err, result) => {
      if (err) throw err;
      console.log(result);
      let len = result.length;
      console.log(len);
      if (len > 0) {
        res.redirect("/dashboard");
      } else {
        let sql = "SELECT * FROM branch;";
        con.query(sql, (err, reslt) => {
          if (err) throw err;
          res.render("booking.ejs", { branch: reslt, error_string: "" });
        });
      }
    });
  } else if (req.session.user === 0) {
    res.redirect("/admin");
  } else {
    res.redirect("/login");
  }
});

app.post("/book-table", (req, res) => {
  let id = req.body.branch;
  let timeStart = req.body.timeStart;
  let timeEnd = req.body.timeEnd;
  if (id === "not-selected") {
    let sql = "SELECT * FROM branch;";
    con.query(sql, (err, result) => {
      if (err) throw err;
      res.render("booking.ejs", {
        branch: result,
        error_string: "Please select a branch",
      });
    });
  } else if (timeStart > timeEnd || time > timeStart) {
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
    getVacantTables(id, function (reslt) {
      let table = reslt;
      if (table === 0) {
        let sql = "SELECT * FROM branch;";
        con.query(sql, (err, result) => {
          if (err) throw err;
          res.render("booking.ejs", {
            branch: result,
            error_string: "Sorry, no tables available at the moment.",
          });
        });
      } else {
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
        res.redirect("/dashboard");
      }
    });
  }
});

//CUSTOMER DASHBOARD ROUTES
app.get("/dashboard", (req, res) => {
  let message;
  if (typeof req.session.user != "undefined" && req.session.user !== 0) {
    getBookings(req.session.user, function (reslt) {
      len = reslt;
      console.log("returned: " + len);
      if (len > 0) {
        let sql =
          "SELECT b.booking_no, b.customer_id, b.branch_id, b.table_no, b.time_slot_start, b.time_slot_end, b.booking_status, c.fname, br.address, br.city FROM booking b, customer c, branch br WHERE customer_id = ? AND booking_status NOT LIKE 'closed' AND c.id = b.customer_id AND b.branch_id = br.id;";
        con.query(sql, req.session.user, (err, result) => {
          if (err) throw err;
          console.log(result);
          console.log("Table is booked");
          if (result[0].booking_status === "active") {
            message = "active";
            console.log("Booking is active");
            res.render("customer.ejs", {
              cust_name: result[0].fname,
              table_no: result[0].table_no,
              branch_id: result[0].address + ", " + result[0].city,
              timeStart: result[0].time_slot_start,
              timeEnd: result[0].time_slot_end,
              status: "active",
            });
          } else {
            message = "confirmed";
            console.log("Booking is confirmed");
            res.render("customer.ejs", {
              cust_name: result[0].fname,
              table_no: result[0].table_no,
              branch_id: result[0].address + ", " + result[0].city,
              timeStart: result[0].time_slot_start,
              timeEnd: result[0].time_slot_end,
              status: "confirmed",
            });
          }
        });
      } else {
        let sql = "SELECT fname from customer WHERE id = ?";
        con.query(sql, req.session.user, (err, result) => {
          if (err) throw err;

          message = "no-booking";
          console.log("No bookings");
          res.render("customer.ejs", {
            cust_name: result[0].fname,
            status: "no-booking",
          });
        });
      }
    });
  } else if (req.session.user === 0) {
    res.redirect("/admin");
  } else {
    res.redirect("/login");
  }
});

//ADMIN ROUTES
app.get("/admin", (req, res) => {
  if (req.session.user !== "undefined" && req.session.user === 0) {
    getCount(function (reslt) {
      let count = reslt;
      console.log(count);
      res.render("admin copy.ejs", {
        cust_count: count[0].customers,
        book_count: count[0].bookings,
        branch_count: count[0].branches,
        table_count: count[0].tables,
      });
    });
  } else {
    res.redirect("/dashboard");
  }
});

app.get("/admin/customers", (req, res) => {
  if (req.session.user !== "undefined" && req.session.user === 0) {
    getCount(function (reslt) {
      let count = reslt;
      console.log(count);
      var sql = "SELECT id, fname, lname, gender, phone, email from customer;";
      con.query(sql, (err, result, fields) => {
        if (err) throw err;
        console.log(result);
        res.render("adminCustomer.ejs", {
          cust_count: count[0].customers,
          book_count: count[0].bookings,
          branch_count: count[0].branches,
          table_count: count[0].tables,
          resarr: result,
        });
      });
    });
  } else {
    res.redirect("/dashboard");
  }
});

app.get("/admin/bookings", (req, res) => {
  if (req.session.user !== "undefined" && req.session.user === 0) {
    getCount(function (reslt) {
      let count = reslt;
      var sql =
        "SELECT b.booking_no, c.fname, c.lname, br.city, br.address, b.table_no, b.booking_status FROM booking b, customer c, branch br WHERE b.customer_id = c.id AND b.branch_id = br.id ;";
      con.query(sql, (err, result, fields) => {
        if (err) throw err;
        console.log(result);
        res.render("adminBookings.ejs", {
          cust_count: count[0].customers,
          book_count: count[0].bookings,
          branch_count: count[0].branches,
          table_count: count[0].tables,
          resarr: result,
        });
      });
    });
  } else {
    res.redirect("/dashboard");
  }
});

app.get("/admin/branches", (req, res) => {
  if (req.session.user !== "undefined" && req.session.user === 0) {
    getCount(function (reslt) {
      let count = reslt;
      var sql = "SELECT * FROM branch;";
      con.query(sql, (err, result, fields) => {
        if (err) throw err;
        console.log(result);
        res.render("adminBranches.ejs", {
          cust_count: count[0].customers,
          book_count: count[0].bookings,
          branch_count: count[0].branches,
          table_count: count[0].tables,
          resarr: result,
        });
      });
    });
  } else {
    res.redirect("/dashboard");
  }
});

app.get("/admin/tables", (req, res) => {
  if (req.session.user !== "undefined" && req.session.user === 0) {
    getCount(function (reslt) {
      getTableCount(function (rest) {
        let tables = rest;
        let count = reslt;
        var sql =
          "SELECT d.table_no, br.id, br.address, br.city, d.availability FROM branch br, dining_table d WHERE d.branch_id = br.id ORDER BY br.id;";
        con.query(sql, (err, result, fields) => {
          if (err) throw err;
          console.log(result);
          res.render("adminTables.ejs", {
            cust_count: count[0].customers,
            book_count: count[0].bookings,
            branch_count: count[0].branches,
            table_count: count[0].tables,
            countarr: tables,
            resarr: result,
          });
        });
      });
    });
  } else {
    res.redirect("/dashboard");
  }
});

//ADMIN INSERT AND DELETE POST ROUTES
//BRANCHES POST ROUTES
app.post("/admin/insert-branch", (req, res) => {
  let id = req.body.id;
  let address = req.body.area;
  let city = req.body.city;
  let sql = "INSERT INTO branch (id, city, address) VALUES (?,?,?);";
  con.query(sql, [id, city, address], (err, result) => {
    if (err) res.send("Invalid input. The following error has occurred:" + err);
    else res.redirect("/admin/branches");
  });
});

app.post("/admin/delete-branch", (req, res) => {
  let id = req.body.id;
  let sql = "DELETE FROM branch WHERE id = ?";
  con.query(sql, id, (err, result) => {
    if (err) res.send("Invalid input. The following error has occurred:" + err);
    else res.redirect("/admin/branches");
  });
});

//DINING TABLES POST ROUTES
app.post("/admin/insert-table", (req, res) => {
  let id = req.body.id;
  let table_no = req.body.table_no;
  let sql =
    "INSERT INTO dining_table (table_no, branch_id, availability) VALUES (?, ?, 'V');";
  con.query(sql, [table_no, id], (err, result) => {
    if (err) res.send("Invalid input. The following error has occurred:" + err);
    else res.redirect("/admin/tables");
  });
});

app.post("/admin/delete-table", (req, res) => {
  let id = req.body.id;
  let table_no = req.body.table_no;
  let sql = "DELETE FROM dining_table WHERE table_no = ? AND branch_id = ?;";
  con.query(sql, [table_no, id], (err, result) => {
    if (err) res.send("Invalid input. The following error has occurred:" + err);
    else res.redirect("/admin/tables");
  });
});

//BOOKING AND TABLE_NO UPDATION
setInterval(() => {
  let date = new Date();
  let hours = date.getHours();
  let minutes = date.getMinutes();
  let seconds = date.getSeconds();
  if (hours < 10) {
    hours = "0" + hours;
  }
  if (minutes < 10) {
    minutes = "0" + minutes;
  }
  if (seconds < 10) {
    seconds = "0" + seconds;
  }
  time = hours + ":" + minutes + ":" + seconds;
  // console.log(time);
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
}, 30000);

//SERVER LISTENING
let port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server is listening on port " + port);
});
