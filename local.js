const { main } = require("./index")

if (process.argv[2]) {
  console.log("arg chk ok.start process.")
  const lang = process.argv[2]
  const callback = (err, data) => {
    console.debug(data)
  }
  main({ lang: lang }, null, callback)
} else {
  console.log("node local.js [lang]")
}
