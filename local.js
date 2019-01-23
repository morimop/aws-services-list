const { main } = require("./index")
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

if (process.argv[2]) {
  console.log("arg chk ok.start process.")
  const lang = process.argv[2]
  const docType = process.argv[3] || "documents"
  console.log("scrap " + docType)
  const callback = (err, data) => {
    console.debug(data)
    if (data && data.content) {
      fs.writeFileSync(
        "./tmp/" + docType + "-" + lang + ".json",
        JSON.stringify(data.content)
      )
    }
  }
  main({ lang: lang, docType: docType }, null, callback)
} else {
  console.log("node local.js [lang] [docType]")
}
