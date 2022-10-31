const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec')
const fetch = require('node-fetch');


const {OAUTH_TOKEN, ORG_ID, TICKET_ID} = process.env;

const API_URL = `https://api.tracker.yandex.net/v2`;

const HEADERS = {
    'Authorization': `OAuth ${OAUTH_TOKEN}`,
    'X-Org-ID': `${ORG_ID}`
}

async function updateTicket() {
    try {
        console.log('Getting current ref');
        const ref = github.context.ref;
        console.log('Current ref: ' + ref);

        console.log('Getting current release tag and number');
        const splitRef = github.context.ref.split('/');
        const currentTag = splitRef.pop();
        const releaseNumber = getReleaseNumber(currentTag);
        console.log('Current release tag: ' + currentTag);
        console.log('Current release number: ' + releaseNumber);

        console.log('Forming tag range');
        const tagRange = releaseNumber === 1 ? `rc-0.0.1` : `rc-0.0.${releaseNumber - 1}...rc-0.0.${releaseNumber}`
        console.log('Tag range: ' + tagRange);

        console.log('Getting commits in tag range');
        const commitLogs = await getCommits(tagRange);
        const commitsCount = commitLogs.split('\n').length;
        console.log('Commits count in tag range: ' + commitsCount);

        console.log('Preparing commits for description');
        const preparedCommits = commitLogs.replaceAll('"', '');
        const initialCommit = commitLogs.split('\n')[0];
        const preparedCommit = preparedCommits.split('\n')[0];
        console.log(`Before and after example: 
        ${initialCommit} -> ${preparedCommit}`);

        console.log('Preparing summary');
        const summary = getSummary(currentTag);
        console.log(`Summary: 
        ${summary}`);

        console.log('Preparing description');
        const author = github.context.payload.pusher.name;
        const description = getDescription(author, preparedCommits);
        console.log(`Description:
        ${description}`);

        console.log('Updating th ticket');
        try {
           await setSummaryAndDescription(summary, description);
        } catch (error) {
            console.log('Unable to update the ticket');
            core.setFailed(error);
        }

    } catch (error) {
        core.setFailed(error.message);
    }
}

updateTicket();

function getReleaseNumber(tag) {
    return Number(tag.split('.').pop());
}

async function getCommits(tagRange) {
    let commits = '';
    let error = '';

    const options = {};
    options.listeners = {
        stdout: (data) => {
            commits += data.toString();
        },
        stderr: (data) => {
            error += data.toString();
        }
    }

    await exec.exec('git', ['log', '--pretty=format:"%h %an %s"', tagRange], options);

    if (error !== '') {
        core.setFailed(error);
    }

    return commits;
}

function getSummary(tag) {
    return `Релиз ${tag} - ${new Date().toLocaleDateString()}`
}

function getDescription(author, commits) {
    return `Отвественный за релиз: ${author}
    Коммиты, попавшие в релиз:
    ${commits}`
}

function setSummaryAndDescription(summary, description) {
    return fetch(`${API_URL}/issues/${TICKET_ID}`, {
        method: 'PATCH',
        headers: HEADERS,
        body: JSON.stringify({
            summary,
            description
        })
    });
}