export const API_URL = `https://api.tracker.yandex.net/v2`;

export const {OAUTH_TOKEN, ORG_ID, TICKET_ID} = process.env;

export const HEADERS = {
    'Authorization': `OAuth ${OAUTH_TOKEN}`,
    'X-Org-ID': `${ORG_ID}`
}