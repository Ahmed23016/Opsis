const express = require('express');
const cors = require('cors'); 
const app = express();
const PORT = 3000;

app.use(cors());


app.use(express.json());

let lastDataReceived = null;

app.post('/callback', (req, res) => {
  const data = req.body;
  console.log('Received data from Python:', data);
  lastDataReceived = data;
  res.status(200).json({ message: 'Received data successfully on Node server' });
});

app.get('/latest-data', (req, res) => {
  if (!lastDataReceived) {
    return res.status(404).json({ error: 'No data yet' });
  }
  return res.json(lastDataReceived);
});

app.get('/reset',(req,res)=>{
  lastDataReceived=null;
  return res.status(200).json({success:"Data resetted"});
})

app.listen(PORT, () => {
  console.log(`Node server is listening on port ${PORT}`);
});
