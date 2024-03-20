const express = require('express');
const app = express();
const onFinished = require('on-finished')
const {google} = require('googleapis')
const cheerio = require("cheerio")
const needle = require("needle")
const psl = require('psl')
const fetch = require('node-fetch');
const session = require('express-session');
const crypto = require('crypto');
const mysql = require("mysql");
const cors = require("cors")

// MIDDLEWARE

app.set("trust proxy", 1)

app.use(cors({
  origin: "http://localhost:3001",
  credentials: true
}))

app.use(session({
  secret: 'uuVU6mNAd4SreOjPjeMpaiOM3Grweyqw',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 360000000 },
}));

const requireLogin = (req, res, next) => {
  res.set('Access-Control-Allow-Origin', 'http://localhost:3001')
  res.set('Access-Control-Allow-Credentials', true)
  if (!req.session.user_id) {
    res.status(401).json({ error: 'Unauthorized' });
  } else {
    express.json()(req, res, next);
  }
};

// ROUTES

app.post('/sign-up', express.json(), async (req, res) => {
  res.set('Access-Control-Allow-Origin', 'http://localhost:3001')
  res.set('Access-Control-Allow-Credentials', true)
  const connection = mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      database: 'nea'
  });

  connection.connect();

  console.log(req.body)

  const username = req.body.username;
  const uuid = crypto.randomUUID();

  function hashPassword(password, salt) {
    const hash = crypto.createHash('sha256');
    hash.update(password + salt);
    return hash.digest('hex');
  }

  function generateRandomSalt(length = 16) {
    return crypto.randomBytes(length).toString('hex');
  }

  const userPassword = req.body.password;
  const salt = generateRandomSalt();

  const hashedPassword = hashPassword(userPassword, salt);

  const userFields = { 
    user_id: uuid, 
    username: username, 
    password: hashedPassword, 
    salt: salt,
    sites: ""
  }

  const query = 'INSERT INTO users SET ?;';

  connection.query(query, userFields, (error, results, fields) => {
    if (error) throw error;
    res.send(JSON.stringify({ uid: userFields.user_id }))
  });

  connection.end();
})

app.post('/sign-in', express.json(), async (req, res) => {
  res.set('Access-Control-Allow-Origin', 'http://localhost:3001')
  res.set('Access-Control-Allow-Credentials', true)
  const connection = mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      database: 'nea'
  });

  connection.connect();

  const username = req.body.username;
  const password = req.body.password;

  function hashPassword(password, salt) {
    const hash = crypto.createHash('sha256');
    hash.update(password + salt);
    return hash.digest('hex');
  }

  function validatePassword(enteredPassword, storedHash, salt) {
    const enteredPasswordHash = hashPassword(enteredPassword, salt);
    return enteredPasswordHash === storedHash;
  }

  const query = 'SELECT password, salt, user_id FROM users WHERE username=?;';

  connection.query(query, [username], (error, results, fields) => {
      if (error) throw error;
      console.log(results[0].password)
      if (results[0]) {
        if(validatePassword(password, results[0].password, results[0].salt)){
          req.session.user_id = results[0].user_id;
          req.session.save()
          res.send(JSON.stringify({ success: true, user_id: results[0].user_id }));
        } else {
          res.status(401).send(JSON.stringify({ error: 'Invalid credentials' }));
        }
      } else {
        res.status(502).send(JSON.stringify({ error: 'DB error occurred' }));
      }
  });
 
  connection.end();
})

app.get('/user', requireLogin, async (req, res) => {
  res.set('Access-Control-Allow-Origin', 'http://localhost:3001')
  res.set('Access-Control-Allow-Credentials', true)
  const connection = mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      database: 'nea'
  });

  const userId = req.session.user_id;
  console.log(req.session)

  connection.connect();

  const query = 'SELECT * FROM users WHERE user_id=?;';

  connection.query(query, [userId], (error, results, fields) => {
    if (error) throw error;
    res.send(JSON.stringify({ user_id:results[0].user_id, username:results[0].username, sites:results[0].sites }))
  });

  connection.end();
})

app.post('/logout', (req, res) => {
  req.session.destroy();
  res.send(JSON.stringify({ success: true }));
});

