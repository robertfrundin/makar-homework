const core = require('@actions/core');
const github = require("@actions/github");
const fetch = require("node-fetch");
const {getReleaseNumber} = require("./utils/functions");
const {API_URL, TICKET_ID, HEADERS} = require("./utils/constants");

function getCommentText(tag) {
    return `Собрали образ с тегом ${tag}`;
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

        const commentText = getCommentText(currentTag);

        try {
            await postComment(commentText);
        } catch (error) {
            core.setFailed(error)
        }
    } catch (error) {
        core.setFailed(error.message)
    }
}