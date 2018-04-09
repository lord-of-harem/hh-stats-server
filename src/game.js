import {fetchAllStats, SessionHH} from './reader'
import {fields} from './global';
import {saveStats, buildDelta, buildTops, reduceHistory, saveHarem, fetchPlayerList} from './db'
import {EventEmitter} from 'events';
import cliProgress from 'cli-progress';
import {CronJob} from 'cron';
import PromisePool from 'es6-promise-pool';
import {readFileSync, writeFileSync} from 'fs';

new CronJob('0 15 4,16 * * *',
    () => {
        const bar = new cliProgress.Bar({}, cliProgress.Presets.legacy);
        const e = new EventEmitter();

        e
            .on('start', nbPages => bar.start(nbPages * fields.length, 0))
            .on('page', () => bar.increment())
            .on('ready', () => fetchAllStats(e))
            .on('end', () => {
                bar.stop();

                buildDelta()
                    .then(() => buildTops())
                    .then(() => reduceHistory())
                    .then(() => console.log('finish'))
                    .catch(e => console.error(e))
                ;
            })
        ;

        saveStats(e);
    },
    null,
    true,
    'Europe/Paris')
;

const h = new SessionHH();

setTimeout(() => {
    const param = JSON.parse(readFileSync('.harem.json') || '{}');

    const poolRequest = new PromisePool(function*() {
        let run = true;
        let currentPage = param.currentPage || 0;

        while ( run ) {
            yield fetchPlayerList(currentPage)
                .then(players => Promise.all(players.map(player =>
                    h
                        .fetchHeroPage(player.id_player)
                        .catch(e => {
                            if ( e.message !== 'no harem' ) {
                                console.error(e);
                            }
                        })
                )))
                .then(players => {
                    if ( players.length === 0 ) {
                        run = false;
                    }

                    return players;
                })
                .then(players => players.filter(player => player !== undefined))
                .then(players => players.map(player => {
                    const harem = [];

                    for ( let girl in player.girl_list.All ) {
                        harem.push(player.girl_list.All[girl]);
                    }

                    return harem;
                }))
                .then(players => Promise.all(players.map(player => saveHarem(player))))
                .catch(console.error)
            ;

            currentPage++;
            writeFileSync('.harem.json', JSON.stringify({currentPage: currentPage}));
        }
    }, 1);

    poolRequest.start().then(() => console.log('finish'));


}, 1000);