app.get('/reports', requireLogin, async (req, res) => {
  res.set('Access-Control-Allow-Origin', 'http://localhost:3001')
  res.set('Access-Control-Allow-Credentials', true)
  const connection = mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      database: 'nea'
  });

  const userId = req.session.user_id;
  console.log(req.session)

  connection.connect();

  const query = 'SELECT * FROM reports WHERE user_id=? ORDER BY created_at DESC;';

  connection.query(query, [userId], (error, results, fields) => {
    if (error) throw error;
    console.log(results)
    res.send(JSON.stringify({ reports:results }))
  });

  connection.end();
})

app.post('/edit-sites', requireLogin, express.json(), async (req, res) => {
  res.set('Access-Control-Allow-Origin', 'http://localhost:3001')
  res.set('Access-Control-Allow-Credentials', true)
  const connection = mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      database: 'nea'
  });

  const userId = req.session.user_id;

  connection.connect();
  const query = 'SELECT sites FROM users WHERE user_id=?;';

  connection.query(query, [userId], (error, results, fields) => {
    if (error) throw error;
    console.log(results)
    if (req.body.modifyType === "add") {
      addSite(results[0].sites, req.body.domain)
    } else if (req.body.modifyType === "delete") {
      deleteSite(results[0].sites, req.body.domain)
    }
  });

  const addSite = (current, newDomain) => {
    let toUpdateTo = [newDomain, ...current.split(",")].filter(function(e){return e});
    console.log(toUpdateTo)
    const query = 'UPDATE users SET sites = ? WHERE user_id=?;';

    connection.query(query, [`${toUpdateTo.join(",")}`, userId], (error, results, fields) => {
      if (error) throw error;
      console.log(results)
      res.send(JSON.stringify({ sites:toUpdateTo }))
    });
  }
  
  const deleteSite = (current, newDomain) => {
    let toUpdateTo = current.split(",").filter(el => el !== newDomain).filter(function(e){return e});
    const query = 'UPDATE users SET sites = ? WHERE user_id=?;';

    connection.query(query, [`${toUpdateTo.join(",")}`, userId], (error, results, fields) => {
      if (error) throw error;
      console.log(results)
      res.send(JSON.stringify({ sites:toUpdateTo }))
    });
  }

})

app.get('/get-kws', requireLogin, async (req, res) => {
  res.set('Access-Control-Allow-Origin', 'http://localhost:3001')
  res.set('Access-Control-Allow-Credentials', true)
  res.set("Content-type", "text/plain");
  res.set("Access-Control-Expose-Headers","X-Report-Id")
  if (req.query.seed.length == 0) {
      return [];
  }
  if(req.query.lang.length == 0){
    res.sendStatus(500)
  }
  if(req.query.geo.length == 0){
    res.sendStatus(500)
  }
  const connection = mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      database: 'nea'
  });

  connection.connect()

  const findIdQuery = 'SELECT MAX(id) FROM reports;';
  connection.query(findIdQuery, (error, results, fields) => {
    if (error) throw error;

    let id = parseInt(results[0]['MAX(id)'])+1

    res.header('X-Report-Id', String(id || 0));
  });

  const userID = req.session.user_id

  const seed = req.query.seed
  const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));
  async function postData(keyword) {
    var first_part = "https://suggestqueries.google.com/complete/search?";
    var url1 = first_part + 'q=' + keyword + '&hl=' + req.query.lang + '&gl=' + req.query.geo + "&client=chrome&_=" + ('' + Math.random()).replace(/\D/g, "");
    const response = await fetch(url1, {
        method: 'GET'
    }).catch(e => console.log(e))
    const contents = await response.json()
    let chunk = []
    for (let p = 0; p < contents[1].length; p++) {
      allKeywords.push(contents[1][p])
      chunk.push(contents[1][p])
    }
    res.write(chunk.join(","))
  }

  onFinished(req, function () {
    const query = 'INSERT INTO reports SET ?;';

    let dbKeywords = [...allKeywords.map((item) => {return {kw:item, serp:null, vols:{volume:null,cpc:null,trend:null,keyword:null}}})]

    const insertFields = { 
      user_id: userID,
      report_content: JSON.stringify({report:[...dbKeywords]}),
      keyword: req.query.seed,
      location: `${req.query.geo},${req.query.lang}`
    }  
  
    connection.query(query, [insertFields], (error, results, fields) => {
      if (error) throw error;
      let reportId = results.insertId

      connection.end();

      console.log(reportId);
      return res.end();
    });
  })

  let allKeywords = []
  if(allKeywords.length == 0){
    var j = 0;
    for (j = 0; j < 26; j++) {
      if (!res.writableEnded) {
          if (allKeywords.length < 1000){
            var chr = String.fromCharCode(97 + j);
            await postData(seed + ' ' + chr)
            await snooze(1000)
          } else {
          return res.end()
        }
      }
    }
  }

    if (allKeywords.length > 0) {
      var k = 0;
        for (k = 0; k < allKeywords.length; k++) {
          if (!res.writableEnded) {
            if (allKeywords.length < 1000){
                await postData(allKeywords[k])
                await snooze(1000)
            } else {
            return res.end()
            }
          }
  }}

  return res.end();
})

