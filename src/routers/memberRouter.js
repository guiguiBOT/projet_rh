const memberRouter = require('express').Router()
const userModel = require('../models/userModel')
const clubModel = require('../models/clubModel')
const teamModel = require('../models/teamModel')
const memberModel = require('../models/memberModel')
const authguard = require('../../services/authguard')
const upload = require('../../services/multer')

// function handleError(error) {
//     let messages = []; // Initialisez messages comme un tableau vide

//     // Gère les erreurs personnalisées
//     if (error.passwordError) {
//         messages.push(error.passwordError);
//     }
//     if (error.emailError) {
//         messages.push(error.emailError);
//     }

//     // Gère les erreurs basées sur l'objet error.errors
//     if (error.errors) {
//         const errorMessages = Object.values(error.errors).map(val => val.message);
//         messages = messages.concat(errorMessages);
//     } 
//     // Gère les autres types d'objets d'erreur
//     else if (typeof error === 'object' && error !== null && !error.passwordError && !error.emailError) {
//         const genericMessages = Object.values(error);
//         messages = messages.concat(genericMessages);
//     } 
//     // Gère les erreurs non capturées
//     else if (messages.length === 0) {
//         messages.push("Un erreur inattendue s'est produite.");
//     }

//     return messages;
// }

// Route pour ajouter un membre au club
memberRouter.post('/addmember', upload.single('picture'), authguard, async (req, res) => {
    const user = await userModel.findOne({ _id: req.session.userId })
    let userDisplayablePic = user.picture.replace('assets\\', '')
    const club = await clubModel.findOne({ _id: req.body.clubId })
    req.session.clubId = req.body.clubId
    req.session.teamId = req.body.teamId
    // console.log(req.body);
    try {
        // On vérifie si le membre existe déjà dans la base de données
        let member = await memberModel.findOne({ memberEmail: req.body.memberEmail })
        if (member) {
            throw { memberError: "Ce membre existe déjà" }
        } else {
            if (req.body.memberPassword !== req.body.memberPasswordConfirm) {
                throw { memberError: "Les mots de passe ne correspondent pas" }
            }
            member = new memberModel()
            member.memberFirstname = req.body.memberFirstname
            member.memberName = req.body.memberName
            member.memberBirthdate = req.body.memberBirthdate
            member.memberEmail = req.body.memberEmail
            member.memberPassword = req.body.memberPassword
            member.memberPhone = req.body.memberPhone
            member.memberRole = req.body.memberRole
            member.userId = req.session.userId
            member.clubId = req.session.clubId
            member.clubCollection.push(req.body.clubId)
            if (req.file) {
                member.memberPicture = req.file.path
            }
            await member.save()
            member.validateSync()
            await userModel.findByIdAndUpdate(
                req.session.userId,
                { $push: { memberCollection: member._id } }
            )
            await clubModel.findByIdAndUpdate(
                req.body.clubId,
                { $push: { memberCollection: member._id } }
            )
            res.redirect('/dashboard')
        }
    } catch (error) {
        // const messages = handleError(error);
        console.log(error);
        req.session.errorMessage = error.memberError
        res.render('member_register/member_register.html.twig', {
            user: user,
            club: club,
            userDisplayablePic: userDisplayablePic,
            error: error.errors,
            errorMessage: error.memberError
        })
    }
})

// Route pour modifier un membres du club
memberRouter.post('/updatemember', upload.single('picture'), authguard, async (req, res) => {
    const user = await userModel.findOne({ _id: req.session.userId })
    let userDisplayablePic = user.picture.replace('assets\\', '')
    const club = await clubModel.findOne({ _id: req.session.clubId })
    const team = await teamModel.findOne({ _id: req.session.teamId })
    let member = await memberModel.findOne({ _id: req.body.memberId })
    req.session.memberId = req.body.memberId
    try {
        member.memberFirstname = req.body.memberFirstname
        member.memberName = req.body.memberName
        member.memberBirthdate = req.body.memberBirthdate
        member.memberPhone = req.body.memberPhone
        member.memberRole = req.body.memberRole
        if (req.file) {
            member.memberPicture = req.file.path
        }
        member.validateSync()
        await member.save()
        res.redirect('/manageteam')
    } catch (error) {
        member = await memberModel.findOne({ _id: req.body.memberId })
        res.render('update_member/update_member.html.twig', {
            member: member,
            club: club,
            team: team,
            user: user,
            userDisplayablePic: userDisplayablePic,
            error: error.errors
        })
    }
})

