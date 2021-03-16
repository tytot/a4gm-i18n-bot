const fs = require('fs')
const jwt = require('jsonwebtoken')
const axios = require('axios')

generateJWT = () => {
    const privateKey = fs.readFileSync('sensitive/private.pem')
    const now = Math.floor(Date.now() / 1000)
    const issuer = JSON.parse(fs.readFileSync('sensitive/secrets.json')).app_id
    const token = jwt.sign(
        {
            iat: now,
            exp: now + 5 * 60,
            iss: issuer,
        },
        privateKey,
        { algorithm: 'RS256' }
    )
    return token
}

generateIAT = () => {
    return new Promise((resolve, reject) => {
        axios
            .get('https://api.github.com/app/installations', {
                headers: {
                    Authorization: 'Bearer ' + generateJWT(),
                    Accept: 'application/vnd.github.v3+json',
                },
            })
            .then((res) => {
                const installationID = res.data[0].id
                return axios.post(
                    `https://api.github.com/app/installations/${installationID}/access_tokens`,
                    {
                        repositories: ['attendance-for-google-meet'],
                    },
                    {
                        headers: {
                            Authorization: 'Bearer ' + generateJWT(),
                            Accept: 'application/vnd.github.v3+json',
                        },
                    }
                )
            })
            .then((res) => {
                resolve(res.data.token)
            })
            .catch((error) => {
                reject(error)
            })
    })
}

exports.generateIAT = generateIAT
