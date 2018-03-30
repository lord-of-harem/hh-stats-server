import SessionHH from "./reader"

const s = new SessionHH();

s
    .login()
    .then(() => s.logout())
    .then(() => console.log('ok'))
    .catch(console.error)
;
