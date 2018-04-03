import express from 'express';
import {getPlayerStat} from './db'

const app = express();
const api = express.Router();

api
    .get('/', (req, res) => {
        res.json({hello: 'world'});
    })
    .get('/players/:id', (req, res) => {
        getPlayerStat(req.params.id)
            .then(player => res.json(player))
            .catch(e => res.status(404).end())
        ;
    })
    // TODO top du jour
    // TODO top de la semaine
    // TODO top du mois
    // TODO -> d'accord sur quel classement ? on en a 9...
;


app.use('/api', api);

app.listen(3000,
    () => {console.log('server listen')});
