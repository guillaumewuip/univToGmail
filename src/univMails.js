'use strict';

(() => {

    const
        EventEmitter = require('events'),
        Imap         = require('imap'),
        log          = require('./log')('[univ]');

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

            let buffer    = [],
                bufferLen = 0,
                date;

            query.on('message', (msg) => {

                msg.on('body', (stream) => {
                    stream.on('data', (chunk) => {
                        buffer.push(chunk);
                        bufferLen += chunk.length;
                    });
                });

                msg.on('attributes', (attrs) => {
                    date = new Date(attrs.date);
                });

                msg.once('end', () => {
                    resolve({
                        id:     uid,
                        date:   date,
                        buffer: Buffer.concat(buffer, bufferLen),
                    });
                });
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

                    log('Unread mails', uids);

                    uids.forEach((uid) => {
                        parseMail(imap, uid)
                            .then((mail) => {
                                log(`New mail ${mail.id}`);
                                log(mail);
                                imapEmitter.emit('mail', mail);
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

        imap.on('error', (err) => {
            console.error(err);
            process.exit(1);
        });

        imap.on('end', () => {
            console.error('Connection ended');
            process.exit(1);
        });

        //Find unread on each new mail
        imap.on('mail', readMails);

        imap.on('ready', () => {

            log('Opening inbox');

            openInbox(imap)
                .then(() => {
                    log('Start imap listening');

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
