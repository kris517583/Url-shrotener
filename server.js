
const express = require('express');
const cors = require('cors');
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false })
var admin = require("firebase-admin");
var validUrl = require('valid-url');
var serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();
const app = express();
// Basic Configuration
const port = process.env.PORT || 3000;
app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) 
{
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/api/hello', function(req, res) 
{
  res.json({ greeting: 'hello API' });
});
app.post('/api/shorturl',urlencodedParser, async function(req, res) 
{
  const collections = db.collection('urlshortner').doc('urls');
  var url = req.body.url;
  if(url_validator(url))
  {
    var result = {};
    const doc = await collections.get();
    if (!doc.exists) 
    {
      console.log('No such document!');
      res.json({ error: 'error occured' });
    } 
    else 
    {
      var shorturl = shortener(6);
      var index = doc.data()['index'];
      var list = doc.data()['originalurl'];
      var shorts = doc.data()['shorturls'];
      if(list.includes(url))
      {
        index = list.indexOf(url);
        result["original_url"] = list[index]
        result["short_url"] = shorts[index]
      }
      else
      {
        list.push(url);
        shorts.push(shorturl);
        index = index+1;
        const push = await collections.update({originalurl:list,index:index,shorturls:shorts});
        result["original_url"] = url
        result["short_url"] = shorturl
      }
    }
      await res.json(result);
    }
  else
  {
    res.json({ error: 'invalid url' })
  }
});
app.get('/api/shorturl/:id?', async function(req, res) 
{
  var short_url = req.params.id;
  console.log(short_url);
  const collections = db.collection('urlshortner').doc('urls');
  const doc = await collections.get();
  var shorts;
  if (!doc.exists) 
  {
    console.log('No such document!');
    res.json({ error: 'error occured' });
  } 
  else 
  {
    shorts = doc.data()["shorturls"];
    if(shorts.includes(short_url))
    {
        index = shorts.indexOf(short_url);
        if(validUrl.isWebUri(doc.data()["originalurl"][index]))
        {
          res.redirect(doc.data()["originalurl"][index]);
        }
        else
        {
          res.redirect("https://"+doc.data()["originalurl"][index])
        }
    }
    else
    {
      res.json({error:'Not Found'})
    }
  }
});
app.listen(port, function() 
{
  console.log(`Listening on port ${port}`);
});
function shortener(length) 
{
    var result='';
    var letters='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var total=letters.length;
    for(var i=0;i<length;i++) 
    {
      result = result + (letters.charAt(Math.floor(Math.random()*total)));
    }
    return result;
}

function url_validator(url)
{
  var expression = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi;
  var regex = new RegExp(expression);
  if(regex.test(url))
  {
    return true;
  }
  else
  {
    return false;
  }
}