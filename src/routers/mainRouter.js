// const express = require('express');
const mainRouter = require('express').Router();
const userModel = require('../models/userModel');
const clubModel = require('../models/clubModel');
const teamModel = require('../models/teamModel');
const memberModel = require('../models/memberModel');
const authguard = require('../../services/authguard');

mainRouter.get('/', (req, res) => {
    try {
        res.render('loading/loading.html.twig');
    } catch (error) {
        res.send(error);
        console.log(error);
    }
})

mainRouter.get('/login', (req, res) => {
    try {
        res.render('login/login.html.twig');
    } catch (error) {
        res.send(error);
    }
})

mainRouter.get('/register', (req, res) => {
    try {
        res.render('register/register.html.twig');
    } catch (error) {
        res.send(error);
    }
})

mainRouter.get('/dashboard', authguard, async (req, res) => {
    try {
        // Optimisation : Une seule requête pour récupérer l'utilisateur et peupler sa collection de clubs
        let user = await userModel.findOne({ _id: req.session.userId }).populate('clubCollection').exec();

        // Traitement de l'image de l'utilisateur pour l'affichage
        let userDisplayablePic = user.picture.replace('assets\\', '');

        // Gestion des messages d'erreur
        let errorMessage = req.session.errorMessage;
        delete req.session.errorMessage;

        // Traitement des images des clubs pour l'affichage
        user.clubCollection.forEach(club => {
            club.clubPicture = club.clubPicture.replace('assets\\', '');
        });

        // Rendu de la vue avec les données traitées
        res.render('dashboard/dashboard.html.twig', {
            user: user,
            userDisplayablePic: userDisplayablePic,
            errorMessage: errorMessage
        });
    } catch (error) {
        console.log(error);
        res.send(error);
    }
});

// Route qui permet de rendre la page de profil
mainRouter.get('/updateprofile', authguard, async (req, res) => {
    try {
        let user = await userModel.findOne({ _id: req.session.userId })
        let userDisplayablePic = user.picture.replace('assets\\', '')
        res.render('updateprofile/updateprofile.html.twig',
            {
                user: user,
                userDisplayablePic: userDisplayablePic
            }
        )
    } catch (error) {
    }
})

// Route qui permet de rendre la page de changement de mot de passe
mainRouter.get('/changepassword', authguard, async (req, res) => {
    try {
        let user = await userModel.findOne({ _id: req.session.userId })
        let userDisplayablePic = user.picture.replace('assets\\', '')
        res.render('change_password/change_password.html.twig',
            {
                user: user,
                userDisplayablePic: userDisplayablePic
            }
        )
    } catch (error) {
        res.send(error)
    }
})

// Route qui permet de se déconnecter
mainRouter.get('/logout', (req, res) => {
    try {
        req.session.destroy()
        res.redirect('/login')
    } catch (error) {
        res.send(error)
    }
})

// Route qui permet de supprimer un utilisateur, mais nous demandons une confirmation avant de supprimer
mainRouter.get('/deleteuser', authguard, async (req, res) => {
    try {
        let user = await userModel.findOne({ _id: req.session.userId })
        let userDisplayablePic = user.picture.replace('assets\\', '')
        if (!user) {
            throw new Error('User not found');
        }
        res.render('delete_profile/delete_profile.html.twig',
            {
                user: user,
                userDisplayablePic: userDisplayablePic
            }
        )
    } catch (error) {
        res.send(error)
    }
})

// Route qui rend la page de confirmation de suppression de club
mainRouter.get('/deleteclub', authguard, async (req, res) => {
    const user = await userModel.findOne({ _id: req.session.userId })
    let userDisplayablePic = user.picture.replace('assets\\', '')
    try {
        let club = await clubModel.findOne({ _id: req.query.clubId })
        req.session.clubId = club._id
        if (!club) {
            throw new Error('Club not found');
        }
        res.render('delete_club/delete_club.html.twig',
            {
                club: club,
                user: user,
                userDisplayablePic: userDisplayablePic
            }
        )
    } catch (error) {
        res.send(error)
    }
})

