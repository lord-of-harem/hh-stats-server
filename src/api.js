import express from 'express';
import cors from 'cors';
import {getPlayerStat, getTop} from './db'

const app = express();
const api = express.Router();

app.use(cors());

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
    .get('/top/day', (req, res) => {
        getTop('day')
            .then(data => res.json(data))
            .catch(e => res.status(500).end(JSON.stringify(e)))
    })
    .get('/top/week', (req, res) => {
        getTop('week')
            .then(data => res.json(data))
            .catch(e => res.status(500).end(JSON.stringify(e)))
    })
    .get('/top/month', (req, res) => {
        getTop('month')
            .then(data => res.json(data))
            .catch(e => res.status(500).end(JSON.stringify(e)))
    })
;


app.use('/api', api);

app.listen(3000,
    () => {console.log('server listen')});
