const exec = require("@actions/exec");
const core = require("@actions/core");

async function execCommand(command, args) {
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

    await exec.exec(command, args, options);

    if (error !== '') {
        core.setFailed(error);
    }

    return output;
}

function getReleaseNumber(tag) {
    return Number(tag.split('.').pop());
}

module.exports = {
    execCommand,
    getReleaseNumber
}