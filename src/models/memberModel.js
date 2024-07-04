const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');

const Mixed = mongoose.Schema.Types.Mixed;

const userSchema = new mongoose.Schema({
    memberFirstname: {
        type: String,
        required: [true, 'Vous devez entrer un prénom'],
        validate: {
            validator: function (v) {
                return v == null || v === '' || /^[\p{L}\s-]{1,70}$/u.test(v);
            },
            message: props => `${props.value} n'est pas un prénom valide!`
        }
    },
    memberName: {
        type: String,
        required: [true, 'Vous devez entrer un nom de famille'],
        validate: {
            validator: function (v) {
                return v == null || v === '' || /^[\p{L}\s-]{1,70}$/u.test(v);
            },
            message: props => `${props.value} n'est pas un nom de famille valide!`
        }
    },
    memberBirthdate: {
        type: Mixed, // Changement ici
        validate: {
            validator: function (v) {
                // Permet que le champ soit vide
                if (v == null || v === '') return true;
                // Vérifie si la valeur correspond au format de date jj/mm/aaaa
                return /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/(19|20)\d\d$/.test(v);
            },
            message: props => `${props.value} n'est pas une date de naissance valide!`
        }
    },
    memberEmail: {
        type: String,
        required: [true, "'Vous devez entrer l'email du membre"],
        validate: {
            validator: function (v) {
                // Permet que le champ soit vide
                if (v == null || v === '') return true;
                return validator.isEmail(v);
            },
            message: props => `${props.value} n'est pas un email valide!`
        }
    },
    memberPassword: {
        type: String,
        required: [true, 'Vous devez renseigner un mot de passe pour le membre'],
        validate: {
            validator: function (v) {
                // Au moins un caractère spécial
                const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(v);
                // Au moins 6 lettres
                const hasSixLetters = /[a-zA-Z].{5,}/.test(v);
                // Au moins une majuscule
                const hasUpperCase = /[A-Z]/.test(v);
                // Au moins un chiffre
                const hasNumber = /\d/.test(v);
                // Longueur totale de 8 caractères ou plus
                const hasValidLength = /^.{8,}$/.test(v);
                return hasSpecialChar && hasSixLetters && hasUpperCase && hasNumber && hasValidLength;
            },
            message: props => `Ce mot de passe n'est pas valide, il doit comporter au moins 8 caractères, une majuscule, un chiffre et un caractère spécial !`
        }
    },
    memberPhone: {
        type: String,
        validate: {
            validator: function (v) {
                return v == null || v === '' || /^\d{10}$/.test(v);
            },
            message: props => `${props.value} n'est pas un numéro de téléphone valide!`
        }
    },
    memberPicture: {
        type: String,
        default: 'img/uploads/default_profile_pic02.webp'
    },
    memberRole: {
        type: String,
        default: 'member'
    },
    clubCollection: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'clubs'
    }],
    teamCollection: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'teams'
    }],
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'teams'
    },
    clubId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'clubs'
    }
})

userSchema.pre('save', async function (next) {
    const user = this;
    if (user.isModified('memberPassword')) {
        user.memberPassword = await bcrypt.hash(user.memberPassword, 12);
    }
    next();
})

const userModel = mongoose.model('members', userSchema)

module.exports = userModel