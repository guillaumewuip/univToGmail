'use strict';

(() => {

    const
        Imap = require('imap'),
        log  = require('./log')('[gmail]');

    const connect = (imap) => {
        return new Promise((resolve) => {
            imap.once('ready', () => {
                log('imap connected');
                resolve();
            });
            imap.connect();
        });
    };

    const openInbox = (imap) => {
        return new Promise((resolve, reject) => {
            imap.openBox(
                'INBOX',
                false,
                (err, box) => {
                    if (err) {
                        log('can\'t open inbox');
                        reject(err);
                    } else {
                        log('inbox open');
                        resolve(box);
                    }
                }
            );
        });
    };

    const saveMailBuild = (imap) => {

        /**
         * Save a mail into the imap inbox
         * @param  {Object} mail
         * @param  {Number} mail.id
         * @param  {Buffer} mail.buffer
         * @param  {Date}   mail.date
         */
        return (mail) => {
            return new Promise((resolve, reject) => {
                log(`Saving mail ${mail.id}`);
                imap.append(
                    mail.buffer,
                    {
                        date: mail.date,
                    },
                    (err) => {
                        if (err) {
                            console.error(`Error with mail ${mail.id}`);
                            reject(err);
                        } else {
                            log(`Mail ${mail.id} saved`);
                            resolve();
                        }
                    }
                );
            });
        };
    };

    const gmailMails = (config) => {

        let imap = new Imap({
            user:        config.USER,
            password:    config.PASSWORD,
            host:        config.SERVER,
            port:        config.PORT,
            tls:         true,
            connTimeout: 10000, //10sec
            authTimeout: 10000, //10sec
            debug:       console.log.bind(console),
        });

        imap.on('error', (err) => {
            console.error(err);
            process.exit(1);
        });

        imap.on('end', () => {
            log('Connection ended');
        });

        //test credentials
        connect(imap)
            .then(() => {
                //imap.end();
            })
            .catch((err) => {
                console.error(err);
                process.exit(1);
            })
            .then(() => {
                log('Credentials ok');
            });

        return {
            save: (mail) => {
                log('got mail', mail);

                connect(imap)
                    .then(openInbox.bind(null, imap))
                    .then(() => {
                        return saveMailBuild(imap)(mail);
                    })
                    .catch((err) => {
                        console.error(err);
                    });
            },
        };

    };

    module.exports = gmailMails;

})();
