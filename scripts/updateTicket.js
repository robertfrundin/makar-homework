const core = require('@actions/core');
const github = require('@actions/github');
const fetch = require('node-fetch');

const API_URL = `https://api.tracker.yandex.net/v2`;

async function main () {
    try {
        const { OAUTH_TOKEN, ORG_ID, TICKET_ID } = process.env;

        const tag = `rc-0.0.1`
        const summary = getSummary(tag);

        const author = github.context.payload.pusher.name;
        const description = getDescription(author);

        console.log(OAUTH_TOKEN, ORG_ID, TICKET_ID)
        console.log(summary)
        console.log(description)

        await fetch(`${API_URL}/issues/${TICKET_ID}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `OAuth ${OAUTH_TOKEN}`,
                'X-Org-ID': `${ORG_ID}`
            },
            body: JSON.stringify({
                summary,
                description
            })
        });

    } catch (error) {
        core.setFailed(error.message);
    }
}

main();

function getSummary (tag) {
    return `Релиз ${tag} - ${new Date().toLocaleDateString()}`
}

function getDescription (author) {
    return `Отвественный за релиз: ${author}`
}