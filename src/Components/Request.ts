export const REQ = "http://localhost:4000";
export function getUrl(endpoint = ""){
    return `${REQ}/${endpoint}`;
}