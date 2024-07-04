const userRouter = require('express').Router();
const userModel = require('../models/userModel');
const bcrypt = require('bcrypt');
const authguard = require('../../services/authguard');
const upload = require('../../services/multer');
const clubModel = require('../models/clubModel');
const teamModel = require('../models/teamModel');
const memberModel = require('../models/memberModel');

// Fonction de gestion des erreurs
function handleError(error) {
    let messages = []; // Initialisez messages comme un tableau vide

    // Gère les erreurs personnalisées
    if (error.passwordError) {
        messages.push(error.passwordError);
    }
    if (error.emailError) {
        messages.push(error.emailError);
    }

    // Gère les erreurs basées sur l'objet error.errors
    if (error.errors) {
        const errorMessages = Object.values(error.errors).map(val => val.message);
        messages = messages.concat(errorMessages);
    } 
    // Gère les autres types d'objets d'erreur
    else if (typeof error === 'object' && error !== null && !error.passwordError && !error.emailError) {
        const genericMessages = Object.values(error);
        messages = messages.concat(genericMessages);
    } 
    // Gère les erreurs non capturées
    else if (messages.length === 0) {
        messages.push("Un erreur inattendue s'est produite.");
    }

    return messages;
}

// Route qui permet de s'inscrire
userRouter.post('/adduser', upload.single('picture'), async (req, res) => {
    try {
        // nous verifions si l'email existe déjà dans la base de données
        let user = await userModel.findOne({ email: req.body.email });
        if (!user) {
            if (req.body.password !== req.body.passwordConfirm) {
                throw { passwordError: "Les mots de passe ne correspondent pas" };
            }
            user = userModel(req.body);
            user.validateSync();
            await user.save();
            res.redirect('/login');
        } else {
            throw { emailError: "Email déjà utilisé" };
        }
    } catch (error) {
        const messages = handleError(error);
        res.render('register/register.html.twig', {
            error: messages
        });
    }
});

// Route qui permet de se connecter
userRouter.post('/logincheck', async (req, res) => {
    try {
        let user = await userModel.findOne({ email: req.body.emailLogin });
        if (user) {
            req.session.userId = user._id;
            if (bcrypt.compareSync(req.body.passwordLogin, user.password)) {
                req.session.user = user;
                res.redirect('/dashboard');
            } else {
                throw { passwordError: "Mot de passe incorrect" };
            }
        } else {
            throw { emailError: "Email incorrect" };
        }
    }
    catch (error) {
        const messages = handleError(error);
        res.render('login/login.html.twig',
            {
                title: "Page de login",
                error: messages
            }
        );
    }
});

// Route qui permet de mettre à jour l'utilisateur dans la base de données
userRouter.post('/updateuser', authguard, upload.single('picture'), async (req, res) => {
    let user = await userModel.findOne({ _id: req.session.userId });
    let userDisplayablePic = user.picture.replace('assets\\', '');
    try {
        if (!user) {
            throw new Error('User not found');
        }
        user.firstname = req.body.firstname;
        user.name = req.body.name;
        user.age = req.body.age;
        user.adress1 = req.body.adress1;
        user.adress2 = req.body.adress2;
        user.postalcode = req.body.postalcode;
        user.city = req.body.city;
        user.country = req.body.country;
        if (req.file) {
            user.picture = req.file.path;
        }
        user.validateSync();
        await user.save();
        res.redirect('/dashboard');
    } catch (error) {
    const messages = handleError(error);
    user = await userModel.findById(req.session.userId);
    res.render('updateprofile/updateprofile.html.twig', {
        user: user,
        userDisplayablePic: userDisplayablePic,
        error: messages
    });
}
});

// Route qui permet de supprimer un utilisateur
userRouter.get('/deleteaccount', authguard, async (req, res) => {
    try {
        const user = await userModel.findById(req.session.userId);
        if (!user) {
            throw new Error('User not found');
        }
        await memberModel.deleteMany({ userId: req.session.userId });
        await teamModel.deleteMany({ userId: req.session.userId });
        await clubModel.deleteMany({ userId: req.session.userId });
        await userModel.findByIdAndDelete(req.session.userId);
        req.session.destroy();
        res.redirect('/login');
    } catch (error) {
        const messages = handleError(error);
        res.send(messages.join(', ')); 
    }
});

// Fonction de validation de mot de passe
function validatePassword(password) {
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasSixLetters = /[a-zA-Z].{5,}/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasValidLength = /^.{8,}$/.test(password);
    return hasSpecialChar && hasSixLetters && hasUpperCase && hasNumber && hasValidLength;
}

// Route qui permet de changer le mot de passe de l'utilisateur dans la base de données
userRouter.post('/changepassword', authguard, async (req, res) => {
    const user = await userModel.findById(req.session.userId);
    let userDisplayablePic = user.picture.replace('assets\\', '');
    try {
        if (!user) {
            throw { userError: "User not found" };
        }
        const passwordMatch = bcrypt.compareSync(req.body.oldPassword, user.password);
        if (!passwordMatch) {
            throw { passwordError: "Ancien mot de passe incorrect" };
        } else if (req.body.newPassword !== req.body.newPasswordConfirm) {
            throw { passwordError: "Les mots de passe ne correspondent pas" };
        } else if (!validatePassword(req.body.newPassword)) {
            throw { passwordError: "Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial" };
        } else {
            const hashedNewPassword = await bcrypt.hash(req.body.newPassword, 12);
            await userModel.findByIdAndUpdate(user._id, { password: hashedNewPassword });
            res.render('dashboard/dashboard.html.twig', {
                user: user,
                userDisplayablePic: userDisplayablePic,
                success: "Mot de passe modifié avec succès"
            });
        }
    } catch (error) {
        const messages = handleError(error);
        res.render('change_password/change_password.html.twig', {
            user: user,
            userDisplayablePic: userDisplayablePic,
            error: messages
        });
    }
});

module.exports = userRouter;