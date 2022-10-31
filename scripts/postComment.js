const core = require('@actions/core');
const github = require("@actions/github");
const fetch = require("node-fetch");
const {API_URL, TICKET_ID, HEADERS} = require("./utils/constants");
const {execCommand, getReleaseNumber} = require("./utils/helpers");

function getCommentText(releaseNumber) {
    return `Собрали образ с тегом rc:0.0.${releaseNumber}`;
}

function postComment(text) {
    return fetch(`${API_URL}/issues/${TICKET_ID}/comments`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({
            text
        })
    });
}

async function addComment() {
    try {
        console.log('1. Getting current ref:');
        const ref = github.context.ref;
        console.log(`Current ref: ${ref} \n`);

        console.log('2. Getting current release tag:');
        const splitRef = ref.split('/');
        const currentTag = splitRef.pop();
        const releaseNumber = getReleaseNumber(currentTag);
        console.log(`Current release tag: ${currentTag}`);
        console.log(`Current release number: ${releaseNumber} \n`);

        console.log('3. Building a docker image with release tag:');
        await execCommand('docker', ['build', '-t', `rc:0.0.${releaseNumber}`, '.'])
        console.log('Docker image was built successfully!');

        console.log('\n4. Preparing comment text');
        const commentText = getCommentText(releaseNumber);
        console.log(`   ${commentText}`);

        console.log('\n5. Posting the comment to ticket \n');
        try {
            await postComment(commentText);
            console.log('Comment posted successfully!');
        } catch (error) {
            console.log('Failed to post the comment :c');
            core.setFailed(error);
        }
    } catch (error) {
        core.setFailed(error.message);
    }
}

addComment();