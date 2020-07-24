var express = require('express');
var router = express.Router();
var Campground = require('../models/campground');
var Comment = require('../models/comment');
var middleware = require('../middleware');
var NodeGeocoder = require('node-geocoder');
var multer = require('multer');
var storage = multer.diskStorage({
	filename: function (req, file, callback) {
		callback(null, Date.now() + file.originalname);
	},
});
var imageFilter = function (req, file, cb) {
	// accept image files only
	if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
		return cb(new Error('Only image files are allowed!'), false);
	}
	cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter });

var cloudinary = require('cloudinary');
cloudinary.config({
	cloud_name: 'pxiong037',
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

var options = {
	provider: 'google',
	httpAdapter: 'https',
	apiKey: process.env.GEOCODER_API_KEY,
	formatter: null,
};

var geocoder = NodeGeocoder(options);
var { isLoggedIn, checkUserCampground, checkUserComment, isAdmin, isSafe } = middleware; // destructuring assignment

// Define escapeRegex function for search feature
function escapeRegex(text) {
	return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

//INDEX - show all campgrounds
router.get("/", function(req, res){
  if(req.query.search && req.xhr) {
      const regex = new RegExp(escapeRegex(req.query.search), 'gi');
      // Get all campgrounds from DB
      Campground.find({name: regex}, function(err, allCampgrounds){
         if(err){
            console.log(err);
         } else {
            res.status(200).json(allCampgrounds);
         }
      });
  } else {
      // Get all campgrounds from DB
      Campground.find({}, function(err, allCampgrounds){
         if(err){
             console.log(err);
         } else {
            if(req.xhr) {
              res.json(allCampgrounds);
            } else {
              res.render("campgrounds/index",{campgrounds: allCampgrounds, page: 'campgrounds'});
            }
         }
      });
  }
});

//CREATE - add new campground to DB
router.post('/', isLoggedIn, upload.single('image'), function (req, res) {
	geocoder.geocode(req.body.location, function (err, data) {
		if (err || data.status === 'ZERO_RESULTS') {
			req.flash('error', 'Invalid address');
			return res.redirect('back');
		}
		var lat = data[0].latitude;
		var lng = data[0].longitude;
		var location = data[0].formattedAddress;
		// Create a new campground and save to DB
		cloudinary.v2.uploader.upload(req.file.path, function (error, result) {
			if (error) {
				console.log(error);
				req.flash('error', 'Something went wrong with the image upload');
				return res.redirect('back');
			}
			// add cloudinary url for the image to the campground object under image property
			let image = result.secure_url;
			// add image's public_id to campground object
			let imageId = result.public_id;
			// add author to campground
			var author = {
				id: req.user._id,
				username: req.user.username,
			};

			var name = req.body.name;
			var desc = req.body.description;
			var cost = req.body.cost;

			var newCampground = {
				name: name,
				image: image,
				imageId: imageId,
				description: desc,
				cost: cost,
				author: author,
				location: location,
				lat: lat,
				lng: lng,
			};

			Campground.create(newCampground, function (err, campground) {
				if (err) {
					req.flash('error', err.message);
					return res.redirect('back');
				}
				res.redirect('/campgrounds/' + campground.id);
			});
		});
	});
});

//NEW - show form to create new campground
router.get('/new', isLoggedIn, function (req, res) {
	res.render('campgrounds/new');
});

// SHOW - shows more info about one campground
router.get('/:id', function (req, res) {
	//find the campground with provided ID
	Campground.findById(req.params.id)
		.populate('comments')
		.exec(function (err, foundCampground) {
			if (err || !foundCampground) {
				console.log(err);
				req.flash('error', 'Sorry, that campground does not exist!');
				return res.redirect('/campgrounds');
			}
			//console.log(foundCampground)
			//render show template with that campground
			res.render('campgrounds/show', { campground: foundCampground });
		});
});

// EDIT - shows edit form for a campground
router.get('/:id/edit', isLoggedIn, checkUserCampground, function (req, res) {
	//render edit template with that campground
	res.render('campgrounds/edit', { campground: req.campground });
});

// PUT - updates campground in the database
router.put('/:id', upload.single('image'), function (req, res) {
	geocoder.geocode(req.body.location, function (err, data) {
		if (err || data.status === 'ZERO_RESULTS') {
			req.flash('error', 'Invalid address');
			return res.redirect('back');
		}
		var lat = data[0].latitude;
		var lng = data[0].longitude;
		var location = data[0].formattedAddress;

		Campground.findById(req.params.id, async function (err, campground) {
			if (err) {
				req.flash('error', err.message);
				res.redirect('back');
			} else {
				if (req.file) {
					try {
						await cloudinary.v2.uploader.destroy(campground.imageId);
						var result = await cloudinary.v2.uploader.upload(req.file.path);
						campground.imageId = result.public_id;
						campground.image = result.secure_url;
					} catch (err) {
						req.flash('error', err.message);
						return res.redirect('back');
					}
				}

				campground.name = req.body.name;
				campground.description = req.body.description;
				campground.cost = req.body.cost,
				campground.location = location,
				campground.lat = lat,
				campground.lng = lng,
				campground.save();
				req.flash('success', 'Successfully Updated!');
				res.redirect('/campgrounds/' + campground._id);
			}
		});
	});
});

// DELETE - removes campground and its comments from the database
router.delete('/:id', isLoggedIn, checkUserCampground, function (req, res) {
	Comment.deleteOne(
		{
			_id: {
				$in: req.campground.comments,
			},
		},
		function (err) {
			if (err) {
				req.flash('error', err.message);
				res.redirect('/');
			} else {
				Campground.findById(req.params.id, async function (err, campground) {
					if (err) {
						req.flash('error', err.message);
						return res.redirect('back');
					}
					try {
						await cloudinary.v2.uploader.destroy(campground.imageId);
						campground.remove();
						req.flash('success', 'Campground deleted successfully!');
						res.redirect('/campgrounds');
					} catch (err) {
						if (err) {
							req.flash('error', err.message);
							return res.redirect('back');
						}
					}
				});
			}
		}
	);
});

module.exports = router;