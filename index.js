const launchChrome = require("@serverless-chrome/lambda")
const CDP = require("chrome-remote-interface")
const puppeteer = require("puppeteer")
const { scrapDocuments } = require("./scrapDocuments")
const { scrapProducts } = require("./scrapProducts")

module.exports.main = async (event, context, callback, chrome) => {
  console.log("event => " + JSON.stringify(event))
  if (["documents", "products"].indexOf(event.docType) == -1) {
    console.log("bad request")
    callback(null, {
      statusCode: 400,
      body: JSON.stringify(event)
    })
    process.exit(3)
  }
  const scrap = event.docType == "documents" ? scrapDocuments : scrapProducts
  let slsChrome = null

  try {
    // 前処理
    // serverless-chrome を起動し、Puppeteer から Web Socket で接続する
    console.log("launch chrome...")
    var chromeFlags = [
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
    if (process.env.HTTPS_PROXY) {
      chromeFlags.push("--proxy-server=" + process.env.HTTPS_PROXY)
    }
    slsChrome = await launchChrome({
      flags: chromeFlags
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
    await scrap(browser, event.lang)
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
      .then(data => {
        console.log("done.")
        callback(null, {
          statusCode: 200,
          content: data,
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
