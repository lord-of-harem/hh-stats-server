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

function compileDeltaPeriod(period, periodStr) {
    let idViewPast;
    let idViewToday;

    return Promise.resolve()
        .then(() => cnx.query(`SELECT
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
        ))
        .then(result => {
            idViewToday = result[0][0].id;
            idViewPast = result[1][0].id;
        })
        .then(() => cnx.query(`TRUNCATE ${period};
            INSERT INTO ${period} (
                id_player,
                lvl,
                victory_points_rank,
                victory_points_value,
                pvp_wins_rank,
                pvp_wins_value,
                troll_wins_rank,
                troll_wins_value,
                soft_currency_rank,
                soft_currency_value,
                experience_rank,
                experience_value,
                girls_won_rank,
                girls_won_value,
                stats_upgrade_rank,
                stats_upgrade_value,
                girls_affection_rank,
                girls_affection_value,
                harem_level_rank,
                harem_level_value
            )
            SELECT
                today.id_player,
                today.lvl - IFNULL(past.lvl, 0),
                CAST(past.victory_points_rank AS SIGNED) - CAST(today.victory_points_rank AS SIGNED),
                CAST(today.victory_points_value AS SIGNED) - CAST(IFNULL(past.victory_points_value, 0) AS SIGNED),
                CAST(past.pvp_wins_rank AS SIGNED) - CAST(today.pvp_wins_rank AS SIGNED),
                today.pvp_wins_value - IFNULL(past.pvp_wins_value, 0),
                CAST(past.troll_wins_rank AS SIGNED) - CAST(today.troll_wins_rank AS SIGNED),
                today.troll_wins_value - IFNULL(past.troll_wins_value, 0),
                CAST(past.soft_currency_rank AS SIGNED) - CAST(today.soft_currency_rank AS SIGNED),
                today.soft_currency_value - IFNULL(past.soft_currency_value, 0),
                CAST(past.experience_rank AS SIGNED) - CAST(today.experience_rank AS SIGNED),
                today.experience_value - IFNULL(past.experience_value, 0),
                CAST(past.girls_won_rank AS SIGNED) - CAST(today.girls_won_rank AS SIGNED),
                today.girls_won_value - IFNULL(past.girls_won_value, 0),
                CAST(past.stats_upgrade_rank AS SIGNED) - CAST(today.stats_upgrade_rank AS SIGNED),
                today.stats_upgrade_value - IFNULL(past.stats_upgrade_value, 0),
                CAST(past.girls_affection_rank AS SIGNED) - CAST(today.girls_affection_rank AS SIGNED),
                today.girls_affection_value - IFNULL(past.girls_affection_value, 0),
                CAST(past.harem_level_rank AS SIGNED) - CAST(today.harem_level_rank AS SIGNED),
                today.harem_level_value - IFNULL(past.harem_level_value, 0)
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
                AND victory_points_value = 0
                AND pvp_wins_value = 0
                AND troll_wins_value = 0
                AND soft_currency_value = 0
                AND experience_value = 0
                AND girls_won_value = 0
                AND stats_upgrade_value = 0
                AND girls_affection_value = 0
                AND harem_level_value = 0
            ;
            OPTIMIZE TABLE ${period};`)
        )
    ;
}

export function compileStats() {
    return Promise.all([
        compileDeltaPeriod('delta_daily', 'DAY'),
        compileDeltaPeriod('delta_weekly', 'WEEK'),
        compileDeltaPeriod('delta_monthly', 'MONTH'),
    ]);
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
