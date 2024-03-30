const express = require('express');
const router = express.Router();
const PrologController = require('../controllers/PrologController');

router.get('/sync', PrologController.sync);
router.post('/exec', PrologController.exec);

module.exports = router;
