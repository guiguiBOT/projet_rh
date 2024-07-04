const clubRouter = require('express').Router()
const userModel = require('../models/userModel')
const clubModel = require('../models/clubModel')
const teamModel = require('../models/teamModel')
const memberModel = require('../models/memberModel')
const authguard = require('../../services/authguard')
const upload = require('../../services/multer')

// TODO: gérer les erreur de validation renvoyées par le modèle clubModel cf chat copilot
clubRouter.post('/addclub', upload.single('picture'), authguard, async (req, res) => {
    const user = await userModel.findOne({ _id: req.session.userId })
    try {
        // On vérifie si le club existe déjà dans la base de données
        let club = await clubModel.findOne({ clubName: req.body.clubName, userId: req.session.userId })
        if (club) {
            throw { clubError: "Ce club existe déjà" }
        } else {
            club = new clubModel()
            club.clubName = req.body.clubName
            club.clubAdress1 = req.body.clubAdress1
            club.clubAdress2 = req.body.clubAdress2
            club.clubPostalCode = req.body.clubPostalCode
            club.clubCity = req.body.clubCity
            if (req.file) {
                club.clubPicture = req.file.path
            }
            club.userId = req.session.userId
            club.validateSync()
            await club.save()
            res.redirect('/dashboard')
        }
    } catch (e) {
        console.log(e);
        req.session.errorMessage =
            res.redirect('/dashboard')
    }
})

// Route qui permet de supprimer un club
clubRouter.post('/eraseclub', authguard, async (req, res) => {
    const clubId = req.session.clubId;
    req.session.clubId = null;
    try {
        const club = await clubModel.findById(clubId);
        if (!club) {
            throw new Error('Club not found');
        }
        // Récupérer les membres du club
        const clubMemberCollection = await memberModel.find({ clubId: clubId });
        // Supprimer les membres du club
        await memberModel.deleteMany({ clubId: clubId });
        // Extraire les ID des membres pour les retirer de la collection de l'utilisateur
        const memberIds = clubMemberCollection.map(member => member._id);
        // Récupérer les équipes du club
        const clubTeamCollection = await teamModel.find({ clubId: clubId });
        // Supprimer les équipes du club
        await teamModel.deleteMany({ clubId: clubId });
        // Supprimer le club
        await clubModel.findByIdAndDelete(clubId);
        // Extraire les ID des équipes pour les retirer de la collection de l'utilisateur
        const teamIds = clubTeamCollection.map(team => team._id);
        // Mettre à jour la collection de l'utilisateur pour retirer les équipes supprimées
        // Mettre à jour la collection de l'utilisateur pour retirer les équipes supprimées
        await userModel.updateOne(
            { _id: req.session.userId },
            { $pullAll: { teamCollection: teamIds } }
        );
        // Retirer l'ID du club de la collection de l'utilisateur
        await userModel.updateOne(
            { _id: req.session.userId },
            { $pull: { clubCollection: clubId } }
        );
        // Retirer les ID des membres de la collection de l'utilisateur
        await userModel.updateOne(
            { _id: req.session.userId },
            { $pullAll: { memberCollection: memberIds } }
        );
        res.redirect('/dashboard');
    } catch (error) {
        res.send(error);
    }
})

// Route qui permet de mettre à jour un club
clubRouter.post('/updateclub', upload.single('picture'), authguard, async (req, res) => {
    const clubId = req.session.clubId
    try {
        const club = await clubModel.findOne({ _id: clubId })
        if (!club) {
            throw new Error('Club not found');
        }
        club.clubName = req.body.clubName
        club.clubAdress1 = req.body.clubAdress1
        club.clubAdress2 = req.body.clubAdress2
        club.clubPostalCode = req.body.clubPostalCode
        club.clubCity = req.body.clubCity
        if (req.file) {
            club.clubPicture = req.file.path
        }
        club.validateSync()
        await club.save()
        res.redirect('/dashboard')
    } catch (error) {
        res.send(error)
    }
})

module.exports = clubRouter