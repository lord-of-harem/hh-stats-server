import SessionHH from "./reader"
import PromisePool from "es6-promise-pool";
import PouchDB from "pouchdb";
import mysql from "promise-mysql";

const sess = new SessionHH();
const db = new PouchDB('test_hh');
let cnx;
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
const nowStr = Math.round(now.getTime() / 1000);
const dateStat = [
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate(),
    now.getHours(),
    now.getMinutes(),
];

mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hh_stat',
}).then(con => cnx = con)
/*sess
    .login()*/
    /*.then(() => {
        function fetchPage(page) {
            return Promise.all(fields.map(field => sess.fetchTowerOfFame(field, page)))
                .then(pages => {
                    const stat = {
                        date: dateStat,
                    };

                    pages.forEach((page, index) => {
                        stat[fields[index]] = page.players;
                    });

                    return db
                        .post(stat)
                        .then(() => console.log(new Date()))
                        .then(() => pages)
                    ;
                })
            ;
        }

        let nbPages;
        let currentPage;

        function fetchAll() {
            if ( currentPage > nbPages ) {
                return Promise.resolve();
            }

            return fetchPage(currentPage)
                .then(() => currentPage++)
                .then(() => fetchAll())
            ;
        }

        return fetchPage(1).then(result => {
            nbPages = result[0].lastPage;
            currentPage = 2;

            return fetchAll();
        })
    })*/
    .then(() => {
        console.time("total");
        const generate = function* () {
            for ( let field of fields ) {
                console.log(field);
                for ( let i = 1; i < 8000; i++ ) {
                    console.log(`${i}/8000`);

                    yield sess.fetchTowerOfFame(field, i)
                        .then(page => {
                            let value = '';

                            page.players.forEach(player => {
                                value += (value !== '' ? ', ' : '') + `(FROM_UNIXTIME(${nowStr}), 
                                ${player.id}, 
                                ${player.rank}, 
                                ${cnx.escape(player.username)}, 
                                '${player.country}', 
                                ${player.lvl}, 
                                ${player.value}, 
                                '${fields[0]}')`;
                            });

                            return cnx.query(`INSERT INTO
                            history(date, id_player, rank, username, country, lvl, value, type) 
                            VALUES ` + value).catch(console.error);
                        })
                    ;
                }
            }
        };
        const iterator = generate();

        const pool = new PromisePool(iterator, 8);

        return pool.start();
    })
    .then(() => {
        cnx.end();
    })
    //.then(() => sess.logout())
    .then(() => console.log('ok'))
    .catch(console.error)
;
