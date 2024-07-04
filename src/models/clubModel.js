const mongoose = require('mongoose');
const userModel = require('./userModel'); // Assurez-vous que le chemin est correct

const clubSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
    clubName: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                return v == null || v === '' || /^[\p{L}\d\s,-.]{1,70}$/u.test(v);
            },
            message: props => `${props.value} n'est pas un nom valide!`
        }
    },
    clubAdress1: {
        type: String,
        validate: {
            validator: function (v) {
                return v == null || v === '' || /^[\p{L}\d\s,-.]{1,70}$/u.test(v);
            },
            message: props => `${props.value} n'est pas une adresse valide!`
        }
    },
    clubAdress2: {
        type: String,
        validate: {
            validator: function (v) {
                return v == null || v === '' || /^[\p{L}\d\s,-.]{1,70}$/u.test(v);
            },
            message: props => `${props.value} n'est pas une adresse valide!`
        }
    },
    clubPostalCode: {
        type: String,
        validate: {
            validator: function (v) {
                return v == null || v === '' || /^[a-zA-Z0-9\s,-.]{1,12}$/.test(v);
            },
            message: props => `${props.value} n'est pas un code postal valide!`
        }
    },
    clubCity: {
        type: String,
        validate: {
            validator: function (v) {
                return v == null || v === '' || /^[\p{L}\d\s-]{1,58}$/u.test(v);
            },
            message: props => `${props.value} n'est pas un nom de ville valide!`
        }
    },
    clubPicture: {
        type: String,
        default: 'img/club_profile/default_club.webp'
    },
    teamCollection: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'teams'
    }],
    memberCollection: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'members'
    }]
})

clubSchema.post('save', async function (doc, next) {
    let user = await userModel.findOne({ _id: doc.userId });
    if (user.clubCollection.includes(doc._id)) {
        return next();
    }
    try {
        user = await userModel.findOneAndUpdate(
            { _id: doc.userId }, 
            { $push: { clubCollection: doc._id } }
        );
    } catch (error) {
        console.log(error);
    }
    next();
});

const clubModel = mongoose.model('clubs', clubSchema)
module.exports = clubModel