// Route qui permet de rendre la page de gestion des clubs
mainRouter.get('/manageclubs', authguard, async (req, res) => {
    try {
        const user = await userModel.findOne({ _id: req.session.userId })
        let userDisplayablePic = user.picture.replace('assets\\', '')
        let errorMessage = req.session.errorMessage
        delete req.session.errorMessage
        let club = ""
        if (req.query.clubId) {
            club = await clubModel.findOne({ _id: req.query.clubId }).populate('teamCollection').exec()
        } else {
            club = await clubModel.findOne({ _id: req.session.clubId }).populate('teamCollection').exec()
        }
        let clubDisplayablePicture = club.clubPicture.replace('assets\\', '')
        req.session.clubId = club._id
        if (club.teamCollection.length > 0) {
            for (team of club.teamCollection) {
                team.teamPicture = team.teamPicture.replace('assets\\', '')
            }
            res.render('club_management/club_management.html.twig',
                {
                    user: user,
                    userDisplayablePic: userDisplayablePic,
                    club: club,
                    clubDisplayablePicture: clubDisplayablePicture,
                    errorMessage: errorMessage
                }
            )
        } else {
            res.render('club_management/club_management.html.twig',
                {
                    user: user,
                    userDisplayablePic: userDisplayablePic,
                    club: club,
                    clubDisplayablePicture: clubDisplayablePicture,
                    errorMessage: errorMessage
                }
            )
        }
    } catch (error) {
        console.log(error);
        res.send(error);
    }
})

// Route qui permet de rendre la page de modification de club
mainRouter.get('/updateclub', authguard, async (req, res) => {
    try {
        const user = await userModel.findOne({ _id: req.session.userId })
        let userDisplayablePic = user.picture.replace('assets\\', '')
        const club = await clubModel.findOne({ _id: req.query.clubId })
        let clubDisplayablePicture = club.clubPicture.replace('assets\\', '')
        req.session.clubId = club._id
        res.render('update_club/update_club.html.twig',
            {
                user: user,
                userDisplayablePic: userDisplayablePic,
                club: club,
                clubDisplayablePicture: clubDisplayablePicture
            }
        )
    } catch (error) {
        res.send(error)
    }
})

