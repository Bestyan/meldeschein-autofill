import constants from "./constants";

const JSON_HEADERS = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
};

function getParameterString(url_parameters) {
    let parameters = url_parameters.reduce((parameter_string, parameter) => {
        return [parameter_string, "&", encodeURIComponent(parameter.key), "=", encodeURIComponent(parameter.value)].join("");
    }, "");
    parameters = "?" + parameters.substring(1, parameters.length);
    return parameters;
}

export default {

    /**
     * @param {*} path 
     * @param {Array} url_parameters 
     * @param {*} headers 
     */
    get(path, url_parameters = [], headers) {

        const fetch_headers = headers ? headers : JSON_HEADERS;

        const parameters = getParameterString(url_parameters);
        const query_path = constants.getServerURL() + path + parameters;
        
        console.log(`querying ${query_path}`);

        return fetch(query_path, {
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

    },

    isOk(responseJSON){
        if(responseJSON && responseJSON.status === "ok"){
            return true;
        }

        return false;
    }
};