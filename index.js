var express = require('express')
var bodyParser = require('body-parser')
var app = express()
var cors = require('cors')
var multer = require('multer');
var fs = require('fs');
var path = require('path');
var { InfluxDBClient, Point } = require('@influxdata/influxdb3-client');

app.use(cors())
app.use(bodyParser.json())

app.set('port', (process.env.PORT || 4000))
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.use(express.static('public'));
app.use(bodyParser.raw({ type: 'image/*', limit: '10mb' }));

const token = 'z-UccinXjSvvmdbLTEBAYTQp9nErpJVOLajQU7zgqlZgNwJUPaZOAUgYw55RoTa3vPmQ_x9eVFzSmCCxXl6QZA==';

const client = new InfluxDBClient({host: 'https://eu-central-1-1.aws.cloud2.influxdata.com', token: token})

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

let data = [];

app.get('/', function(req, res){
    
    res.json("Hello");
});

app.post('/api/SLM', function (req, res) {
	let database = `SLM`
    const SL = req.query.SLM;
    const T = req.query.Ti;
    const SLRecord = {
        SL: SL,
        timestamp: T
    };
    if (data.length >= 100) {
        // Remove the first element from the array
        data.shift();
    }
    const points =
    [
        Point.measurement("SL")
            .setFloatField("SLV", SL)
    ];
    for (let i = 0; i < points.length; i++) {
        const point = points[i];
        client.write(point, database)
            // separate points by 1 second
            .then(() => new Promise(resolve => setTimeout(resolve, 1000)));
    }
    
    data.push(SLRecord);
	res.send('success : ' + req.query.SLM)
})

app.get('/api/SLM', function (req, res) {
    res.json(data);
});

app.get('/api/His', function (req, res){
    let dateNow = new Date().toISOString().split('T')[0];
    var data = [];
    async function main() {
        const query = `SELECT *
        FROM "SL"
        WHERE
        time >= timestamp '${dateNow}T03:00:00.000Z' AND time <= timestamp '${dateNow}T15:00:00.000Z'`;
        const rows = await client.query(query, 'SLM');

        for await (const row of rows) {
            let ants = row.SLV || '';
            let time = new Date(row.time);
            
            var SlvHis ={
                SlvH: ants.toString(),
                timeH: time,
            } 
            data.push(SlvHis);
        }

        res.json(data);
    }
    
    main()
    
});

app.get('/api/PHis', function (req, res){
    let dateNow = new Date().toISOString().split('T')[0];
    var data = [];
    async function main() {
        const query = `SELECT *
        FROM "_pepole"
        WHERE
        time >= timestamp '${dateNow}T03:00:00.000Z' AND time <= timestamp '${dateNow}T15:00:00.000Z'`;
        const rows = await client.query(query, 'pepole');

        for await (const row of rows) {
            let counts = row.count || '';
            let time = new Date(row.time);
            
            var PHis ={
                PH: counts.toString(),
                timeH: time,
            } 
            data.push(PHis);
        }

        res.json(data);
    }
    
    main()
    
});

app.post('/upload', upload.single('image'), (req, res) => {
    const imageName = 'uploaded_image.jpg';
    fs.writeFileSync(path.join(__dirname, 'public', imageName), req.file.buffer);
  
    // Send a response to the client
    res.send(`<img src="/${imageName}" alt="Uploaded Image"/>`);
});

app.get('/api/getImage', (req, res) => {
    const imageName = 'uploaded_image.jpg';
    const imagePath = path.join(__dirname, 'public', imageName);
  
    // Read the image file and send it in the response
    fs.readFile(imagePath, (err, data) => {
      if (err) {
        res.status(500).send('Error reading the image file');
        return;
      }
  
      res.writeHead(200, { 'Content-Type': 'image/jpeg' });
      res.end(data);
    });
  });

app.listen(app.get('port'), function () {
  console.log('run at port', app.get('port'))
})
