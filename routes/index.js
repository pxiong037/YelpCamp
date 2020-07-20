const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user");

//root route
router.get("/", (req, res, next) => {
	res.render("landing");
});


//===================
// Auth Routes
//===================

// show register form
router.get("/register", function(req, res){
   res.render("register", {page: 'register'}); 
});

//handle signup logic
router.post("/register", (req,res) => {
	const newUser = new User({username: req.body.username});
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.render("register", {error: err.message});
        }
        passport.authenticate("local")(req, res, function(){
           req.flash("success", "Successfully Signed Up! Nice to meet you " + req.body.username);
           res.redirect("/campgrounds"); 
        });
    });
});

//show login form
router.get("/login", function(req, res){
   res.render("login", {page: 'login'}); 
});

//handling login logic
router.post("/login", passport.authenticate("local", 
	{
		successRedirect: "/campgrounds",
		failureRedirect: "/login"
	}), (req,res) => {
});

// logout
router.get("/logout", (req, res) => {
	req.logout();
	req.flash("success", "Logged you out!");
	res.redirect("/campgrounds");
});

module.exports = router;
