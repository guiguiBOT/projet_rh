const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');

const Mixed = mongoose.Schema.Types.Mixed;

const userSchema = new mongoose.Schema({
    firstname: {
        type: String,
        required: [true, 'Vous devez entrer un prénom'],
        validate: {
            validator: function (v) {
                return v == null || v === '' || /^[\p{L}\s-]{1,70}$/u.test(v);
            },
            message: props => `${props.value} n'est pas un prénom valide!`
        }
    },
    name: {
        type: String,
        validate: {
            validator: function (v) {
                return v == null || v === '' || /^[\p{L}\s-]{1,70}$/u.test(v);
            },
            message: props => `${props.value} n'est pas un nom de famille valide!`
        }
    },
    age: {
        type: Mixed, // Changement ici
        validate: {
            validator: function (v) {
                // Vérifie si la valeur est null, vide, ou un nombre valide dans les limites attendues
                if (v == null || v === '') return true;
                const num = Number(v);
                return !isNaN(num) && isFinite(v) && /^\d{1,3}$/.test(num);
            },
            message: props => `${props.value} n'est pas un âge valide!`
        }
    },
    email: {
        type: String,
        required: [true, 'Vous devez entrer votre email'],
        validate: {
            validator: function (v) {
                return validator.isEmail(v);
            },
            message: props => `${props.value} n'est pas un email valide!`
        }
    },
    password: {
        type: String,
        required: [true, 'Vous devez entrer un mot de passe'],
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
    passwordConfirm: {
        type: String,
    },
    adress1: {
        type: String,
        validate: {
            validator: function (v) {
                return v == null || v === '' || /^[\p{L}\d\s,-.]{1,70}$/u.test(v);
            },
            message: props => `${props.value} n'est pas une adresse valide!`
        }
    },
    adress2: {
        type: String,
        validate: {
            validator: function (v) {
                return v == null || v === '' || /^[\p{L}\d\s,-.]{1,70}$/u.test(v);
            },
            message: props => `${props.value} n'est pas une adresse valide!`
        }
    },
    postalcode: {
        type: String,
        validate: {
            validator: function (v) {
                return v == null || v === '' || /^[a-zA-Z0-9\s,-.]{1,12}$/.test(v);
            },
            message: props => `${props.value} n'est pas un code postal valide!`
        }
    },
    city: {
        type: String,
        validate: {
            validator: function (v) {
                return v == null || v === '' || /^[\p{L}\d\s-]{1,58}$/u.test(v);
            },
            message: props => `${props.value} n'est pas un nom de ville valide!`
        }
    },
    country: {
        type: String,
        validate: {
            validator: function (v) {
                return v == null || v === '' || /^[\p{L}\d\s-]{1,168}$/u.test(v);
            },
            message: props => `${props.value} n'est pas un nom de pays valide!`
        }
    },
    picture: {
        type: String,
        default: 'img/uploads/default_profile_pic02.webp'
    },
    clubCollection: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'clubs'
    }],
    teamCollection: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'teams'
    }],
    memberCollection: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'members'
    }],
});

userSchema.pre('save', async function (next) {
    // console.log(this.password);
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 12);
        this.passwordConfirm = undefined;
    }
    next();
});

const userModel = mongoose.model('users', userSchema);
module.exports = userModel;