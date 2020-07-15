const express = require("express");
const router = express.Router();
const Campground = require("../models/campground");
const middleware = require("../middleware");

//INDEX - Display all campgrounds
router.get("/", (req, res, next) => {
	//Get all campgrounds from DB
	Campground.find({}, (err, allcampgrounds) => {
		if(err){
			console.log(err);
		} else{
			res.render("campgrounds/index", {campgrounds: allcampgrounds});
		}
	});
});

// CREATE new campground
router.post("/",  middleware.isLoggedIn,(req, res) => {
	//get data from form and add to campgrounds array
	const name = req.body.name;
	const price = req.body.price;
	const image = req.body.image;
	const desc = req.body.description;
	const author = {
		id: req.user._id,
		username: req.user.username
	};
	const newCampground = {name: name, price: price, image: image, description: desc, author: author};
	//Create a new campground and save to DB
	Campground.create(newCampground, (err, newlyCreated) => {
		if(err){
			console.log(err);
		} else{
			//redirect back to campgrounds page
			res.redirect("/campgrounds");
		}
	});
});

// NEW Displays form to make a new campground
router.get("/new", middleware.isLoggedIn, (req, res) => {
	res.render("campgrounds/new");
});

// SHOW - shows more info about one campground
router.get("/:id", (req, res) => {
	//find the campground with provided ID
	Campground.findById(req.params.id).populate("comments").exec((err, foundCampground) => {
		if(err || !foundCampground){
		   	req.flash("error", "Campground not found");
			res.redirect("back");
		} else{
			//render show template with that campground
		   	res.render("campgrounds/show", {campground: foundCampground});
		}
	});
});

//Edit campground route
router.get("/:id/edit",  middleware.checkCampgroundOwnership, (req,res) => {
	Campground.findById(req.params.id, (err, foundCampground) => {
		res.render("campgrounds/edit", {campground: foundCampground});
	});
});
	

//Update campground route
router.put("/:id",  middleware.checkCampgroundOwnership, (req,res) => {
	//find and update the correct campground
	Campground.findByIdAndUpdate(req.params.id, req.body.campground, (err, updatedCampground) => {
		if(err){
			res.redirect("/campgrounds");
		} else{
			res.redirect("/campgrounds/" + req.params.id);
		}
	});
});

//Destroy campground router
router.delete("/:id",  middleware.checkCampgroundOwnership, async(req, res) => {
	try {
		let foundCampground = await Campground.findById(req.params.id);
		await foundCampground.remove();
		res.redirect("/campgrounds");
	} catch (error) {
		console.log(error.message);
		res.redirect("/campgrounds");
	}
});

module.exports = router;
