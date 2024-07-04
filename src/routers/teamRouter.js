const teamRouter = require('express').Router()
const userModel = require('../models/userModel')
const clubModel = require('../models/clubModel')
const teamModel = require('../models/teamModel')
const memberModel = require('../models/memberModel')
const authguard = require('../../services/authguard')
const upload = require('../../services/multer')

// Route pour ajouter une équipe
teamRouter.post('/addteam', upload.single('picture'), authguard, async (req, res) => {
    const user = await userModel.findOne({ _id: req.session.userId })
    const club = await clubModel.findOne({ _id: req.body.clubId })
    req.session.clubId = req.body.clubId
    try {
        // On vérifie si l'équipe existe déjà dans la base de données
        let team = await teamModel.findOne({ teamName: req.body.teamName, clubId: req.body.clubId })
        if (team) {
            throw { teamError: "Cette équipe existe déjà" }
        } else {
            team = new teamModel()
            team.teamName = req.body.teamName
            team.teamSport = req.body.teamSport
            team.teamLevel = req.body.teamLevel
            team.teamCoach = req.body.teamCoach
            team.clubId = req.body.clubId
            team.userId = req.session.userId
            if (req.file) {
                team.teamPicture = req.file.path
            }
            team.validateSync()
            await team.save()
            // TODO ajouter une condition si l'id de l'équipe est déjà dans teamCollection du club
            // pour gérer la modification de l'équipe plus tard sans créer de doublon
            await clubModel.findByIdAndUpdate(
                req.body.clubId,
                { $push: { teamCollection: team._id } }
            )
            await userModel.findByIdAndUpdate(
                req.session.userId,
                { $push: { teamCollection: team._id } }
            )
            res.redirect('/manageclubs')
        }
    } catch (e) {
        console.log(e);
        req.session.errorMessage = "Cette équipe existe déjà"
        res.redirect('/manageclubs')
    }
})

// Route pour modifier une équipe
teamRouter.post('/updateteam', upload.single('picture'), authguard, async (req, res) => {
    const user = await userModel.findOne({ _id: req.session.userId })
    const club = await clubModel.findOne({ _id: req.session.clubId })
    let team = await teamModel.findOne({ _id: req.session.teamId })
    try {
        team.teamName = req.body.teamName
        team.teamSport = req.body.teamSport
        team.teamLevel = req.body.teamLevel
        if (req.file) {
            team.teamPicture = req.file.path
        }
        team.validateSync()
        await team.save()
        res.redirect('/manageclubs')
    } catch (e) {
        console.log(e);
        res.redirect('/manageclubs')
    }
})

// Route pour supprimer une équipe
teamRouter.post('/eraseteam', authguard, async (req, res) => {
    const teamId = req.body.teamId;
    req.session.teamId = null;
    try {
        const team = await teamModel.findById(teamId);
        if (!team) {
            throw new Error('Team not found');
        }
        // Supprimer l'équipe
        await teamModel.findByIdAndDelete(teamId);
        // Supprimer l'équipe de la collection de l'utilisateur
        await userModel.updateOne(
            { _id: req.session.userId },
            { $pull: { teamCollection: teamId } }
        )
        // Supprimer l'équipe de la collection du club
        await clubModel.updateOne(
            { _id: team.clubId },
            { $pull: { teamCollection: teamId } }
        )
        // Supprimer l'équipe de la collection des membres
        await memberModel.updateOne(
            { teamCollection: teamId },
            { $pull: { teamCollection: teamId } }
        )
        res.redirect('/manageclubs');
    } catch (error) {
        res.send(error);
    }
})

module.exports = teamRouter