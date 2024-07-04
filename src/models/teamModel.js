const mongoose = require('mongoose')
const validator = require('validator')
const clubModel = require('./clubModel')

// TODO Vérifer les validateurs et les messages d'erreur
const teamSchema = new mongoose.Schema({
    teamName: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                return v == null || v === '' || /^[\p{L}\d\s,-.]{1,70}$/u.test(v);
            },
            message: props => `${props.value} n'est pas un nom valide!`
        }
    },
    teamSport: {
        type: String,
        validate: {
            validator: function (v) {
                return v == null || v === '' || /^[\p{L}\d\s,-.]{1,70}$/u.test(v);
            },
            message: props => `${props.value} n'est pas un sport valide!`
        }
    },
    teamLevel: {
        type: String,
        validate: {
            validator: function (v) {
                return v == null || v === '' || /^[\p{L}\d\s,-.]{1,70}$/u.test(v);
            },
            message: props => `${props.value} n'est pas une catégorie valide!`
        }
    },
    teamCoach: {
        type: String,
    },
    teamPicture: {
        type: String,
        default: 'img/team_profile/default_team.webp'
    },
    memberCollection: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'members'
    }],
    clubId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'clubs'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    }
})

const teamModel = mongoose.model('teams', teamSchema)

module.exports = teamModel