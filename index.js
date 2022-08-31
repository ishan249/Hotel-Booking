const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const ejs = require("ejs");
const nodemailer = require("nodemailer");
console.log("here-1");
const MongoClient = require("mongodb").MongoClient;

const assert = require("assert");
const mongoose = require("mongoose");
app.set('view engine', 'ejs');
console.log("here1");
const DB = 'mongodb+srv://IshanAdmin:IshanAd123@mycluster.1jmr5.mongodb.net/HotelBookings?retryWrites=true&w=majority'

const client = new MongoClient(DB);

mongoose.connect(DB, {
    useNewUrlParser: true,
}).then(() => {
    console.log("connection established with altas");
}).catch((err) => console.log(err));
app.use(express.static("public"));
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
    checkInDate: Date,
    checkOutDate: Date,
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
        pass: "fozmmirlqtgwbafk"
    },
    tls: {
        rejectUnauthorized: false
    }
});


app.post("/RoomBooking", async function (req, res) {
  const dataBase = client.db("HotelBookings");
  const coll = dataBase.collection("users");
  const queryCount = await coll.countDocuments({});
if (queryCount<15) {
    var mailOptions = {
        from: "ishanp2022@gmail.com",
        to: req.body.Email,
        subject: "Hotel Booking Successfull",
        text: "Booking is successfull.You can check out your bookings and details in My Bookings section.Enjoy the stay"
    }
    var userData = new user({
        name: req.body.Name,
        email: req.body.Email,
        checkInDate: req.body.checkInDate,
        checkOutDate: req.body.checkOutDate,
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
  if (adminUser == "admin" && adminPass == "admin123") {
    const dataBase = client.db("HotelBookings");
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
