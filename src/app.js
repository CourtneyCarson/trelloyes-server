require('dotenv').config()
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const winston = require('winston');
const { v4: uuid } = require('uuid');
const { NODE_ENV } = require('./config');

const app = express();

const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';


app.use(function validateBearerToken(req, res, next) {
  const apiToken = process.env.API_TOKEN
  const authToken = req.get('Authorization')

  if (!authToken || authToken.split(' ')[1] !== apiToken) {
    logger.error(`Unauthorized request to path: ${req.path}`);
    return res.status(401).json({ error: 'Unauthorized request' })
  }
  next()
});

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'info.log' })
  ]
});

if (NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

const cards = [{
  id: 1,
  title: 'Task One',
  content: 'This is card one'
}];
const lists = [{
  id: 1,
  header: 'List One',
  cardIds: [1]
}];


app.use(morgan(morganOption))
app.use(helmet())
app.use(cors())
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello, world!')
})

app.get('/list', (req, res) => {
  res
    .json(lists);
})

app.get('/card/:id', (req, res) => {
  const { id } = req.params;
  const card = cards.find(c => c.id == id);

  if (!card) {
    logger.error(`Card with id ${id} not found`);
    return res
      .status(404)
      .send('Card Not Found');
  }
  res.json(card);
})

app.get('/list/:id', (req, res) => {
  const { id } = req.params;
  const list = lists.find(li => li.id == id);

  if (!list) {
    logger.error(`List with id ${id} not found.`)
    return res
      .status(404)
      .send('List Not Found')
  }
  res.json(list);
})

app.post('/list', (req, res) => {
  const { header, cardIds = [] } = req.body;

  if (!header) {
    logger.error(`Header is required`);
    return res
      .status(400)
      .send('Invalid data');
  }

  // check card IDs
  if (cardIds.length > 0) {
    let valid = true;
    cardIds.forEach(cid => {
      const card = cards.find(c => c.id == cid);
      if (!card) {
        logger.error(`Card with id ${cid} not found in cards array.`);
        valid = false;
      }
    });

    if (!valid) {
      return res
        .status(400)
        .send('Invalid data');
    }
  }

  // get an id
  const id = uuid();

  const list = {
    id,
    header,
    cardIds
  };

  lists.push(list);

  logger.info(`List with id ${id} created`);

  res
    .status(201)
    .location(`http://localhost:8000/list/${id}`)
    .json({id});
});




// app.post('/list/', (req, res) => {
//   const { header, cardIds = [] } = req.body;

//   if (!header) {
//     logger.error(`Header is required`);
//     return res
//       .status(400)
//       .send('Invalid data');
//   }
//   if (cardIds.length > 0) {
//     let valid = true;
//     cardIds.forEach(cid => {
//       const card = cards.find(c => c.id == cid);
//       if (!card) {
//         logger.error(`Card with id ${cid} not found in cards array`)
//         valid = false;
//       }
//     });
//     if (!valid) {
//       return res
//         .status(400)
//         .send('Invalid data')
//     }
//   }

//   const id = uuid();

//   const list = {
//     id,
//     header,
//     cardIds
//   };
//   lists.push(list);

//   logger.info(`List with id ${id} created`);

//   res
//     .status(201)
//     .location(`http://localhost:8000/list/${id}`)
//     .json({ id });
// });


app.delete('/list/:id', (req, res) => {
  const { id } = req.params;

  const listIndex = lists.findIndex(li => li.id == id);
   
  if (listIndex === -1) {
    logger.error(`List with id ${id} not found`);
    return res
      .status(404)
      .send('NOPE SHE IS NOT HERE')
  }
  lists.splice(listIndex, 1);

  logger.info(`List with id ${id} deleted. `);
  res
    .status(204)
    .end();
});

app.delete('/card/:id', (erq, res) => {
  const { id } = req.params;
  
  const cardIndex = cards.findIndex(c => c.id == id);

  if (cardIndex === -1) {
    logger.error(`Card with id ${id} not found`);
    return res
      .status(404)
      .send('She gone now');
  }
  lists.forEach(list => {
    const cardIds = list.cardIds.filter(cid => cid !== id);
    list.cardIds = cardIds;
  })

  cards.splice(cardIndex, 1);

  logger.info(`Card with id ${id} deleted`);

  res
    .status(204)
    .end()
});


app.use(function errorHandler(error, req, res, next) {
  let response
  if (NODE_ENV === 'production') {
    response = { error: { message: 'server error' } }
  } else {
    console.error(error)
    response = { message: error.message, error }
  }
  res.status(500).json(response)
})

module.exports = app