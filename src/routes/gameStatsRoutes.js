const express = require('express');
const router = express.Router();
const gameStatsController = require('../controllers/gameStatsController');
const requestHandler = require('../middleware/requestHandler');

router.post('/totalMatches', requestHandler(gameStatsController.totalMatches));
router.post('/uniquePlayers', requestHandler(gameStatsController.uniquePlayers));
router.post('/adoptionPercentage', requestHandler(gameStatsController.adoptionPercentage));
router.post('/matchPerADU', requestHandler(gameStatsController.matchPerADU));
router.post('/matchPerPlayer', requestHandler(gameStatsController.matchPerPlayer));
router.post('/winRate', requestHandler(gameStatsController.winRate));

module.exports = router;
