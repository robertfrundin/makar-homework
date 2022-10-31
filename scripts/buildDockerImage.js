const core = require('@actions/core');
const {execCommand} = require("./utils/helpers");

async function buildDockerImage(tag) {
    await execCommand('docker', ['build', '-t', `app:${tag}`, '.'])
        .then(() => console.log('Docker image built successfully!'))
        .catch((error) => {
            core.setFailed(error);
            console.log('Failed to build a docker image :c');
        });
}

module.exports = {
    buildDockerImage
}