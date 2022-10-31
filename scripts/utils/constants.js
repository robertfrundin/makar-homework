const API_URL = `https://api.tracker.yandex.net/v2`;

const {OAUTH_TOKEN, ORG_ID, TICKET_ID} = process.env;

const HEADERS = {
    'Authorization': `OAuth ${OAUTH_TOKEN}`,
    'X-Org-ID': `${ORG_ID}`
}

module.exports = {
    API_URL,
    TICKET_ID,
    HEADERS
}