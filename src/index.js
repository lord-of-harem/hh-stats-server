import {fetchAllStats, fields} from './reader'
import {saveStats} from './db'
import {EventEmitter} from 'events';
import cliProgress from 'cli-progress';

const bar = new cliProgress.Bar({}, cliProgress.Presets.legacy);
const e = new EventEmitter();

e
    .on('start', nbPages => bar.start(nbPages * fields.length, 0))
    .on('page', () => bar.increment())
    .on('ready', () => fetchAllStats(e))
    .on('end', () => {
        bar.stop();
        console.log('finish');
    })
;

saveStats(e);
