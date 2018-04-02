import {fetchAllStats, fields} from './reader'
import {saveStats} from './db'
import {EventEmitter} from 'events';
import cliProgress from 'cli-progress';
import {spawn} from 'child_process';

if ( process.argv[2] === undefined ) {
    console.time('total');
    const task = Array.from(fields);

    for ( let field of fields ) {
        const cp = spawn('node', ['dist/src/index.js', field]);
        cp
            .on('exit', () => {
                task.pop();

                if ( task.length === 0 ) {
                    console.timeEnd('total');
                }
            });

        cp.stdout.pipe(process.stdout);
        cp.stderr.pipe(process.stderr);
    }
}

else {
    const bar = new cliProgress.Bar({}, cliProgress.Presets.legacy);
    const e = new EventEmitter();
    const field = process.argv[2];

    console.time('field');

    e
        .on('start', nbPages => bar.start(nbPages * fields.length, 0))
        .on('page', () => bar.increment())
        .on('ready', () => fetchAllStats(e, field))
        .on('end', () => {
            bar.stop();
            console.log('finish');
            console.timeEnd('field');
        })
    ;

    saveStats(e);
}
