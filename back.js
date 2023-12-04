var express = require('express')
var bodyParser = require('body-parser')
var app = express()
var cors = require('cors')

app.use(cors())
app.use(bodyParser.json())

app.set('port', (process.env.PORT || 4000))
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


let data = [];
app.get('/', function(req, res){
    res.json("Hello");
});

app.post('/api/SLM', function (req, res) {
	
    const SL = req.query.SLM;
    const timestamp = new Date();
    const SLRecord = {
        SL: SL,
        timestamp: timestamp
    };
	
    if (data.length >= 100) {
        // Remove the first element from the array
        data.shift();
    }
    data.push(SLRecord);
	res.send('success : ' + req.query.SLM)
})

app.get('/api/SLM', function (req, res) {
    res.json(data);
});

app.listen(app.get('port'), function () {
  console.log('run at port', app.get('port'))
})