app.get('/analyse-kw', async (req, res) => { 
  res.set('Access-Control-Allow-Origin', 'http://localhost:3001')
  res.set('Access-Control-Allow-Credentials', true)
  if (req.query.seed.length == 0) {
      return [];
  }
  const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    database: 'nea'
  });

  async function getSERP(val) {
      const response = await fetch(`https://google.serper.dev/search`, {
          method: 'POST',
          headers: { 
            'X-API-KEY': '3863184239bad3e4e65c5029ba5c9a9b980c99cf', 
            'Content-Type': 'application/json'
          },
          body:JSON.stringify({
            "q": req.query.seed,
            "gl": req.query.geo.toLowerCase(),
            "hl": req.query.lang.toLowerCase()
          })
      })
      return response.json()
  }

  const geos = [
      [
          "AU",
          "2036"
      ],
      [
          "BR",
          "2076"
      ],
      [
          "CA",
          "2124"
      ],
      [
          "CN",
          "2156"
      ],
      [
          "EG",
          "2818"
      ],
      [
          "FR",
          "2250"
      ],
      [
          "DE",
          "2276"
      ],
      [
          "IN",
          "2356"
      ],
      [
          "IE",
          "2372"
      ],
      [
          "IL",
          "2376"
      ],
      [
          "JP",
          "2392"
      ],
      [
          "KR",
          "2410"
      ],
      [
          "PK",
          "2586"
      ],
      [
          "PT",
          "2620"
      ],
      [
          "RO",
          "2642"
      ],
      [
          "RU",
          "2643"
      ],
      [
          "SA",
          "2682"
      ],
      [
          "SG",
          "2702"
      ],
      [
          "ZA",
          "2710"
      ],
      [
          "ES",
          "2724"
      ],
      [
          "SE",
          "2752"
      ],
      [
          "CH",
          "2756"
      ],
      [
          "TR",
          "2792"
      ],
      [
          "UA",
          "2804"
      ],
      [
          "AE",
          "2784"
      ],
      [
          "GB",
          "2826"
      ],
      [
          "VE",
          "2862"
      ],
      [
          "US",
          "2840"
      ]
  ]

  let langConstants = ["ar,1019", "bn,1056", "bg,1020", "ca,1038", "zh,1017", "zh,1018", "hr,1039", "cs,1021", "da,1009", "nl,1010", "en,1000", "et,1043", "tl,1042", "fi,1011", "fr,1002", "de,1001", "el,1022", "gu,1072", "he,1027", "hi,1023", "hu,1024", "is,1026", "id,1025", "it,1004", "ja,1005", "kn,1086", "ko,1012", "lv,1028", "lt,1029", "ms,1102", "ml,1098", "mr,1101", "no,1013", "fa,1064", "pl,1030", "pt,1014", "pa,1110", "ro,1032", "ru,1031", "sr,1035", "sk,1033", "sl,1034", "es,1003", "sv,1015", "ta,1130", "te,1131", "th,1044", "tr,1037", "uk,1036", "ur,1041", "vi,1040"]

  getSERP().then(async (dataB) => {
    console.log(dataB)
   let data = dataB
   let pplAlsoAsk = []  
   let relatedSearches = []  
   let serpResults = []
   let totalWords = 0;
   (async function(next) {
       async function getWordCount(url) {
           try {
               let timeA = new Date().getTime()
               let timeDiff = 0
               const response = await needle('get', url)
               .then(function(resp) {
                   timeDiff = Math.floor(new Date().getTime() - timeA) / 1000
                   if (resp.body) {
                       return resp.body
                   } else {
                       return "<html><body><p>null</p></body></html>"
                   }
               })
               .catch(function(err) {
                   console.log(err)
               });

               try {
                   if(typeof response === 'string'){
                       const $ = cheerio.load(response);
               
                       const words = $('body *').contents().map(function() {
                           return (this.tagName === 'h1' || 'h2' || 'h3' || 'h4' || 'h5' || 'h6' || 'p' || 'td' || 'li' || 'code' || 'a') ? $(this).text() : '';
                       }).get().length;

                       console.log([words, timeDiff])

                      return [words, timeDiff]
                   } else {
                       return [404, 0]
                   }
               } catch (error) {
                   console.log(error)
                   return [404, 0]
               }
           }
           catch(e) {
               console.log(e)
               return [404, 0]
           }
       }
       let promises = []
       let elems = []
       data.organic.forEach( async (elem) => {
          promises.push(getWordCount(elem.link))
          elems.push(elem)
       })
       Promise.all(promises).then((results) => {
           results.forEach((result, ind) => {
              fetch(`http://domdetailer.com/api/checkDomain.php?domain=${psl.parse(new URL(elems[ind].link).hostname).domain}&apikey=LL2K7MBYMD9Y1&majesticChoice=root&app=nea`, {method:"GET"} ).then( async (stats) => {
                  let backlinkStats = await stats.json()
                  let links = backlinkStats.mozLinks
                  let da = backlinkStats.mozDA
                  serpResults.push({ rank:elems[ind].position, title:elems[ind].title, url:elems[ind].link, desc:elems[ind].snippet, da: da, links:links, wc:result[0], timeFetch:result[1] })
                  totalWords += result[0]
                  if (serpResults.length == data.organic.length) {
                      next()
                  }
              })
           })
       })
       .catch((e) => console.log(e))
   }(async function() {
       data.peopleAlsoAsk ? data.peopleAlsoAsk.forEach((elem) => {
           pplAlsoAsk.push(elem.question)
       }) : null
       data.relatedSearches ? data.relatedSearches.forEach((elem) => {
           relatedSearches.push(elem.query)
       }) : null
       let avgW = Math.floor(totalWords/serpResults.length)
       async function getserpscore() {
           let forumSites = ["reddit.com","quora.com","stackexchange.com","stackoverflow.com","tomshardware.com","askinglot.com","wix.com","blogspot.com","wordpress.com","pinterest.com","facebook.com","twitter.com","linkedin.com","yahoo.com",
           "wordpress.org",
           "github.com",
           "pinterest.com",
           "twitter.com"]
            const MIN_DA_THRESHOLD = 30;
            const LOW_HANG_THRESHOLD = 2;
            const AVG_DA_THRESHOLD_1 = 30;
            const AVG_DA_THRESHOLD_2 = 35;
            const AVG_DA_THRESHOLD_3 = 45;
            const MIN_AVG_W = 1000;
            const MIN_SERP_SCORE = 1;
            const MAX_SERP_SCORE = 5;
            let serpScore = 5;
            let lowHang = 0;
            let avgDa = 0;
          
            for (const result of serpResults) {
              const domain = psl.parse(result.url).domain;
          
              if (forumSites.includes(domain)) {
                serpScore -= 1;
              }
          
              if (parseInt(result.da) < MIN_DA_THRESHOLD) {
                lowHang += 1;
              }
          
              avgDa += parseInt(result.da);
            }
          
            if (lowHang >= LOW_HANG_THRESHOLD) {
              serpScore -= 3;
            } else if (lowHang >= 1) {
              serpScore -= 2;
            }
          
            const avgDaThreshold = avgDa / serpResults.length;
          
            if (avgDaThreshold < AVG_DA_THRESHOLD_1) {
              serpScore -= 3;
            } else if (avgDaThreshold < AVG_DA_THRESHOLD_2) {
              serpScore -= 2;
            } else if (avgDaThreshold < AVG_DA_THRESHOLD_3) {
              serpScore -= 1;
            }
          
            if (avgW < MIN_AVG_W) {
              serpScore -= 1;
            }
          
            return Math.max(MIN_SERP_SCORE, Math.min(serpScore, MAX_SERP_SCORE));
       }
       await getserpscore().then( async (serpScore) => {
          serpResults = serpResults.sort((a, b) => a.rank - b.rank)
          let targetGeo = geos.filter(val => val[0] == req.query.geo)
          let targetLang = langConstants.filter(el => el.split(",")[0] == req.query.lang.toLowerCase()) 
          const oauth2Client = new google.auth.OAuth2(
              "676236671555-9o4thofikc2j19mgsu8r2fsejukd1bkl.apps.googleusercontent.com",
              "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",
              "http://localhost:3001/dashboard"
          );
            
            oauth2Client.setCredentials({
              refresh_token: "1//04HqttnVanqdZCgYIARAAGAQSNwF-L9IrfKZxucddvJXup5ekrqIhPbvNy06Bu8Lkxk6puAI7ZlBZYfj9ohq2F7r_Y3sEacrVhtU" 
            });
     
            oauth2Client.getAccessToken((err, token) => {
             if (err) {
                 console.log(err);
                 return;
             }
            fetch('https://googleads.googleapis.com/v14/customers/9053142011:generateKeywordHistoricalMetrics', {
                method: 'POST',
                headers: {
                    'developer-token': 'tyOzrJ3BDYUbndWp8bZBkQ',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    'keywords': [req.query.seed],
                    'language': `languageConstants/${targetLang[0].split(",")[1]}`,
                    'geoTargetConstants': [`geoTargetConstants/${targetGeo[0][1]}`],
                    "keywordPlanNetwork": "GOOGLE_SEARCH",
                    "historicalMetricsOptions":{"includeAverageCpc":true}
                })
            }).then((res) => res.json()).then((finals) => {
                let sendValues = []
                let dataFromGA = finals.results
     
                dataFromGA.forEach((value, index, array) => { 
                    let temHistory = value !== undefined ? value !== null ? value.keywordMetrics !== undefined || value.keywordMetrics !== undefined ? value.keywordMetrics.monthlySearchVolumes.slice(0, 12).map(val => ({month: val.month.substring(0, 1)+val.month.substring(1, val.month.length).toLowerCase()+" "+val.year, searches: parseInt(val.monthlySearches)})) || [{month: "June 2023", searches: 0}, {month: "May 2023", searches: 0}, {month: "April 2023", searches: 0}] : [{month: "June 2023", searches: 0}, {month: "May 2023", searches: 0}, {month: "April 2023", searches: 0}] : [{month: "June 2023", searches: 0}, {month: "May 2023", searches: 0}, {month: "April 2023", searches: 0}] : [{month: "June 2023", searches: 0}, {month: "May 2023", searches: 0}, {month: "April 2023", searches: 0}]
                    let monthlyS = value !== undefined ? value !== null ? value.keywordMetrics !== null ? value.keywordMetrics !== undefined ? value.keywordMetrics.avgMonthlySearches !== undefined ? value.keywordMetrics.avgMonthlySearches : 0 : 0 : 0 : 0 : 0
                    let cpc = value !== undefined ? value !== null ? value.keywordMetrics !== null ? value.keywordMetrics !== undefined ? value.keywordMetrics.averageCpcMicros !== undefined ? parseInt(value.keywordMetrics.averageCpcMicros) > 0 ? parseFloat(parseInt(value.keywordMetrics.averageCpcMicros)/1000000).toFixed(2) : 0 : 0 : 0 : 0 : 0 : 0
                    let volTotal = 0
                    temHistory.forEach((element) => {
                      volTotal += element.searches
                    })
                    let volIncrease = volTotal/temHistory.length
                    sendValues.push({keyword: value.text, volume: monthlyS, trend: temHistory, cpc:cpc, volAvg:volIncrease })
                })

                let reportId = req.query.reportId
                let kw = req.query.seed

                connection.connect();

                const query = `SELECT report_content FROM reports WHERE id = ?;`;

                function invokeQuery(update, id) {
                  const query = `UPDATE reports SET report_content = ? WHERE id = ?;`;                
                  connection.query(query, [update, id], (error, results, fields) => {
                    if (error) throw error;  
                    console.log(results) 
                    connection.end();
                  });
                }
              
                connection.query(query, [parseInt(reportId)], (error, results, fields) => {
                  if (error) throw error;  
                  if (results) {
                    console.log(results)
                    let current = JSON.parse(results[0].report_content)
                    let removedFromArray = current.report.filter(item => item.kw !== kw)

                    let toUpdate = JSON.stringify({report:[{kw:kw, serp:{ results:serpResults,queries:pplAlsoAsk,avgWc:avgW,score:serpScore,rel:relatedSearches }, vols:sendValues[0] }, ...removedFromArray]})
                    invokeQuery(toUpdate, parseInt(reportId))
                  }
                });
                
                res.send(JSON.stringify({ serp:{ results:serpResults,queries:pplAlsoAsk,avgWc:avgW,score:serpScore,rel:relatedSearches }, vols:sendValues[0] }))
            }).catch((e) => console.log(e));
           })
       }).catch((e) => console.log(e));
   })).catch((e) => console.log(e));
  })
})

app.listen(6767, () => console.log('Running on port 6767'));