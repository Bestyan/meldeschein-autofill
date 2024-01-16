
export enum Title {
    Herr = 1,
    Frau = 4,
    Gast = 48
}

export enum Apartment {
    "krokus",
    "enzian",
    "lavendel",
    "lilien",
    "rosen",
    "tulpen",
    "nelken",
    "narzissen"
}

export default {

    dateFormat: {
        dateAndTime:{
            description: "dd.MM.yyyy, hh:mm", // not in use, just for documentation purposes
            format: {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            } as Intl.DateTimeFormatOptions
        }
    },

    STATUS_DATE_FORMAT: {},

    getTitle(gender: string): Title {
        if (gender === "F") {
            return Title.Frau;
        }

        if (gender === "M") {
            return Title.Herr;
        }

        return Title.Gast;
    },

    localStorage: {
        keys: {
            checkinDocxAsBinaryText: "settings_checkin_docx",
            keysXlsStatus: "settings_keys_xls",
            guestXlsUploadDateTime: "xls_upload_datetime",
            mailTemplates: {
                individual: {
                    plain: "review_mailtemplate_individual_plain",
                    html: "review_mailtemplate_individual_html"
                },
                generalFirstVisit: {
                    plain: "review_mailtemplate_general_firstvisit_plain",
                    html: "review_mailtemplate_general_firstvisit_html"
                },
                general: {
                    plain: "review_mailtemplate_general_plain",
                    html: "review_mailtemplate_general_html"
                }
            }
        }
    },

    getServerURL(): string {
        const serverUrl = {
            production: "https://meldeschein-autofill-server.onrender.com",
            development: "http://localhost:8000"
        };

        return serverUrl[process.env.NODE_ENV as "production" | "development"].toString();
    },

    server: {
        endpoints: {
            wakeUp: "/wake-up",
            firstname: "/db/firstname"
        }
    }
};
