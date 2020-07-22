const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new mongoose.Schema({
	username: { type: String, unique: true, required: true },
	password: String,
	avatar: {type: String, default: 'https://res.cloudinary.com/pxiong037/image/upload/v1595399506/default-avatar_s5siux.jpg'},
	firstName: String,
	lastName: String,
	email: { type: String, unique: true, required: true },
	resetPasswordToken: String,
	resetPasswordExpires: Date,
	isAdmin: { type: Boolean, default: false },
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);