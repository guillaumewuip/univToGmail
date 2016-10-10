'use strict';

(() => {

    const
        univMails  = require('./src/univMails'),
        gmailMails = require('./src/gmailMails');

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
        })(),

        GMAIL_USER = (() => {
            if (!process.env.GMAIL_USER) {
                throw new Error('Need GMAIL_USER');
            }
            return process.env.GMAIL_USER;
        })(),

        GMAIL_PASSWORD = (() => {
            if (!process.env.GMAIL_PASSWORD) {
                throw new Error('Need GMAIL_PASSWORD');
            }
            return process.env.GMAIL_PASSWORD;
        })(),

        GMAIL_SERVER = (() => {
            if (!process.env.GMAIL_SERVER) {
                throw new Error('Need GMAIL_SERVER');
            }
            return process.env.GMAIL_SERVER;
        })(),

        GMAIL_PORT = (() => {
            if (!process.env.GMAIL_PORT) {
                return 993;
            }
            return process.GMAIL_PORT;
        })();

    const univ = univMails({
        USER:     UNIV_USER,
        PASSWORD: UNIV_PASSWORD,
        SERVER:   UNIV_SERVER,
        PORT:     UNIV_PORT,
    });

    const gmail = gmailMails({
        USER:     GMAIL_USER,
        PASSWORD: GMAIL_PASSWORD,
        SERVER:   GMAIL_SERVER,
        PORT:     GMAIL_PORT,
    });

    univ.on('mail', (mail) => gmail.save(mail, univ.done));

})();
