import request from 'request-promise-native';
import tough from 'tough-cookie';

export default class SessionHH {
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
                    login: process.env.npm_config_login_username,
                    password: process.env.npm_config_login_password,
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
