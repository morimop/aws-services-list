const launchChrome = require("@serverless-chrome/lambda")
const CDP = require("chrome-remote-interface")
const puppeteer = require("puppeteer")
const { scrap } = require("./scrap")

const fs = require("fs")
if (!fs.existsSync("./tmp")) {
  fs.mkdir("./tmp", err => {
    console.log("./tmp folder created.")
    if (err) {
      console.log(err)
      process.exit(2)
    }
  })
} else if (!fs.statSync("./tmp").isDirectory()) {
  console.log("./tmp must be folder")
  process.exit(1)
}

module.exports.main = async (event, context, callback, chrome) => {
  console.log("event => " + JSON.stringify(event))
  let slsChrome = null

  try {
    // 前処理
    // serverless-chrome を起動し、Puppeteer から Web Socket で接続する
    console.log("launch chrome...")
    slsChrome = await launchChrome({
      flags: [
        "--headless",
        "--disable-gpu"
        // '--no-sandbox',
        // '--single-process',
        // '--window-size=1048,743',
        // '--user-data-dir=/tmp/user-data',
        // '--hide-scrollbars',
        // '--enable-logging',
        // '--log-level=0',
        // '--v=99',
        // '--data-path=/tmp/data-path',
        // '--ignore-certificate-errors',
        // '--homedir=/tmp',
        // '--disk-cache-dir=/tmp/cache-dir',
        // '--disable-setuid-sandbox',
        // '--remote-debugging-port=9222',
      ]
    })
    const versionInfo = await CDP.Version().catch(error => {
      console.log(error)
      callback(null, {
        statusCode: 500,
        body: JSON.stringify({
          error
        })
      })
    })

    console.log(versionInfo)
    const browser = await puppeteer.connect({
      browserWSEndpoint: versionInfo.webSocketDebuggerUrl
    })
    await scrap(browser, event.lang, fs)
      .catch(err => {
        console.error("Error.")
        console.log(err)
        callback(err, {
          statusCode: 500,
          body: JSON.stringify({
            versionInfo,
            chrome
          })
        })
      })
      .then(() => {
        console.log("done.")
        callback(null, {
          statusCode: 200,
          body: JSON.stringify({
            versionInfo,
            chrome
          })
        })
      })
  } catch (err) {
    console.error(err)
    console.log({ result: "NG" })
  } finally {
    if (slsChrome) {
      await slsChrome.kill()
    }
  }
}
