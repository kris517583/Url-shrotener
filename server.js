require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Database = require("@replit/database");
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false }) 
const app = express();
const db = new Database();
db.set("index",0);
db.set("list",[]);
db.set("shortlist",[]);

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
app.post('/api/shorturl/new',urlencodedParser,function(req, res) 
{
  var url = req.body.url_new;
  if(url_validator(url))
  {
    var shorturl = shortener(6);
    var index = 0;
    db.get("index").then(value =>{index = value});
    var list;
    var shorts;
    db.get("shortlist").then(value =>{shorts = value});
    db.get("list").then(value=>{
      list = value;
      if(list.includes(url))
      {
        index = list.indexOf(url);
        db.get(index).then(value=>{res.json(value)});
      }
      else
      {
        db.set(index,{"original_url":url,"short_url":shorturl}).then(() => 
        {
          list.push(url);
          db.set("index",index+1);
          db.set("list",list);
          shorts.push(shorturl);
          db.set("shortlist",shorts);
          db.get(index).then(value=>{res.json(value)});
        });
      }
    })
    .catch((error) => {res.json({error:error})});
  }
  else
  {
    res.json({ error: 'invalid url' })
  }
});
app.get('/api/shorturl/:id?', function(req, res) 
{
  var short_url = req.params.id;
  console.log(short_url);
  var shorts;
  db.get("shortlist").then(value =>
  {
    shorts = value;
    if(shorts.includes(short_url))
    {
        index = shorts.indexOf(short_url);
        db.get(index).then(value=>
        {
          console.log(value.original_url)
          res.redirect(value.original_url);
        });
    }
    else
    {
      res.json({error:'Not Found'})
    }
  });
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