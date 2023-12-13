const express = require('express');
const app = express();
const CronJob = require('cron').CronJob;



const backendUrl = 'https://api-qqick.onrender.com'
const job = new CronJob('*/14 * * * *', async () => {
    console.log('RESTARTING SERVER')

    app.get(backendUrl, (req, res) => {
        try {
            if (res.status === 200) {
                console.log('SERVER IS UP', res.status)
            } else {
                console.error('SERVER IS DOWN', res.status)
            }
        } catch (error) {
            console.error('SERVER IS DOWN', error.message)
        }
    })

})

module.exports = {
    job
}
