const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec')
const fetch = require('node-fetch');

const API_URL = `https://api.tracker.yandex.net/v2`;

async function main() {
    try {
        const {OAUTH_TOKEN, ORG_ID, TICKET_ID} = process.env;

        const ref = github.context.ref.split('/');
        const currentTag = ref.pop();
        const releaseNumber = getReleaseNumber(currentTag);

        const tagRange = releaseNumber === 1 ? `rc-0.0.1` : `rc-0.0.${releaseNumber - 1}...rc-0.0.${releaseNumber}`
        const commits = await getCommits(tagRange);

        const author = github.context.payload.pusher.name;

        const summary = getSummary(currentTag);
        const description = getDescription(author, commits);

        console.log(commits)
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

function getReleaseNumber(tag) {
    return Number(tag.split('.').pop());
}

async function getCommits(tagRange) {
    let output = '';
    let error = '';

    const options = {};
    options.listeners = {
        stdout: (data) => {
            output += data.toString();
        },
        stderr: (data) => {
            error += data.toString();
        }
    }

    await exec.exec('git', ['log', '--pretty=format:"%h %an %s"', tagRange]);

    if (error !== '') {
        core.setFailed(error);
    }

    return output;
}

function getSummary(tag) {
    return `Релиз ${tag} - ${new Date().toLocaleDateString()}`
}

function getDescription(author, commits) {
    return `Отвественный за релиз: ${author}
    Коммиты, попавшие в релиз:
    ${commits}`
}