const fs = require('node:fs');
const { waitForDebugger } = require('node:inspector');

const user = "mapleatmorning"
const query = fs.readFileSync('src/gql/FindUserFromName.gql', 'utf8');

// console.log(JSON.stringify({query, variables: { user }}))
async function fetchData() {
    const response = await fetch('https://7tv.io/v4/gql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            query,
            variables: { user },
        }),
    })
    console.log(await response.json());
    waitForDebugger()
}
fetchData()