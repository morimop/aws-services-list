let client = require('cheerio-httpcli');
const fs = require("fs");

let targetUri = 'https://aws.amazon.com/';
let lang = '';

async function scrap() {
  lang = process.argv[2] || 'en';
  if(lang != 'en') {
    targetUri = targetUri + lang + '/';
  }
  client.set('headers', {
    'Accept-Language': lang
  });
  console.log('Accept-Language:'+ lang);
  console.log("goto:" + targetUri);
  client.fetch(targetUri,(err, $, res, body)=>{
    const contents = $('a.lb-trigger');
    let services = [];
    [].map.call(contents, (d)=>{
      const headerTitle = $(d).text().trim();
      const serviceList = [].map.call($(d).parent().find('div.lb-content-item'),(l)=>{
        const aNode = $(l).children('a');
        let srvHref = aNode.attr('href').replace('/'+lang,"").replace(/\?.*$/,"");
        if (srvHref.startsWith('/')) {
          srvHref = targetUri + srvHref.slice(1);
        }
        return {
          name: aNode.text().trim().replace(aNode.children().text(),""),
          href: srvHref
        };
      });
      if(serviceList && serviceList.length > 0) {
        services.push({
          category: headerTitle,
          services: serviceList
        });
      }
    });
    //console.log(JSON.stringify(services,null,2)); return;
    for (let sg of services) {
      for (let s of sg.services){
        const slaHref = s.href+'sla/';
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
