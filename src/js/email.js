import Imap from 'imap';
import {
    simpleParser
} from 'mailparser';
import constants from './constants';

function generateDeferredPromise() {
    return (() => {
        let resolve;

        const p = new Promise(res => {
            resolve = res;
        });

        return {
            promise: p,
            resolve
        };
    })();
}

export default {

    fetchMails(from) {
        const email_settings = window.localStorage.getItem(constants.SETTINGS_EMAIL);

        if (!email_settings.user ||
            !email_settings.password ||
            !email_settings.host ||
            !email_settings.port ||
            email_settings.tls === undefined) {
            alert("Email Zugangsdaten fehlen. Siehe Einstellungen");
            return;
        }

        const imap = new Imap(email_settings);
        imap.once('ready', () => {
            imap.openBox('INBOX', true, (error, box) => {

                if (error) throw error;

                console.log(box.messages.total + ' message(s) found!');

                imap.seq.search([
                    ['FROM', from]
                ], (error, results) => {

                    if (error) throw error;

                    // results is an array of the sequence numbers
                    // create a dictionary that maps the sequence number to a deferred promise
                    const deferredPromises = results.reduce((map, _) => {
                        map[_] = generateDeferredPromise();
                        return map;
                    }, {});

                    // fetch only the mails matching the sequence numbers returned by the search
                    const fetch = imap.seq.fetch(results, {
                        bodies: ''
                    });

                    fetch.on('message', (msg, sequence_number) => {
                        msg.on('body', (stream, info) => {
                            // resolve the promise belonging to the sequence number when parsed
                            simpleParser(stream)
                                .then(parsedMail => deferredPromises[sequence_number].resolve(parsedMail))
                                .catch(error => console.log('Parse error: ' + error));
                        });
                    });

                    fetch.once('error', error => {
                        alert('Email fetch error: ' + error);
                    });

                    fetch.once('end', () => {
                        imap.end();
                    });

                    // wait for all mails to be parsed, then trigger callback
                    Promise.all(Object.values(deferredPromises).map(deferred => deferred.promise))
                        .then(mails => callback(mails));
                });
            });
        });

        imap.connect();
    }
};