// Route qui permet de rendre la page de gestion de l'équipe
mainRouter.get('/manageteam', authguard, async (req, res) => {
    try {
        const user = await userModel.findOne({ _id: req.session.userId })
        let userDisplayablePic = user.picture.replace('assets\\', '')
        if (!req.query.teamId) {
            let team = await teamModel.findOne({ _id: req.session.teamId }).populate('memberCollection').exec()
            for (member of team.memberCollection) {
                member.memberPicture = member.memberPicture.replace('assets\\', '')
            }
            let teamDisplayablePicture = team.teamPicture.replace('assets\\', '')
            let club = await clubModel.findOne({ _id: req.session.clubId }).populate('memberCollection').exec()
            let clubDisplayablePicture = club.clubPicture.replace('assets\\', '')
            const errorMessage = req.session.errorMessage
            delete req.session.errorMessage
            req.session.clubId = club._id
            req.session.teamId = team._id
            let clubMembersInArray = []
            if (club.memberCollection.length > 0) {
                // Boucle qui créer un objet pour chaque membre du club avec des paires clé/valeur
                // de façon à pouvoir les insérer dans un tableau qu'on transmettra à la vue
                for (member of club.memberCollection) {
                    member.memberPicture = member.memberPicture.replace('assets\\', '').replace(/\\/g, '/');
                    let memberInfo = {
                        memberId: member._id,
                        memberEmail: member.memberEmail,
                        memberFirstname: member.memberFirstname,
                        memberName: member.memberName,
                        memberPicture: member.memberPicture
                    }
                    clubMembersInArray.push(memberInfo)
                }
                res.render('team_management/team_management.html.twig',
                    {
                        errorMessage: errorMessage,
                        user: user,
                        userDisplayablePic: userDisplayablePic,
                        club: club,
                        clubDisplayablePicture: clubDisplayablePicture,
                        team: team,
                        teamDisplayablePicture: teamDisplayablePicture,
                        clubMembersInArray: clubMembersInArray,
                    }
                )
            }
        } else {
            let team = await teamModel.findOne({ _id: req.query.teamId }).populate('memberCollection').exec()
            let teamDisplayablePicture = team.teamPicture.replace('assets\\', '')
            for (member of team.memberCollection) {
                member.memberPicture = member.memberPicture.replace('assets\\', '')
            }
            let club = await clubModel.findOne({ _id: team.clubId }).populate('memberCollection').exec()
            let clubDisplayablePicture = club.clubPicture.replace('assets\\', '')
            req.session.clubId = club._id
            delete req.session.teamId
            req.session.teamId = team._id
            let clubMembersInArray = []
            if (club.memberCollection.length > 0) {
                // Boucle qui créer un objet pour chaque membre du club avec des paires clé/valeur
                // de façon à pouvoir les insérer dans un tableau qu'on transmettra à la vue
                for (member of club.memberCollection) {
                    member.memberPicture = member.memberPicture.replace('assets\\', '')
                    let memberInfo = {
                        memberId: member._id,
                        memberEmail: member.memberEmail,
                        memberFirstname: member.memberFirstname,
                        memberName: member.memberName,
                        memberPicture: member.memberPicture
                    }
                    clubMembersInArray.push(memberInfo)
                }
                res.render('team_management/team_management.html.twig',
                    {
                        user: user,
                        userDisplayablePic: userDisplayablePic,
                        club: club,
                        clubDisplayablePicture: clubDisplayablePicture,
                        team: team,
                        teamDisplayablePicture: teamDisplayablePicture,
                        clubMembersInArray: clubMembersInArray,
                    }
                )
            } else {
                let errorNoMembersInClub = 'Vous devez ajouter des membres au club pour pouvoir les attribuer à une équipe';
                res.render('team_management/team_management.html.twig',
                    {
                        user: user,
                        userDisplayablePic: userDisplayablePic,
                        club: club,
                        clubDisplayablePicture: clubDisplayablePicture,
                        team: team,
                        teamDisplayablePicture: teamDisplayablePicture,
                        errorNoMembersInClub: errorNoMembersInClub,
                        clubMembersInArray: clubMembersInArray
                    }
                )
            }
        }
    } catch (error) {
        console.log(error);
        res.send(error)
    }
})

// Route qui permet de rendre la page de modification d'équipe
mainRouter.get('/updateteam', authguard, async (req, res) => {
    try {
        const user = await userModel.findOne({ _id: req.session.userId })
        let userDisplayablePic = user.picture.replace('assets\\', '')
        const club = await clubModel.findOne({ _id: req.query.clubId })
        let clubDisplayablePicture = club.clubPicture.replace('assets\\', '')
        let team = await teamModel.findOne({ _id: req.query.teamId })
        let teamDisplayablePicture = team.teamPicture.replace('assets\\', '')
        req.session.teamId = team._id
        res.render('update_team/update_team.html.twig',
            {
                user: user,
                userDisplayablePic: userDisplayablePic,
                club: club,
                clubDisplayablePicture: clubDisplayablePicture,
                team: team,
                teamDisplayablePicture: teamDisplayablePicture
            }
        )
    } catch (error) {
        res.send(error)
        console.log(error);
    }
})

// Route qui permet de rendre la page de confirmation de suppression d'équipe
mainRouter.get('/deleteteam', authguard, async (req, res) => {
    const user = await userModel.findOne({ _id: req.session.userId })
    let userDisplayablePic = user.picture.replace('assets\\', '')
    let team = await teamModel.findOne({ _id: req.query.teamId })
    try {
        req.session.teamId = team._id
        if (!team) {
            throw new Error('Team not found');
        }
        res.render('delete_team/delete_team.html.twig',
            {
                team: team,
                user: user,
                userDisplayablePic: userDisplayablePic
            }
        )
    } catch (error) {
        res.send(error)
    }
})

