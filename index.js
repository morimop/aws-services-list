const Chromy = require('chromy');
const fs = require("fs");

let targetUri = 'https://aws.amazon.com/';
let chromy = new Chromy();
let lang = '';

async function scrap() {
  await chromy.blockUrls(['*.ttf', '*.gif', '*.png', '*.jpg', '*.jpeg', '*.webp']);
  if (process.argv[2]) {
    lang = process.argv[2];
    console.log('switch-language:'+ lang);
    targetUri = targetUri + lang + '/';
  }
  console.log("goto:" + targetUri);
  await chromy.goto(targetUri);
  await chromy.wait(3000);
  const services = await chromy.evaluate(() => {
    const contents = document.querySelectorAll('div.aws-nav-mm-section');
    let services = [];
    [].map.call(contents, (d)=>{
      const headerTitle = d.querySelector('div.aws-nav-mm-section-header').textContent.trim();
      const serviceList = [].map.call(d.querySelectorAll('li'),(l)=>{
          return {name: l.textContent,href: l.querySelector('a').href};
      });
      services.push({
          category: headerTitle,
          services: serviceList
      });
    });
    return services;  
  });
  for (let sg of services) {
    for (let s of sg.services){
      console.log(s.href);
      await chromy.goto(s.href);
      await chromy.wait(500);
      const abstructEN = await chromy.evaluate(() => {
          if(document.querySelector('main')){
              const pElements = [].filter.call(
                document.querySelector('main').querySelectorAll('p'),
                (pn)=>{
                  if(!pn.querySelector('a')){
                    return true;
                  };
                  return (pn.querySelector('a').textContent != pn.textContent);
                });
              let pText = pElements[0].textContent.trim();
              if (pElements.length > 1) {
                  pText = pText + "\r\n" + pElements[1].textContent.trim();
              }
              return pText;
          }
          return document.querySelector('p').parentNode.textContent.trim();
      });
      s.abstructEN = abstructEN;
      console.log(abstructEN);
    };
  };

  await chromy.close();
  //console.log(JSON.stringify(services));
  fs.writeFileSync("./tmp/services"+lang+".json", JSON.stringify(services));
}

scrap().catch(err => {
    console.error("Error.");
    console.log(err);
    chromy.close();
});
