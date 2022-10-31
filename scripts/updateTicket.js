const core = require('@actions/core');
const github = require('@actions/github');
const fetch = require('node-fetch');
const {execCommand, getReleaseNumber} = require("./utils/helpers");
const {API_URL, TICKET_ID, HEADERS} = require("./utils/constants");


function getSummary(tag) {
    return `Релиз ${tag} - ${new Date().toLocaleDateString()}`
}

function getDescription(author, commits) {
    return `Отвественный за релиз: ${author} \n\nКоммиты, попавшие в релиз:\n${commits}`

}

function patchTicket(summary, description) {
    return fetch(`${API_URL}/issues/${TICKET_ID}`, {
        method: 'PATCH',
        headers: HEADERS,
        body: JSON.stringify({
            summary,
            description
        })
    });
}

async function updateTicket() {
    try {
        console.log('1. Getting current ref:');
        const ref = github.context.ref;
        console.log(`Current ref: ${ref} \n`);

        console.log('2. Getting current release tag and number:');
        const splitRef = ref.split('/');
        const currentTag = splitRef.pop();
        const releaseNumber = getReleaseNumber(currentTag);
        console.log(`Current release tag: ${currentTag}`);
        console.log(`Current release number: ${releaseNumber} \n`);

        console.log('3. Forming tag range:');
        const tagRange = releaseNumber === 1 ? `rc-0.0.1` : `rc-0.0.${releaseNumber - 1}...rc-0.0.${releaseNumber}`
        console.log(`Tag range: ${tagRange} \n`);

        console.log('4. Getting commits in tag range:');
        const commitLogs = await execCommand('git',  ['log', '--pretty=format:"%h %an %s"', tagRange]);
        const commitsCount = commitLogs.split('\n').length;
        console.log(`\nCommits count in tag range: ${commitsCount} \n`);

        console.log('5. Preparing commits for description:');
        const preparedCommits = commitLogs.replaceAll('"', '');
        const initialCommit = commitLogs.split('\n')[0];
        const preparedCommit = preparedCommits.split('\n')[0];
        console.log(`before and after example: \n   ${initialCommit} -> ${preparedCommit}`);

        console.log('\n6. Preparing summary:');
        const summary = getSummary(currentTag);
        console.log(`   ${summary}`);

        console.log('\n7. Preparing description:');
        const author = github.context.payload.pusher.name;
        const description = getDescription(author, preparedCommits);
        console.log(`   ${description}`);

        console.log('\n8. Updating the ticket \n');
        try {
           await patchTicket(summary, description);
           console.log('Ticket updated successfully!');
        } catch (error) {
            console.log('Failed to update the ticket :c');
            core.setFailed(error);
        }

    } catch (error) {
        core.setFailed(error.message);
    }
}

updateTicket();