const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const ejs = require("ejs");
const path = require("path");
const nodemailer = require("nodemailer");
require("dotenv").config()
const MongoClient = require("mongodb").MongoClient;
const assert = require("assert");
const mongoose = require("mongoose");
app.set('views',path.join(__dirname,'views'));
app.set('view engine', 'ejs');

const DB = process.env.MONGO_URL

const client = new MongoClient(DB);

mongoose.connect(DB, {
    useNewUrlParser: true,
}).then(() => {
    console.log("connection established with altas");
}).catch((err) => console.log(err));
app.use(express.static(path.join(__dirname,"public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/", function (req, res) {
    res.sendFile(__dirname + "/Homepage.html");
});
app.get("/RoomBooking", function (req, res) {
    res.sendFile(__dirname + "/RoomBookingPage.html");
});
app.get("/showBookings", function (req, res) {
    res.sendFile(__dirname + "/myBookings.html");
});
app.get("/goToAdminSection",function(req,res){
  res.sendFile(__dirname + "/adminLogin.html");

});
const bookingSchema = new mongoose.Schema({
    name: String,
    email: String,
    checkInDate: String,
    checkOutDate: String,
    phoneNumber: Number,
    noOfPeople: Number,
    typeOfRoom: String,
    BookingId : Number
});
let user = mongoose.model("user", bookingSchema);
smtpProtocol = nodemailer.createTransport({

    service: "gmail",
    auth: {
        user: "ishanp2022@gmail.com",
        pass: process.env.EMAIL_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    }
});


app.post("/RoomBooking", async function (req, res) {
  const dataBase = client.db("HotelBookings");
  const coll = dataBase.collection("users");
  const queryCount = await coll.countDocuments({});
  const inDate = new Date(req.body.checkInDate);
  const cinDate = inDate.toDateString();
  const outDate = new Date(req.body.checkOutDate);
  const coutDate = outDate.toDateString();
if (queryCount<15) {
    const username = req.body.Name;
    const bookingId = req.body.bookingID;
    const tempPath = __dirname+"/views/bookingMail.ejs";
    const data =  await ejs.renderFile((tempPath),{'userName': username,'bookId':bookingId});
    var mailOptions = {
        from: "ishanp2022@gmail.com",
        to: req.body.Email,
        subject: "Hotel Booking Successfull",
        html:data
    }
    var userData = new user({
        name: req.body.Name,
        email: req.body.Email,
        checkInDate: cinDate,
        checkOutDate: coutDate,
        phoneNumber: req.body.phoneNumber,
        noOfPeople: req.body.noOfPeople,
        typeOfRoom: req.body.typeOfRoom,
        BookingId : req.body.bookingID
    });

    smtpProtocol.sendMail(mailOptions, function (err, success) {
        if (err) {
            console.log(err);
        }
        else {
            console.log("");
        }
        smtpProtocol.close();
    });



    userData.save()
        .then(item => {
            res.sendFile(__dirname + "/BookingSuccessfull.html");
        })
        .catch(err => {
            res.sendFile(__dirname + "/Error404.html");
        });
      }

    else{
      res.sendFile(__dirname + "/notAvailable.html");
    }




});

app.post("/CancelBooking", function (req, res) {
    const Id = req.body.Bookingid;

    user.deleteOne({ BookingId : Id}).then(item => {
        res.sendFile(__dirname + "/BookingCancelled.html");
    }).catch((e) => {
        res.sendFile(__dirname + "/Error404.html");
    });
});

app.post("/showBookings",async function (req, res) {
    const number = req.body.Email;
    const dataBase = client.db("HotelBookings");
    const coll = dataBase.collection("users");
    const queryCount = await coll.countDocuments({ email: number});
    
    coll.find({ email: number }).toArray(function (err, userDetails) {
        assert.equal(err, null);
        res.render('myBookings', { 'hotelusers': userDetails,'totalBookings':queryCount});
    });
});

app.post("/goToAdminSection",async function(req,res){
  const adminPass = req.body.adminPassword;
  const adminUser = req.body.adminUsername;
  const dataBase = client.db("HotelBookings");
    const coll = dataBase.collection("admins");
  const admin = await coll.findOne({username:adminUser});
    if (adminUser == admin.username && adminPass == admin.password) {
     const coll = dataBase.collection("users");
     const queryCount = await coll.countDocuments({});
     const queriesRemaining = 15 - queryCount;
     coll.find().toArray(function (err, userDetails) {
         assert.equal(err, null);
         res.render('AdminHomepage', { 'hotelusers': userDetails, 'totalBookings': queryCount, 'availableBookings':queriesRemaining});
     });
   }
  
 
});
app.post("/showAllBookings", function(req,res){
  const number = req.body.Email;
  const dataBase = client.db("HotelBookings");
  const coll = dataBase.collection("users");
  coll.find({ email: number }).toArray(function (err, userDetails) {
      assert.equal(err, null);
      res.render('AdminSearch', { 'hotelusers': userDetails})
  });
});

client.connect(function (err) {
    assert.equal(null, err);
    app.listen(3008, function () {
        console.log("server is listening");
    });
});