// Route pour ajouter un membre du club à une équipe du club en ajoutant l'id de l'équipe dans le tableau teamCollection du membre
// et en ajoutant l'id du membre dans le tableau memberCollection de l'équipe
memberRouter.post('/memberselectteam', authguard, async (req, res) => {
    const user = await userModel.findOne({ _id: req.session.userId })
    const club = await clubModel.findOne({ _id: req.body.clubId })
    const team = await teamModel.findOne({ _id: req.body.teamId })
    const member = await memberModel.findOne({ _id: req.body.selectedMember })
    const memberAlreadyInTeam = await teamModel.findOne({ _id: team._id, memberCollection: member._id })
    try {
        if (memberAlreadyInTeam) {
            throw { memberError: "Ce membre est déjà dans l'équipe" }
        } else if (club.memberCollection.length === 0) {
            throw { memberError: "Vous devez d'abord ajouter des membres au club" }
        } else {
            await teamModel.findByIdAndUpdate(
                req.body.teamId,
                { $push: { memberCollection: req.body.selectedMember } }
            )
            await memberModel.findByIdAndUpdate(
                req.body.selectedMember,
                { $push: { teamCollection: req.body.teamId } }
            )
            res.redirect('/manageteam')
        }
    } catch (error) {
        req.session.errorMessage = error.memberError
        res.redirect('/manageteam')
    }
})

// Route pour retirer un membre du club d'une équipe du club en retirant l'id de l'équipe du tableau teamCollection du membre
// et en retirant l'id du membre du tableau memberCollection de l'équipe
memberRouter.post('/withdrawmember', authguard, async (req, res) => {
    const user = await userModel.findOne({ _id: req.session.userId })
    const club = await clubModel.findOne({ _id: req.body.clubId })
    const team = await teamModel.findOne({ _id: req.body.teamId })
    const member = await memberModel.findOne({ _id: req.body.selectedMember })
    try {
        await teamModel.findByIdAndUpdate(
            req.body.teamId,
            { $pull: { memberCollection: req.body.memberId } }
        )
        await memberModel.findByIdAndUpdate(
            req.body.memberId,
            { $pull: { teamCollection: req.body.teamId } }
        )
        res.redirect('/manageteam')
    } catch (error) {
        req.session.errorMessage = error.memberError
        res.redirect('/manageteam')
    }
})

// Route pour supprimer un membre
memberRouter.post('/deletemember', authguard, async (req, res) => {
    const user = await userModel.findOne({ _id: req.session.userId })
    const userDisplayablePic = user.picture.replace('assets\\', '')
    try {
        if (!user) {
            throw { memberError: "Utilisateur introuvable" }
        } else {
            await userModel.findByIdAndUpdate(
                req.session.userId,
                { $pull: { memberCollection: req.body.memberId } }
            )
            await teamModel.findOneAndUpdate(
                { memberCollection: req.body.memberId },
                { $pull: { memberCollection: req.body.memberId } }
            )
            await clubModel.findOneAndUpdate(
                { memberCollection: req.body.memberId },
                { $pull: { memberCollection: req.body.memberId } }
            )
            await memberModel.findByIdAndDelete(req.body.memberId)
            const memberCollection = await memberModel.find({ userId: req.session.userId }).exec()
            for (member of memberCollection) {
                member.memberPicture = member.memberPicture.replace('assets\\', '')
            }
            res.render('club_members/club_members.html.twig', {
                user: user,
                userDisplayablePic: userDisplayablePic,
                memberCollection: memberCollection
            }
            )
        }
    } catch (error) {
        req.session.errorMessage = error.memberError
        res.redirect('/deletemember')
    }
})

module.exports = memberRouter