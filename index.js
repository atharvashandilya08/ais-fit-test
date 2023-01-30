

// Importing Modules


const bcrypt = require("bcrypt"); // Importing the framework/module to hash the password

const express = require("express"); // Server Handling

const session = require("express-session"); // Session Tokens 

const GoogleStrategy = require("passport-google-oauth20").Strategy; // Google OAuth

require("dotenv").config(); // Environment Variables

const mongoose = require("mongoose"); // Database

const passport = require("passport"); // Middleware

const passportLocalMongoose = require("passport-local-mongoose"); // Database connection to the middleware

const findOrCreate = require("mongoose-findorcreate"); // Register Plugin

// Server initialization


const app = express(); // Creating the server 


// Server Settings


app.use(express.static(__dirname + "/public")); // Resource Path

app.use(session({ // Session Tokens settings
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize()); // Middleware Initialization

app.use(passport.session()); // Session token initialization


// Database


mongoose.connect(process.env.MONGOOSE_CONNECTION_URL); // Connection

const userSchema = new mongoose.Schema({ // User Schema
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String },
});

// Middleware


passport.serializeUser(function (user, done) { // Initializing Login Method

    done(null, user.id);

});

passport.deserializeUser(function (id, done) { // Initializing Logout Method

    User.findById(id, function (err, user) {

        done(err, user);

    });

});


// Database Plugins


userSchema.plugin(passportLocalMongoose); // Middleware Plugin

userSchema.plugin(findOrCreate); // Register Plugin


// Database Model


const User = mongoose.model("User", userSchema); // Database Model Creation

// Middleware Database Handling

passport.serializeUser(User.serializeUser()); // Setting login method to database

passport.deserializeUser(User.deserializeUser()); // Setting logout method to database


// Google OAuth Settings:


passport.use(new GoogleStrategy({ // Creating a new user
    clientID: process.env.GOOGLE_CLIENT_ID, // Client ID
    clientSecret: process.env.GOOGLE_CLIENT_SECRET, // Client Secret
    callbackURL: "https://ais-fit-test.onrender.com/auth/google/ais-fit-test", // Callback URL
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo" // Solving the google+ deprecation error
},

    function (accessToken, refreshToken, profile, cb) { // Register/Login method

        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
          });

    }
));


// Routes


app.get("/", (req, res) => { // Homepage

    res.send("<a href='/auth/google'>Login with google</a>") // Sending to frontend

});

app.get("/auth/google", passport.authenticate("google", { // Authorizing user: getting email and password
    scope: ["profile", "email"]
}));

app.get("/auth/google/ais-fit-test", // Authorizing user: giving user a session token
    passport.authenticate('google', { failureRedirect: '/' }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/success');

    }
);

app.get("/success", (req, res) => {

    if (req.isAuthenticated()) { // If user is logged in

        console.log(req.user);

        res.send("Name: " + req.user.name + ", Email: " + req.user.email + " <a href='/logout'>Logout</a>"); // Sends out the name and email of user

    } else { // If the user is not logged in

        res.redirect("/");

    }

});

app.get("/logout", (req, res, next) => { // Logout

    req.logout(function (err) { // Logout
        if (err) { return next(err); }
    });
    res.redirect('/'); // Redirecting back to homepage

});

app.listen(process.env.PORT, () => { console.log("Server is running now!") }); // Starts server