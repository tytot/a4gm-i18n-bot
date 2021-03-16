const fs = require('fs')

const buildBlankTable = () => {
    const rawTable = fs.readFileSync('raw_locales.txt').toString('utf-8')
    return (
        '| Taken | Language | Code | User(s) | Issue |\n| ----- | -------- | ---- | ------- | ----- |\n' +
        rawTable
            .split('\n')
            .slice(1)
            .map((row) => {
                const cols = row.split('\t')
                return `| &#9744; | ${cols[1].trim()} | ${cols[0].trim()} | | |`
            })
            .join('\n')
    )
}

const buildTable = (obj) => {
    return (
        '| Taken | Language | Code | User(s) | Issue |\n| ----- | -------- | ---- | ------- | ----- |\n' +
        Object.keys(obj)
            .sort((a, b) => a.localeCompare(b))
            .map((code) => {
                const row = obj[code]
                return `| ${row.taken ? '&#128505;' : '&#9744;'} | ${row.language} | ${code} | ${
                    row.users
                } | ${row.issue} |`
            })
            .join('\n')
    )
}

exports.buildTable = buildTable