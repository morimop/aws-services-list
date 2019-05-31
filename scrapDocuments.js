const baseUri = "https://docs.aws.amazon.com"

module.exports.scrapDocuments = async function(browser, lang) {
  let targetUri = baseUri
  if (lang != "en_us") {
    targetUri = targetUri + "/" + lang + "/index.html"
  }
  const page = await browser.newPage()
  const acceptLanguage = lang.split("_")[0] || "en"
  await page.setExtraHTTPHeaders({
    "Accept-Language": acceptLanguage
  })
  console.log("Accept-Language:" + acceptLanguage)
  console.log("goto:" + targetUri)
  await page.goto(targetUri, { waitUntil: "networkidle0" })

  let sourceContent = await page.evaluate(baseUri => {
    const contents = document.querySelectorAll("div.awsui-cards-card-container")
    let services = []
    ;[].map.call(contents, d => {
      const headerTitle = d
        .querySelector(".awsui-cards-card-header")
        .textContent.trim()
      const serviceList = [].map.call(
        d.querySelectorAll("awsdocs-service-link"),
        l => {
          let srvHref = l.getAttribute("href")
          if (srvHref.startsWith("/")) {
            srvHref = baseUri + srvHref
          }
          return {
            name: l.textContent.trim(),
            href: srvHref
          }
        }
      )
      if (serviceList && serviceList.length > 0) {
        services.push({
          category: headerTitle,
          services: serviceList
        })
      }
    })
    return services
  }, baseUri)
  //console.log(JSON.stringify(sourceContent, null, 2))
  for (let sc of sourceContent) {
    for (let s of sc.services) {
      console.debug("fetching: " + s.href)
      try {
        await page.goto(s.href + "#lang/" + lang, { waitUntil: "networkidle0" })
        const abstruct = await page.evaluate(() => {
          return document.querySelector(".awsdocs-banner-abstract")
            .textContent
        })
        s.abstruct = abstruct
        console.debug(abstruct)
      } catch (e) {
        console.log(e)
        console.log("skip fetch content.")
        s.abstruct = "N/A"
        continue
      }
    }
  }
  return sourceContent
}
