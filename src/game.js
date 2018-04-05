import {fetchAllStats} from './reader'
import {fields} from './global';
import {saveStats, buildDelta, buildTops, reduceHistory} from './db'
import {EventEmitter} from 'events';
import cliProgress from 'cli-progress';
import {CronJob} from 'cron';

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
