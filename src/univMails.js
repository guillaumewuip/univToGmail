'use strict';

(() => {

    const
        EventEmitter = require('events'),
        Imap         = require('imap');

    /**
     * openInbox
     *
     * @param  {Imap}   imap
     */
    const openInbox = function (imap) {
        return new Promise((resolve, reject) => {
            imap.openBox(
                'INBOX',
                false,
                (err, box) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(box);
                    }
                }
            );
        });
    };

    /**
     * parseMail
     *
     * Find the whole mail
     *
     * @param  {Imap}   imap
     * @param  {String} uid  The mail uid
     */
    const parseMail = function (imap, uid) {

        return new Promise((resolve, reject) => {

            let query = imap.fetch(uid, {
                bodies:   '',
                struct:   false,
                markSeen: true,
            });

            let body  = '';

            query.on('message', (msg) => {

                msg.on('body', (stream) => {

                    stream.on('data', (chunk) => {
                        body += chunk.toString('utf8');
                    });

                });
            });

            query.once('end', () => {
                resolve(body);
            });

            query.on('error', () => {
                reject();
            });
        });
    };

    /**
     * findUnread
     *
     * Find unread emails
     * @param  {Imap}   imap
     */
    let findUnread = (imap) => {
        return new Promise((resolve, reject) => {
            imap.search(['UNSEEN'], (err, uids) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(uids);
                }
            });
        });
    };

    const univMails = (imapInfos) => {

        let imapEmitter = new EventEmitter();

        let imap = new Imap({
            user:     imapInfos.USER,
            password: imapInfos.PASSWORD,
            host:     imapInfos.SERVER,
            port:     imapInfos.PORT,
            tls:      true,
        });

        /**
         * readMails
         *
         * Find unread mails, parse them, then emit 'new' event for each
         */
        const readMails = () => {
            findUnread(imap)
                .then((uids) => {

                    uids.forEach((uid) => {
                        parseMail(imap, uid)
                            .then((mail) => {
                                imapEmitter.emit('new', mail);
                            })
                            .catch((err) => {
                                console.error(`Can't parse mail ${uid}`, err);
                            });
                    });

                })
                .catch((err) => {
                    console.error(err);
                    process.exit(1);
                });
        };

        imap.on('error', function (err) {
            console.error(err);
            process.exit(1);
        });

        imap.on('end', function () {
            console.error('Connection ended');
            process.exit(1);
        });

        imap.on('ready', () => {

            console.log('Opening inbox');

            openInbox(imap)
                .then(() => {
                    console.info('Start imap listening');

                    //Find unread on each new mail
                    imap.on('mail', readMails);

                    //find unread on start
                    readMails();
                })
                .catch((err) => {
                    console.error(err);
                    process.exit(1);
                });
        });

        imap.connect();

        return imapEmitter;
    };

    module.exports = univMails;

})();
