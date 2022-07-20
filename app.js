const chromeLauncher = require("chrome-launcher");
const lighthouse = require("lighthouse");
// const https = require('https')
const URL = 'https://www.erbis-website-stage.com/'


exports.handler = async (event, context, callback) => {
    console.log('start changing')
    const defaultFlags = [
        '--headless',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-zygote',
        '--no-sandbox',
        '--single-process',
        '--hide-scrollbars'
    ]
    const config = {
        extends: 'lighthouse:default',
        settings: {
            onlyAudits: [
                'first-meaningful-paint',
                'speed-index',
                'interactive',
            ],
        },
    };

    function createLighthouse (url, options = {}, config) {
        options.output = options.output || 'html'
        const log = options.logLevel ? require('lighthouse-logger') : null
        if (log) {
            log.setLevel(options.logLevel)
        }
        const chromeFlags = options.chromeFlags || defaultFlags
        return chromeLauncher.launch({ chromeFlags})
            .then((chrome) => {
                options.port = chrome.port
                return {
                    chrome,
                    log,
                    start () {
                        return lighthouse(url, options, config)
                    }
                }
            })
    }

    const options = {logLevel: 'info', output: 'json', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo']}

    Promise.resolve()
        .then(() => createLighthouse(URL, options, config))
        .then(({chrome, start}) => {
            return start()
                .then((results) => {
                    const data = {
                        'Report is done for': results.lhr.finalUrl,
                        'Performance score was': results.lhr.categories.performance.score,
                        'Accessibility score was': results.lhr.categories.accessibility.score,
                        'Best-practices score was': results.lhr.categories['best-practices'].score,
                        'Seo score was':results.lhr.categories.seo.score,
                    }
                    console.log(data)
                    // new Promise((resolve, reject) => {
                    //     // Prepare the request.
                    //     const request = https.request(integrationURL, {
                    //         method: 'POST',
                    //         headers: {
                    //             // Specify the content-type as JSON and pass the length headers.
                    //             'Content-Type': 'application/json',
                    //         },
                    //         body: JSON.stringify(data)
                    //     }, (res) => {
                    //         // Once the response comes back, resolve the Promise.
                    //         res.on('end', () => resolve());
                    //     });
                    // });

                    chrome.kill().then(() => {
                        return data
                    })
                })
                .catch((error) => {
                    console.log(error, 'error')
                    chrome.kill().then(() => false)
                })
        })
        .catch((e) => {
            console.log(e)
            return false
        })
}