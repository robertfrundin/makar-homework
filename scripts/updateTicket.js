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
        console.log('1. Getting current ref:');
        const ref = github.context.ref;
        console.log(`Current ref: ${ref} \n`);

        console.log('2. Getting current release tag and number:');
        const splitRef = github.context.ref.split('/');
        const currentTag = splitRef.pop();
        const releaseNumber = getReleaseNumber(currentTag);
        console.log(`Current release tag: ${currentTag}`);
        console.log(`Current release number: ${releaseNumber} \n`);

        console.log('3. Forming tag range:');
        const tagRange = releaseNumber === 1 ? `rc-0.0.1` : `rc-0.0.${releaseNumber - 1}...rc-0.0.${releaseNumber}`
        console.log(`Tag range: ${tagRange} \n`);

        console.log('4. Getting commits in tag range:');
        const commitLogs = await getCommits(tagRange);
        const commitsCount = commitLogs.split('\n').length;
        console.log(`\nCommits count in tag range: ${commitsCount} \n`);

        console.log('5. Preparing commits for description:');
        const preparedCommits = commitLogs.replaceAll('"', '');
        const initialCommit = commitLogs.split('\n')[0];
        const preparedCommit = preparedCommits.split('\n')[0];
        console.log(`before and after example: \n   ${initialCommit} -> ${preparedCommit}`);

        console.log('6. Preparing summary:');
        const summary = getSummary(currentTag);
        console.log(`   ${summary}`);

        console.log('7. Preparing description:');
        const author = github.context.payload.pusher.name;
        const description = getDescription(author, preparedCommits);
        console.log(`   ${description}`);

        console.log('\n8. Updating the ticket \n');
        try {
           await setSummaryAndDescription(summary, description);
           console.log('Ticket updated successfully!');
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
    return (
        `Отвественный за релиз: ${author}
    \nКоммиты, попавшие в релиз:
    ${commits}`
    )

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