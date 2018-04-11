let client = require('cheerio-httpcli');
const fs = require("fs");

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
        const slaHref = s.href.split('?')[0]+'sla/';
        console.log(slaHref);
        let res = client.fetchSync(slaHref);
        const slaContent = (($) => {
          if ($('title').text().match(/404/)) {
            return $('title').text();
          } else {
            return slaHref;
          }
        })(res.$);
        s.sla = slaContent;
        console.log(' -> ' + slaContent);
      };
    };
    fs.writeFileSync("./tmp/sla_services"+lang+".json", JSON.stringify(services));
  });
}

scrap().catch(err => {
    console.error("Error.");
    console.log(err);
});
