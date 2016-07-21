'use strict';

(() => {

    const
        univMails = require('./src/univMails.js');

    const
        UNIV_USER = (() => {
            if (!process.env.UNIV_USER) {
                throw new Error('Need UNIV_USER');
            }
            return process.env.UNIV_USER;
        })(),

        UNIV_PASSWORD = (() => {
            if (!process.env.UNIV_PASSWORD) {
                throw new Error('Need UNIV_PASSWORD');
            }
            return process.env.UNIV_PASSWORD;
        })(),

        UNIV_SERVER = (() => {
            if (!process.env.UNIV_SERVER) {
                throw new Error('Need UNIV_SERVER');
            }
            return process.env.UNIV_SERVER;
        })(),

        UNIV_PORT = (() => {
            if (!process.env.UNIV_PORT) {
                return 993;
            }
            return process.UNIV_PORT;
        })();

    univMails({
        USER:     UNIV_USER,
        PASSWORD: UNIV_PASSWORD,
        SERVER:   UNIV_SERVER,
        PORT:     UNIV_PORT,
    });

})();
