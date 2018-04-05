import mysql from 'promise-mysql';
import {fields} from './global';

const config = {
    host:           process.env.npm_config_db_host || 'localhost',
    user:           process.env.npm_config_db_user || 'root',
    password:       process.env.npm_config_db_password || '',
    database:       process.env.npm_config_db_database || 'hh_stat',
};

let cnx, isOpen;

/**
 * Ouvre la connexion de la base de données
 * @returns {Promise.<boolean>}
 */
export function open() {
    return Promise.resolve()
        .then(() => mysql.createPool({
            host: config.host,
            user: config.user,
            password: config.password,
            database: config.database,
            multipleStatements: true,
        }))
        .then(con => cnx = con)
        .then(() => isOpen = true)
    ;
}

/**
 * Terminal la connexion de la base de données
 * @returns {Promise.<boolean>}
 */
export function close() {
    return Promise.resolve()
        .then(() => cnx.end())
        .then(() => isOpen = false);
}

/**
 * Sauvegarde dans la base de données les statistiques des joueurs envoyés via l'evenement manager
 * @param event
 * @returns {*}
 */
export function saveStats(event) {
    if ( !isOpen ) {
        return Promise.reject();
    }

    let idView;

    return Promise.resolve()
        .then(() => cnx.query('INSERT INTO views (date) VALUES(now())'))
        .then(result => idView = result.insertId)
        .then(() => event.emit('ready'))
        .then(() => new Promise(resolve => {
            event
                .on('player', (player, field) => {
                    cnx.query(
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
                                username = VALUES(username),
                                country = VALUES(country)
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
                                ${field}_rank = VALUES(${field}_rank),
                                ${field}_value = VALUES(${field}_value)
                        ;`)
                    ;
                })
                .on('end', () => setTimeout(() => resolve(), 2000))
            ;
        }))
    ;
}

/**
 * Récupère l'identifiant des vues courante et passée pour une période donnée
 * @param periodStr
 */
function getIdView(periodStr) {
    return cnx.query(`SELECT
                id
            FROM
                views
            WHERE
                date = (SELECT MAX(date) FROM views)
            ;
            SELECT
                id
            FROM
                views
            WHERE 
                date = (SELECT MIN(date) FROM views WHERE date >= NOW() - INTERVAL 1 ${periodStr})
            ;`
        )
        .then(result => ({
            idViewToday: result[0][0].id,
            idViewPast: result[1][0].id,
        }))
    ;
}

/**
 * Execute les requêtes de compilation périodiques
 * @param period
 * @param periodStr
 * @returns {Promise.<TResult>}
 */
function buildDeltaPeriod(period, periodStr) {
    let idViewPast, idViewToday;

    let fieldsInsert = ``;
    let fieldsSelect = ``;
    let fieldsDelete = ``;

    for ( let field of fields ) {
        fieldsInsert += `, ${field}_rank, ${field}_value`;
        fieldsSelect += `, CAST(past.${field}_rank AS SIGNED) - CAST(today.${field}_rank AS SIGNED),
                CAST(today.${field}_value AS SIGNED) - CAST(IFNULL(past.${field}_value, 0) AS SIGNED)`;
        fieldsDelete += ` AND ${field} = 0`;
    }

    return Promise.resolve()
        .then(() => getIdView(periodStr))
        .then(result => ({idViewToday, idViewPast} = result))
        .then(() => cnx.query(`TRUNCATE ${period};
            INSERT INTO ${period} (
                id_player,
                lvl
                ${fieldsInsert}
            )
            SELECT
                today.id_player,
                today.lvl - IFNULL(past.lvl, 0)
                ${fieldsSelect}
            FROM
                history AS today
            LEFT JOIN
                history AS past 
            ON
                past.id_player = today.id_player
                AND past.id_view = ${idViewPast}
            WHERE
                today.id_view = ${idViewToday}
            ;
            DELETE FROM ${period} WHERE
                lvl = 0
                ${fieldsDelete}
            ;
            OPTIMIZE TABLE ${period};`)
        )
    ;
}

/**
 * Compile les statistiques périodiques quotidienne, hebdomadaire et mensuelle
 * @returns {Promise.<*[]>}
 */
export function buildDelta() {
    return Promise.all([
        buildDeltaPeriod('delta_daily', 'DAY'),
        buildDeltaPeriod('delta_weekly', 'WEEK'),
        buildDeltaPeriod('delta_monthly', 'MONTH'),
    ]);
}

/**
 * Récupère les statistiques d'un joueur donné
 * @param playerId
 * @returns {Promise.<*>}
 */
export function getPlayerStat(playerId) {
    if ( !isOpen ) {
        return Promise.reject();
    }

    let fieldsSelect = ``;

    for ( let field of fields ) {
        fieldsSelect += `, history.${field}`;
    }

    return cnx.query(`SELECT * FROM players WHERE id_player = ?; 
            SELECT 
                history.lvl,
                views.date
                ${fieldsSelect}
            FROM 
                history 
            LEFT JOIN
                views ON views.id = history.id_view
            WHERE id_player = ?
            ORDER BY views.date DESC
            LIMIT 30`, [playerId, playerId])
        .then(result => {
            return {
                player: result[0][0],
                history: result[1],
            };
        })
    ;
}

/**
 * Récupère le top auprès du delta complet de la période
 * @param period
 * @param periodStr
 * @returns {Promise.<TResult>}
 */
function buildTop(period, periodStr) {
    return Promise.resolve()
        .then(() => getIdView(periodStr))
        .then(view => {
            let query = '';

            for ( let field of fields ) {
                query += `SELECT 
                    players.id_player,
                    players.username,
                    players.country,
                    ${period}.${field}_value, 
                    ${period}.${field}_rank,
                    past.${field}_value AS past_${field}_value,
                    past.${field}_rank AS past_${field}_rank,
                    today.${field}_value AS today_${field}_value,
                    today.${field}_rank AS today_${field}_rank
                FROM 
                    ${period} 
                LEFT JOIN players
                    ON players.id_player = ${period}.id_player
                LEFT JOIN history AS past
                    ON past.id_view = ${view.idViewPast}
                    AND past.id_player = ${period}.id_player
                LEFT JOIN history AS today
                    ON today.id_view = ${view.idViewToday}
                    AND today.id_player = ${period}.id_player
                ORDER BY ${period}.${field}_value DESC 
                LIMIT 1;\n`;
            }

            return cnx.query(query);
        })
        .then(result => {
            let res = {};

            fields.forEach((field, index) => {
                res[field] = {
                    player: {
                        id_player: result[index][0].id_player,
                        username: result[index][0].username,
                        country: result[index][0].country,
                    },
                    delta: {
                        value: result[index][0][field + '_value'],
                        rank: result[index][0][field + '_rank'],
                    },
                    past: {
                        value: result[index][0]['past_' + field + '_value'],
                        rank: result[index][0]['past_' + field + '_rank'],
                    },
                    today: {
                        value: result[index][0]['today_' + field + '_value'],
                        rank: result[index][0]['today_' + field + '_rank'],
                    },
                };
            });

            return res
        })
    ;
}

/**
 * Construit une image des top dans la base de données
 * @returns {Promise.<TResult>}
 */
export function buildTops() {
    return Promise.all([
            buildTop('delta_daily', 'DAY'),
            buildTop('delta_weekly', 'WEEK'),
            buildTop('delta_monthly', 'MONTH'),
        ])
        .then(top => cnx.query(`TRUNCATE top;
            INSERT INTO top (period, data) VALUES
                ('day', ${cnx.escape(JSON.stringify(top[0]))}),
                ('week', ${cnx.escape(JSON.stringify(top[1]))}),
                ('month', ${cnx.escape(JSON.stringify(top[2]))})
            ;`
        ))
    ;
}

/**
 * Récupère les meilleurs joueur d'une période
 * @param period
 */
export function getTop(period) {
    return Promise.resolve()
        .then(() => cnx.query(`SELECT data FROM top WHERE period = ${cnx.escape(period)}`))
        .then(result => JSON.parse(result[0].data))
    ;
}
