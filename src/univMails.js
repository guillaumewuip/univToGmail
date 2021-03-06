'use strict';

(() => {

    const
        EventEmitter   = require('events'),
        inbox          = require('inbox'),
        streamToBuffer = require('stream-to-buffer'),
        log            = require('./log')('[univ]');

    /**
     * isSpam
     */
    const isSpam = (mail) => /[SPAM]/.test(mail.title);

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
            let messageStream = imap.createMessageStream(uid);

            streamToBuffer(messageStream, (err, buffer) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        uid,
                        buffer,
                    });
                }
            });
        });
    };

    /**
     * fetchData
     *
     * Get more data for email uid
     */
    const fetchData = (imap, uid) => new Promise((resolve, reject) => {
        imap.fetchData(uid, (err, data) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(data);
        });
    });

    /**
     * findUnread
     *
     * Find unread emails
     * @param  {Imap}   imap
     */
    let findUnread = (imap) => {
        return new Promise((resolve, reject) => {
            const query = {unseen: true, not: {seen: true}};
            imap.search(query, true, (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });
    };

    /**
     * readMail
     *
     * Parse a mail then emit event
     */
    const readMail = (imap, imapEmitter) => (uid) => {
        Promise.all([
            parseMail(imap, uid),
            fetchData(imap, uid),
        ])
            .then(([mail, data]) => {
                log(`New mail ${mail.uid}`);
                log(mail);
                if (!isSpam(data)) {
                    imapEmitter.emit('mail', mail);
                } else {
                    done(imap)(mail.uid);
                }
            })
            .catch((err) => {
                console.error(`Can't parse mail ${uid}`, err);
            });
    };

    /**
     * done
     *
     * Set an email as seen
     */
    const done = (imap) => (uid) => {
        imap.addFlags(uid, ['\\Seen'], (err) => {
            if (err) {
                console.error('Can\’t mark mail ${mail.uid} as seen');
            } else {
                log(`Marked mail ${uid} as seen`);
            }
        });
    };

    const univMails = (imapInfos) => {

        const imapEmitter = new EventEmitter();

        const imap = inbox.createConnection(
            imapInfos.PORT,
            imapInfos.SERVER, {
                secureConnection: true,
                auth:             {
                    user: imapInfos.USER,
                    pass: imapInfos.PASSWORD,
                },
            }
        );

        imap.on('connect', () => {
            log('Opening inbox');

            imap.openMailbox('INBOX', {readOnly: false}, (err) => {
                if (err) {
                    console.error('Can\'t open INBOX', err);
                    process.exit(1);
                }

                findUnread(imap)
                    .then((results) => {
                        results.forEach(readMail(imap, imapEmitter));
                    })
                    .catch((err) => {
                        console.error('Univ error finding emails', err);
                        process.exit(1);
                    });
            });
        });

        imap.on('new', (message) => readMail(imap, imapEmitter)(message.UID));

        imap.on('error', (err) => {
            console.error('Univ error', err);
            process.exit(1);
        });

        imap.on('close', () => {
            console.error('Univ disonnection');
            process.exit(1);
        });

        imap.connect();

        imapEmitter.done = done(imap);

        return imapEmitter;
    };

    module.exports = univMails;

})();
