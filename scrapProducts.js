const baseUri = "https://aws.amazon.com"

module.exports.scrapProducts = async function(browser, lang) {
  const acceptLanguage = lang.split("_")[0] || "en"
  const pageLanguage = lang.split("_")[1] || "en"
  let targetUri = baseUri
  if (lang != "en_us") {
    targetUri = targetUri + "/" + pageLanguage
  }
  const page = await browser.newPage()
  await page.setExtraHTTPHeaders({
    "Accept-Language": acceptLanguage
  })
  console.log("Accept-Language:" + acceptLanguage)
  console.log("goto:" + targetUri)
  await page.goto(targetUri, { waitUntil: "networkidle0" })

  let sourceContent = await page.evaluate(baseUri => {
    const contents = document.querySelectorAll("[id^=products-]")
    let services = []
    ;[].map.call(contents, d => {
      const headerTitle = d.querySelector(".m-nav-txt-large").textContent.trim()
      const serviceList = [].map
        .call(d.querySelectorAll("div:not(.m-nav-txt-large)>a"), l => {
          let srvHref = l.getAttribute("href")
          if (srvHref.startsWith("/")) {
            srvHref = baseUri + srvHref
          }
          return {
            name: l.childNodes[0].textContent.trim(),
            href: srvHref
          }
        })
        .filter(s => {
          return s.name != ""
        })
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
      console.log("fetching: " + s.href)
      try {
        await page.goto(s.href, { waitUntil: "networkidle0" })
        const abstruct = await page.evaluate(() => {
          const contents = document
            .querySelector("#main,main")
            .querySelectorAll("p:not(.vjs-control-text),.lb-txt-normal")
          let returnString = null
          for (i = 0; i < contents.length; i++) {
            const innerA = contents[i].querySelector("a")
            if (innerA) {
              if (contents[i].textContent == innerA.textContent) {
                continue
              }
            }
            if (contents[i].closest('div.awsm')) {
              continue
            }
            let pickupText = contents[i].textContent.replace(/[ +\r\n]+/g, " ")
            if (returnString) {
              return returnString + "\r\n" + pickupText
            }
            returnString = pickupText
          }
          return returnString || "N/A"
        })
        s.abstruct = abstruct
        console.log(abstruct)
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
