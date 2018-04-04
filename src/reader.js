import request from 'request-promise-native';
import tough from 'tough-cookie';
import cheerio from 'cheerio';
import url from 'url';
import path from 'path';
import PromisePool from 'es6-promise-pool';
import {fields} from './global';

const config = {
    username:           process.env.npm_config_login_username || '',
    password:           process.env.npm_config_login_password || '',
    parallelRequests:   process.env.npm_config_parallel_requests || 8,
};

export class SessionHH {
    /**
     * Authentification sur HH
     */
    login() {
        return request({
                uri: 'https://www.hentaiheroes.com/home.html',
                jar: this.jar,
            })
            .then(() => request({
                method: 'POST',
                uri: 'https://www.hentaiheroes.com/phoenix-ajax.php',
                jar: this.jar,
                form: {
                    login: config.username,
                    password: config.password,
                    stay_online: 1,
                    module: 'Member',
                    action: 'form_log_in',
                    call: 'Member',
                },
                json: true,
            }))
            .then(response => {
                if ( !response.success ) {
                    throw new Error("Login error\n" + response.error);
                }

                return request({
                    uri: 'https://www.hentaiheroes.com/home.html',
                    jar: this.jar,
                });
            })
            .then(() => {
                this.logged = true;
            })
        ;
    }

    /**
     * Déconnexion auprès de HH
     */
    logout() {
        if ( !this.logged ) {
            return Promise.resolve();
        }

        return request({
                uri: 'https://www.hentaiheroes.com/intro.php?phoenix_member=logout',
                jar: this.jar,
            })
            .then(() => {
                this.logged = false;
            })
        ;
    }

    /**
     * Récupère les informations demandée auprès de la ToF
     * @param field
     * @param page
     */
    fetchTowerOfFame(field, page) {
        return request({
                method: 'POST',
                uri: 'https://www.hentaiheroes.com/ajax.php',
                form: {
                    class: 'TowerOfFame',
                    action: 'leaderboard_change',
                    place: 'global',
                    page: page,
                    ranking_field: field,
                    ranking_type: 'alltime',
                },
                json: true,
            })
            .then(result => {
                const $ = cheerio.load(`<div>${result.html.WW}</div>`);
                const tower = {
                    players: [],
                    lastPage: parseInt($('a[lead_nav="last"]').attr('page_number'), 10),
                };

                $('.lead_table_view tr').each(function() {
                    tower.players.push({
                        id: parseInt($(this).attr('mid'), 10),
                        rank: parseInt($(this).attr('rank'), 10),
                        username: $(this).find('td:nth-child(2)').text().trim(),
                        country: path.basename(url.parse($(this).find('img').attr('src')).pathname, '.png'),
                        lvl: parseInt($(this).find('td:nth-child(3)').text().replace(/\D/g, ''), 10),
                        value: parseInt($(this).find('td:nth-child(4)').text().replace(/\D/g, ''), 10),
                    });
                });

                return tower;
            })
        ;
    }

    constructor() {
        this.logged = false;
        this.jar =  request.jar();

        this.jar.setCookie(new tough.Cookie({
            key: 'age_verification',
            value: '1',
            domain: 'www.hentaiheroes.com',
            maxAge: 31536000,
        }), 'https://www.hentaiheroes.com');
    }
}

export function fetchAllStats(event) {
    const session = new SessionHH();
    let nbPages;

    session.fetchTowerOfFame(fields[0], 1)
        .then(page => nbPages = page.lastPage)
        .then(() => event.emit('start', nbPages))
        .then(() => {
            const poolRequest = new PromisePool(function*() {
                for ( let field of fields ) {
                    for ( let i = 1; i <= nbPages; i++ ) {
                        yield session.fetchTowerOfFame(field, i)
                            .then(page => {
                                event.emit('page');

                                for ( let player of page.players ) {
                                    event.emit('player', player, field);
                                }
                            })
                        ;
                    }
                }
            }, config.parallelRequests);

            return poolRequest.start();
        })
        .catch(e => event.emit('error', e))
        .then(() => event.emit('end'))
    ;

    return event;
}
