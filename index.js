let client = require('cheerio-httpcli');
const fs = require("fs");
if(!fs.existsSync('./tmp')) {
  fs.mkdir('./tmp',(err)=>{
    console.log('./tmp folder created.');
    if(err) {
      console.log(err);
      process.exit(2);
    }
  });
} else if(!fs.statSync('./tmp').isDirectory()){
  console.log('./tmp must be folder');
  process.exit(1);
}

let targetUri = 'https://aws.amazon.com/';
let lang = '';

async function scrap() {
  if (process.argv[2]) {
    lang = process.argv[2];
    console.log('switch-language:'+ lang);
    if(lang != 'en') {
      targetUri = targetUri + lang + '/';
    }
    client.set('headers', {
      'Accept-Language': lang
    });
  }
  console.log("goto:" + targetUri);
  client.fetch(targetUri,(err, $, res, body)=>{
    const contents = $('div.aws-nav-mm-section');
    let services = [];
    [].map.call(contents, (d)=>{
      const headerTitle = $(d).children('div.aws-nav-mm-section-header').text().trim();
      const serviceList = [].map.call($(d).find('li'),(l)=>{
        let srvHref = $(l).children('a').attr('href');
        if (srvHref.startsWith('/')) {
          srvHref = targetUri + srvHref.slice(1);
        }
        return {
          name: $(l).text(),
          href: srvHref
        };
      });
      services.push({
          category: headerTitle,
          services: serviceList
      });
    });
    //console.log(JSON.stringify(services,null,2));
    for (let sg of services) {
      for (let s of sg.services){
        console.log(s.href);
        let res = {};
	try {
	  res = client.fetchSync(s.href);
	} catch(e) {
	  console.log(e);
	  console.log('skip fetch content.');
	  s.abstruct = 'N/A';
	  continue;
	}
        const abstruct = (($) => {
          if($('main').length == 1){
            const pElements = [].filter.call(
              $('main').find('p'),
              (pn)=>{
                if($(pn).find('a').length == 0){
                  return true;
                };
                return ($(pn).find('a').text() != $(pn).text());
              });
            let pText = $(pElements[0]).text().trim();
            if (pElements.length > 1) {
                pText = pText + "\r\n" + $(pElements[1]).text().trim();
            }
            if (pText.length == 0 && ($('div.lb-txt-normal').length > 0)) {
              // Elemental MediaConvert or Elemental MediaLive
              pText = $($('div.lb-txt-normal')[0]).text().trim();
            }
            return pText;
          }
          return $('p').parent().text().trim();
        })(res.$);
        s.abstruct = abstruct;
        console.log(abstruct);
      };
    };
    fs.writeFileSync("./tmp/services"+lang+".json", JSON.stringify(services));
  });
}

scrap().catch(err => {
    console.error("Error.");
    console.log(err);
});
