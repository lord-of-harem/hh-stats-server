import SessionHH from "./reader"
import PromisePool from "es6-promise-pool";
import PouchDB from "pouchdb";
import mysql from "promise-mysql";
import cliProgress from "cli-progress";

const sess = new SessionHH();
let db;
let bar;
let nbPages;
let cnx;
let idView;
const fields = [
    'victory_points',
    'pvp_wins',
    'troll_wins',
    'soft_currency',
    'experience',
    'girls_won',
    'stats_upgrade',
    'girls_affection',
    'harem_level',
];

Promise.resolve()
    .then(() => console.time('total'))
    .then(() => mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'test_hh',
        connectionLimit: 30,
        multipleStatements: true,
    }))
    .then(con => cnx = con)
    .then(() => cnx.query('INSERT INTO views (date) VALUES(now())'))
    .then(result => idView = result.insertId)
    .then(() => db = new PouchDB('http://localhost:5984/test_hh'))
    .then(() => sess.fetchTowerOfFame(fields[0], 1))
    .then(page => nbPages = page.lastPage)
    .then(() => {
        bar = new cliProgress.Bar({}, cliProgress.Presets.legacy);
        bar.start(nbPages * fields.length, 0);
    })
    .then(() => {
        const poolRequest = new PromisePool(function*() {
            for ( let field of fields ) {
                for ( let i = 1; i < nbPages; i++ ) {
                    yield sess.fetchTowerOfFame(field, i)
                        .then(page => {
                            const poolPage = new PromisePool(function*() {
                                for ( let player of page.players ) {
                                    yield cnx.query(
                                        `INSERT INTO 
                                            players (
                                                id_player, 
                                                username, 
                                                country
                                            ) VALUES (
                                                ${player.id},
                                                ${cnx.escape(player.username)},
                                                ${cnx.escape(player.country)}
                                            ) ON DUPLICATE KEY UPDATE 
                                                username = ${cnx.escape(player.username)},
                                                country = ${cnx.escape(player.country)}
                                        ;
                                        INSERT INTO
                                            history (
                                                id_player,
                                                id_view,
                                                lvl,
                                                ${field}_rank,
                                                ${field}_value
                                            ) VALUES (
                                                ${player.id},
                                                ${idView},
                                                ${player.lvl},
                                                ${player.rank},
                                                ${player.value}
                                            ) ON DUPLICATE KEY UPDATE 
                                                ${field}_rank = ${player.rank},
                                                ${field}_value = ${player.value}
                                        ;`)
                                    ;
                                }
                            }, 30);

                            return poolPage.start();
                        })
                        .then(() => bar.increment())
                    ;
                }
            }
        }, 8);

        return poolRequest.start();
    })
    .then(() => bar.stop())
    .then(() => cnx.end())
    .then(() => console.log('ok'))
    .then(() => console.timeEnd('total'))
    .catch(console.error)
;
