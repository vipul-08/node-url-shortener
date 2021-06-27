var express = require('express');
var router = express.Router();

const fs = require('fs');

const shortenedUrlCode = () => {
  const payload = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let shortUrl = [];
  for (let i = 0 ; i < 6 ; i++) {
      const index = Math.floor(Math.random()*payload.length);
      shortUrl = [...shortUrl, payload[index]];
  }
  return shortUrl.join('');
};

/* GET home page. */
router.get('/:shortCode', function(req, res, next) {
    let rawdata = fs.readFileSync('./db.json');
    let jsonArray = JSON.parse(rawdata);
    const shortCode = req.params.shortCode;
    const obj = jsonArray.find((ob) => ob.shortCode === shortCode);
    if (obj) {
        jsonArray = jsonArray.map((o) => (o.shortCode === shortCode) ? {...obj, lastSeenDate: new Date().toISOString(), redirectCount: o.redirectCount+1} : o);
        fs.writeFile('./db.json', JSON.stringify(jsonArray), (err) => {
            if (err) throw err;
            res.writeHead(302, {
                'Location': obj.url,
            });
            res.end();
        });
    } else {
        res.status(404).json({
            ERROR: "Not Found",
        });
    }
});

router.get('/:shortCode/stat', function(req, res, next) {
    let rawdata = fs.readFileSync('./db.json');
    let jsonArray = JSON.parse(rawdata);
    const shortCode = req.params.shortCode;
    const obj = jsonArray.find((ob) => ob.shortCode === shortCode);
    if (obj) {
        const { startDate, lastSeenDate, redirectCount } = obj;
        res.json({
            startDate,
            lastSeenDate,
            redirectCount,
        });
    } else {
        res.status(404).json({
            ERROR: "Not Found",
        });
    }
});

router.post('/shorten', function(req, res, next) {
    const url = req.body.url;
    if (url == null) {
        res.status(400).send({
            ERROR: "url not present",
        });
    }
    if (req.body.shortCode == null) {
        let rawdata = fs.readFileSync('./db.json');
        let jsonArray = JSON.parse(rawdata);
        while (true) {
            const shortCode = shortenedUrlCode();
            if (!jsonArray.find((ob) => ob.shortCode === shortCode)) {
                const obj = {
                    url,
                    shortCode,
                    startDate: new Date().toISOString(),
                    lastSeenDate: null,
                    redirectCount: 0,
                };
                jsonArray.push(JSON.parse(JSON.stringify(obj)));
                fs.writeFile('./db.json', JSON.stringify(jsonArray), (err) => {
                    if (err) throw err;
                    res.status(201).send({ shortCode });
                });
                break;
            }
        }
    }
    else {
        let rawdata = fs.readFileSync('./db.json');
        let jsonArray = JSON.parse(rawdata);
        const shortCode = req.body.shortCode;
        if (shortCode.length < 4 || !shortCode.match(/^[0-9a-zA-Z]+$/)) {
            res.status(422).send({
                ERROR: "Invalid short url",
            })
        }
        else if (!jsonArray.find((ob) => ob.shortCode === shortCode)) {
            const obj = {
                url,
                shortCode,
                startDate: new Date().toISOString(),
                lastSeenDate: null,
                redirectCount: 0,
            };
            jsonArray.push(JSON.parse(JSON.stringify(obj)));
            fs.writeFile('./db.json', JSON.stringify(jsonArray), (err) => {
                if (err) throw err;
                res.status(201).send({ shortCode });
            });
        } else {
            res.status(409).send({
                ERROR: "Already Exists",
            });
        }
    }
});

module.exports = router;
