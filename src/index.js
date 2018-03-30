import SessionHH from "./reader"

const s = new SessionHH();

const fields = [
    'victory_points',
    'pvp_wins',
    'troll_wins',
    'soft_currency',
    'experience',
    'girls_won',
    'stats_upgrade',
    'girls_affection',
    'harem_level',
];

s
    .login()
    .then(() => Promise.all(fields.map(field => s.fetchTowerOfFame(field, 1))))
    .then(result => result.forEach(data => console.log(data.players)))
    .then(() => s.logout())
    .then(() => console.log('ok'))
    .catch(console.error)
;
