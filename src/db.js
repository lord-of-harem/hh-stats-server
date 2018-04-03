import mysql from 'promise-mysql';

const config = {
    host:           process.env.npm_config_db_host || 'localhost',
    user:           process.env.npm_config_db_user || 'root',
    password:       process.env.npm_config_db_password || '',
    database:       process.env.npm_config_db_database || 'hh_stat',
};

let cnx, isOpen;

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

export function close() {
    return Promise.resolve()
        .then(() => cnx.end())
        .then(() => isOpen = false);
}

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

export function getPlayerStat(playerId) {
    if ( !isOpen ) {
        return Promise.reject();
    }

    return cnx.query(`SELECT * FROM players WHERE id_player = ?; 
            SELECT 
                history.lvl,
                history.victory_points_rank,
                history.victory_points_value,
                history.pvp_wins_rank,
                history.pvp_wins_value,
                history.troll_wins_rank,
                history.troll_wins_value,
                history.soft_currency_rank,
                history.soft_currency_value,
                history.experience_rank,
                history.experience_value,
                history.girls_won_rank,
                history.girls_won_value,
                history.stats_upgrade_rank,
                history.stats_upgrade_value,
                history.girls_affection_rank,
                history.girls_affection_value,
                history.harem_level_rank,
                history.harem_level_value,
                views.date
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
