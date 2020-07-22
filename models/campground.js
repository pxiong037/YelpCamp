var mongoose = require('mongoose');

var campgroundSchema = new mongoose.Schema({
	name: String,
	image: String,
	imageId: String,
	description: String,
	cost: Number,
	location: String,
	lat: Number,
	lng: Number,
	createdAt: { type: Date, default: Date.now },
	author: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
		},
		username: String,
	},
	comments: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Comment',
		},
	],
});

const Comment = require('./comment');
campgroundSchema.pre('remove', async function () {
	await Comment.remove({
		_id: {
			$in: this.comments,
		},
	});
});

module.exports = mongoose.model('Campground', campgroundSchema);