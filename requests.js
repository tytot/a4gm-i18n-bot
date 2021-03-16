const axios = require('axios')
const auth = require('./auth')
const table = require('./table')

const getI18nProject = (token) => {
    return new Promise((resolve, reject) => {
        axios
            .get('https://api.github.com/repos/tytot/attendance-for-google-meet/projects', {
                headers: {
                    Authorization: 'token ' + token,
                    Accept: 'application/vnd.github.inertia-preview+json',
                },
            })
            .then((res) => {
                const project = res.data.filter(
                    (project) => project.name === 'Internationalization'
                )[0]
                return axios.get(`https://api.github.com/projects/${project.id}/columns`, {
                    headers: {
                        Authorization: 'token ' + token,
                        Accept: 'application/vnd.github.inertia-preview+json',
                    },
                })
            })
            .then((res) => {
                resolve(res.data)
            })
            .catch((error) => {
                reject(error)
            })
    })
}

const addIssueToColumn = (columnID, issueID, token) => {
    return new Promise((resolve, reject) => {
        axios
            .post(
                `https://api.github.com/projects/columns/${columnID}/cards`,
                {
                    contentId: issueID,
                },
                {
                    headers: {
                        Authorization: 'token ' + token,
                        Accept: 'application/vnd.github.inertia-preview+json',
                    },
                }
            )
            .then((res) => {
                resolve(res.data)
            })
            .catch((error) => {
                reject(error)
            })
    })
}

const getTranslationSignUps = (token) => {
    return new Promise((resolve, reject) => {
        axios
            .get('https://api.github.com/repos/tytot/attendance-for-google-meet/issues/15', {
                headers: {
                    Authorization: 'token ' + token,
                    Accept: 'application/vnd.github.v3+json',
                },
            })
            .then((res) => {
                const parsed = res.data.body
                    .split('\n')
                    .slice(2)
                    .map((row) => {
                        return row
                            .trim()
                            .split('|')
                            .slice(1, 6)
                            .map((cell) => cell.trim())
                    })
                    .reduce((acc, curr) => {
                        acc[curr[2]] = {
                            taken: curr[0] === '&#128505;',
                            language: curr[1],
                            users: curr[3],
                            issue: curr[4],
                        }
                        return acc
                    }, {})
                resolve(parsed)
            })
            .catch((error) => {
                reject(error)
            })
    })
}

const postTranslationSignUps = (table, token) => {
    return new Promise((resolve, reject) => {
        axios
            .patch(
                'https://api.github.com/repos/tytot/attendance-for-google-meet/issues/15',
                { body: table },
                {
                    headers: {
                        Authorization: 'token ' + token,
                        Accept: 'application/vnd.github.v3+json',
                    },
                }
            )
            .then((res) => {
                resolve(res.data)
            })
            .catch((error) => {
                reject(error)
            })
    })
}

const actions = [
    'opened',
    'edited',
    'deleted',
    'closed',
    'reopened',
    'assigned',
    'unassigned',
    'labeled',
    'unlabeled',
    'transferred',
]

const processEvent = (payload) => {
    if (payload.hasOwnProperty('issue') && actions.includes(payload.action)) {
        const issue = payload.issue
        const title = issue.title
        const assignees = issue.assignees.map((user) => '@' + user.login)
        const labels = issue.labels.map((label) => label.name)
        const code = title.split(' ')[0]

        auth.generateIAT()
            .then((token) => {
                getTranslationSignUps(token)
                    .then((signups) => {
                        let updated = false
                        if (signups.hasOwnProperty(code)) {
                            if (
                                payload.action !== 'deleted' &&
                                assignees.length > 0 &&
                                labels.includes('i18n')
                            ) {
                                if (!signups[code].taken) {
                                    signups[code].taken = true
                                    updated = true
                                }
                                const newUsers = assignees.join(', ')
                                if (signups[code].users !== newUsers) {
                                    signups[code].users = newUsers
                                    updated = true
                                }
                                const newIssue = '#' + issue.number
                                if (signups[code].issue !== newIssue) {
                                    signups[code].issue = newIssue
                                    updated = true
                                }
                            } else {
                                if (signups[code].taken) {
                                    signups[code].taken = false
                                    signups[code].users = ''
                                    signups[code].issue = ''
                                    updated = true
                                }
                            }
                        } else if (
                            payload.action === 'edited' &&
                            payload.changes.hasOwnProperty('title')
                        ) {
                            const prevCode = payload.changes.title.from.split(' ')[0]
                            if (signups.hasOwnProperty(prevCode) && signups[prevCode].taken) {
                                signups[prevCode].taken = false
                                signups[prevCode].users = ''
                                signups[prevCode].issue = ''
                                updated = true
                            }
                        }
                        if (updated) {
                            return postTranslationSignUps(table.buildTable(signups), token)
                        }
                        return Promise.resolve(false)
                    })
                    .then((res) => {
                        if (res) {
                            console.log('Successfully updated sign-up table.')
                        }
                    })
                    .catch((error) => {
                        console.error(error)
                    })
            })
            .catch((error) => console.error(error))
    }
}

exports.processEvent = processEvent