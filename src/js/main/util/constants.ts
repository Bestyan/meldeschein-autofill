
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
        },
        dateWithLeadingZeroes: {
            description: "dd.MM.yyyy",
            format: {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            } as Intl.DateTimeFormatOptions
        }
    },

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
            guestExcelUploadTime: "xls_upload_datetime",
            mailTemplateNames: "mail_template_names",
            wlanVoucher: {
                labels: {
                    hotspot: "wlan_voucher_hotspot_label",
                    duration: "wlan_voucher_duration_label",
                    amount: "wlan_voucher_amount_label",
                    print: "wlan_voucher_print_label",
                    comment: "wlan_voucher_comment_label"
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
