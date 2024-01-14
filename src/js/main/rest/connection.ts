import constants from "../util/constants";

const JSON_HEADERS = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
};

function getParameterString(url_parameters: Array<{key: string, value: string}>) {
    let parameters = url_parameters.reduce((parameter_string, {key, value}) => {
        return [parameter_string, "&", encodeURIComponent(key), "=", encodeURIComponent(value)].join("");
    }, "");
    // remove first "&" and prefix "?"
    parameters = "?" + parameters.substring(1, parameters.length);
    return parameters;
}

export default {

    get(path: string, url_parameters: Array<{key: string, value: string}> = [], headers: Headers) {

        const fetch_headers = headers ? headers : JSON_HEADERS;

        const parameters = getParameterString(url_parameters);
        const query_path = constants.getServerURL() + path + parameters;
        
        console.log(`querying ${query_path}`);

        return fetch(query_path, {
            headers: fetch_headers
        });

    },

    put(path: string, body: Object, headers: Headers) {

        const fetch_headers = headers ? headers : JSON_HEADERS;

        return fetch(constants.getServerURL() + path, {
            headers: fetch_headers,
            method: "PUT",
            body: JSON.stringify(body)
        });

    },

    post(path: string, body: Object, headers: Headers) {

        const fetch_headers = headers ? headers : JSON_HEADERS;

        return fetch(constants.getServerURL() + path, {
            headers: fetch_headers,
            method: "POST",
            body: JSON.stringify(body)
        });

    },

    delete(path: string, headers: Headers) {

        const fetch_headers = headers ? headers : JSON_HEADERS;

        return fetch(constants.getServerURL() + path, {
            headers: fetch_headers,
            method: "DELETE"
        });

    },

    isOk(responseJSON: any){
        if(responseJSON && responseJSON.status === "ok"){
            return true;
        }

        return false;
    }
};