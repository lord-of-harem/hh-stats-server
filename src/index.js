import SessionHH from "./reader"
import PromisePool from "es6-promise-pool";
import PouchDB from "pouchdb";
import mysql from "promise-mysql";
import cliProgress from "cli-progress";

const sess = new SessionHH();
let db;
let bar;
let nbPages;
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

const now = new Date();
const dateStat = [
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate(),
    now.getHours(),
    now.getMinutes(),
];

Promise.resolve()
    .then(() => console.time('total'))
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
                                    function savePlayer() {
                                        return db.get(player.id + '_' + dateStat.join('-'))
                                            .catch(() => ({
                                                _id: player.id + '_' + dateStat.join('-'),
                                                username: player.username,
                                                country: player.country,
                                                lvl: player.lvl,
                                                classement: {},
                                            }))
                                            .then(playerDb => {
                                                playerDb.classement[field] = {
                                                    rank: player.rank,
                                                    value: player.value,
                                                };

                                                return db.put(playerDb);
                                            })
                                            .catch(() => savePlayer())
                                        ;
                                    }

                                    yield savePlayer();
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
    .then(() => console.log('ok'))
    .then(() => console.timeEnd('total'))
    .catch(console.error)
;
