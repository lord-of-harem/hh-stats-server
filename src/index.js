import './game';
import './api';
import {open, createReduceHistory} from './db'

open()
    .then(() => createReduceHistory())
    .then(() => console.log('ready'))
    .catch(e => console.error(e))
;
