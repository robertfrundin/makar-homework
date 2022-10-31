export function getReleaseNumber(tag) {
    return Number(tag.split('.').pop());
}