import mysql from 'promise-mysql';

export function saveStats(event) {
    let cnx;
    let idView;

    return Promise.resolve()
        .then(() => mysql.createPool({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'test_hh',
            multipleStatements: true,
        }))
        .then(con => cnx = con)
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
        .then(() => cnx.end())
    ;
}

