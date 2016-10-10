'use strict';

(() => {

    const
        inbox = require('inbox'),
        log   = require('./log')('[gmail]');

    const connect = (config) => {
        return new Promise((resolve) => {
            const imap = inbox.createConnection(
                config.PORT,
                config.SERVER, {
                    secureConnection: true,
                    auth:             {
                        user: config.USER,
                        pass: config.PASSWORD,
                    },
                }
            );

            imap.on('error', (err) => {
                console.error('Gmail error', err);
                process.exit(1);
            });

            imap.on('close', () => {
                log('disconnected');
            });

            imap.once('connect', () => {
                log('imap connected');
                resolve(imap);
            });

            imap.connect();
        });
    };

    const saveMailBuild = (imap) => {

        /**
         * Save a mail into the imap inbox
         * @param  {Object} mail
         * @param  {Number} mail.uid
         * @param  {Buffer} mail.buffer
         */
        return (mail) => {
            return new Promise((resolve, reject) => {
                log(`Saving mail ${mail.uid}`);

                imap.openMailbox('INBOX', (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        imap.storeMessage(mail.buffer, null, (err, params) => {
                            if (err) {
                                console.error(
                                    `Error with mail ${mail.uid}`,
                                    err
                                );
                                reject(err);
                            } else {
                                log(`Mail ${mail.uid} saved. \
                                    UIDValidity=${params.UIDValidity}\
                                    UID=${params.UID}`);
                                resolve();
                            }
                        });
                    }
                });
            });
        };
    };

    const gmailMails = (config) => {

        connect(config) //test credentials
            .catch((err) => {
                console.error(err);
                process.exit(1);
            })
            .then((imap) => {
                log('Credentials ok');
                imap.close();
            });

        return {
            save: (mail, done) => {
                log('got mail', mail);

                connect(config)
                    .then((imap) => {
                        return saveMailBuild(imap)(mail)
                            .then(() => done(mail.uid))
                            .catch((err) => {
                                console.error(err);
                            })
                            .then(imap.close.bind(imap));
                    })
                    .catch((err) => {
                        console.error(err);
                        process.exit(1);
                    });
            },
        };

    };

    module.exports = gmailMails;

})();