// Route qui permet de rendre la page de création de membre
mainRouter.get('/addmember', authguard, async (req, res) => {
    try {
        const user = await userModel.findOne({ _id: req.session.userId })
        let userDisplayablePic = user.picture.replace('assets\\', '')
        const club = await clubModel.findOne({ _id: req.query.clubId })
        let clubDisplayablePicture = club.clubPicture.replace('assets\\', '')
        if (req.query.teamId) {
            const team = await teamModel.findOne({ _id: req.query.teamId })
            let teamDisplayablePicture = team.teamPicture.replace('assets\\', '')
            res.render('member_register/member_register.html.twig',
                {
                    user: user,
                    userDisplayablePic: userDisplayablePic,
                    club: club,
                    clubDisplayablePicture: clubDisplayablePicture,
                    team: team,
                    teamDisplayablePicture: teamDisplayablePicture
                }
            )
        } else {
            res.render('member_register/member_register.html.twig',
                {
                    user: user,
                    userDisplayablePic: userDisplayablePic,
                    club: club,
                    clubDisplayablePicture: clubDisplayablePicture
                }
            )
        }
    } catch (error) {
        res.send(error)
    }
})

// Route qui permet de rendre la page de modification de membre
mainRouter.get('/updatemember', authguard, async (req, res) => {
    try {
        const user = await userModel.findOne({ _id: req.session.userId })
        let userDisplayablePic = user.picture.replace('assets\\', '')
        if (!req.query.teamId) {
            let team = await teamModel.findOne({ _id: req.session.teamId })
            let teamDisplayablePicture = team.teamPicture.replace('assets\\', '')
            let member = await memberModel.findOne({ _id: req.session.memberId })
            let memberDisplayablePicture = member.memberPicture.replace('assets\\', '')
            res.render('update_member/update_member.html.twig',
                {
                    user: user,
                    userDisplayablePic: userDisplayablePic,
                    member: member,
                    memberDisplayablePicture: memberDisplayablePicture,
                    team: team,
                    teamDisplayablePicture: teamDisplayablePicture
                }
            )
        } else { const team = await teamModel.findOne({ _id: req.query.teamId })
        let teamDisplayablePicture = team.teamPicture.replace('assets\\', '')
        const member = await memberModel.findOne({ _id: req.query.memberId })
        let memberDisplayablePicture = member.memberPicture.replace('assets\\', '')
        res.render('update_member/update_member.html.twig',
            {
                user: user,
                userDisplayablePic: userDisplayablePic,
                member: member,
                memberDisplayablePicture: memberDisplayablePicture,
                team: team,
                teamDisplayablePicture: teamDisplayablePicture
            }
        )}
    } catch (error) {
        res.send(error)
        console.log(error);
    }
})

// Route qui permet de rendre la page de visualisation des membres appartenant à l'utilisateur
mainRouter.get('/clubmembers', authguard, async (req, res) => {
    delete req.session.clubId
    delete req.session.teamId
    delete req.session.memberId
    delete req.session.errorMessage
    delete req.session.user
    const user = await userModel.findOne({ _id: req.session.userId })
    let userDisplayablePic = user.picture.replace('assets\\', '')
    const memberCollection = await memberModel.find({ userId: req.session.userId }).exec()
    for (member of memberCollection) {
        member.memberPicture = member.memberPicture.replace('assets\\', '')
    }
    try {
        if (!user) {
            throw new Error('User not found');
        }
        res.render('club_members/club_members.html.twig',
            {
                user: user,
                userDisplayablePic: userDisplayablePic,
                memberCollection: memberCollection
            }
        )
    } catch (error) {
        console.log("on est dans le catch");
        res.send(error)
        console.log(error);
        
    }
})

module.exports = mainRouter;