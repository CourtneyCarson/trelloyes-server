const express = require('express');

const cardRouter = express.Router();
const bodyParser = express.json();


cardRouter
  .route('/card')
  .get((req, res) => {
    // add implementation from logic app.js here
    res
    json(cards);

  })
  .post(bodyParser, (req, res) => {
    // move implementation logic here 
      const { title, content } = req.body;

// validate title and content exist
      if (!title) {
        logger.error(`Title is required`);
        return res
          .status(400)
          .send('Invalid data');
      }
      if (!content) {
        logger.error(`Content is required`);
        return res
          .status(400)
          .send('Invalid data');
      }
    
    //get an id from uuid
      const id = uuid();

      const card = {
        id,
        title,
        content
      };
    
      cards.push(card);

      logger.info(`Card with id ${id} created`);

      res
        .status(201)
        .location(`http://localhost:8000/card/${id}`)
        .json(card);
    })
