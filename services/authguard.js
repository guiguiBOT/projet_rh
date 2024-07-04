const userModel = require('../src/models/userModel')

const authguard = async (req, res, next) => {
    try {
        if (req.session.userId) {
            let user = await userModel.findOne({ _id: req.session.userId })
            // console.log(user); On récupère bien l'utilisateur
            next()
        } else {
            res.redirect('/login')
        }
    } catch (error) {
        res.send(error, "Erreur de connexion")
    }
}

module.exports = authguard