

export class SessionHH {
    /**
     * Authentification sur HH
     */
    login() {
        return new Promise((resolve, reject) => {
            this.logged = true;
            console.log("login");
            resolve();
        });
    }

    /**
     * Déconnexion auprès de HH
     */
    logout() {
        return new Promise((resolve, reject) => {
            this.logged = false;
            console.log("logout");
            resolve();
        });
    }



    constructor() {
        this.logged = false;
    }
}
