import constants from "./constants";

const JSON_HEADERS = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
};

export default {

    get(path, headers) {

        const fetch_headers = headers ? headers : JSON_HEADERS;
        return fetch(constants.getServerURL() + path, {
            headers: fetch_headers
        });

    },

    put(path, body, headers) {

        const fetch_headers = headers ? headers : JSON_HEADERS;

        return fetch(constants.getServerURL() + path, {
            headers: fetch_headers,
            method: "PUT",
            body: JSON.stringify(body)
        });

    },

    post(path, body, headers) {

        const fetch_headers = headers ? headers : JSON_HEADERS;

        return fetch(constants.getServerURL() + path, {
            headers: fetch_headers,
            method: "POST",
            body: JSON.stringify(body)
        });

    },

    delete(path, headers) {

        const fetch_headers = headers ? headers : JSON_HEADERS;

        return fetch(constants.getServerURL() + path, {
            headers: fetch_headers,
            method: "DELETE"
        });

    }
};