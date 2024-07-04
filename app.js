const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const mainRouter = require('./src/routers/mainRouter');
const userRouter = require('./src/routers/userRouter');
const clubRouter = require('./src/routers/clubRouter');
const teamRouter = require('./src/routers/teamRouter');
const memberRouter = require('./src/routers/memberRouter');
const twig = require('twig');
require('dotenv').config();
const app = express();
app.use(express.json());
app.use(express.static("./assets"));
app.use(express.urlencoded({extended: true}));
app.use(session({
    secret: 'my secret key180360',
    resave: true,
    saveUninitialized: true
}));
app.use(mainRouter);
app.use(userRouter);
app.use(clubRouter);
app.use(teamRouter);
app.use(memberRouter);

// CONFIGURATION DU PORT D'ECOUTE DU SERVEUR HTTP
app.listen(process.env.PORT, (err) => {
    if(err) {
        console.log(err);
    } else {
        console.log("HTTP server is listening");
    }
});

// Connection à la base de données à l'aide de la méthode connect()
mongoose.connect(process.env.URIBDD);

// Stockage de la connexion à la base de données dans une constante db
const db = mongoose.connection;

// Test de la connexion à la base de données
db.on('connected', () => {
    console.log("Successfully connected to the DataBase !");
})