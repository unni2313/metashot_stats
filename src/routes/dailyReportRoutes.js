const express = require('express');
const router = express.Router();
const playerController = require('../controllers/dailyReportController');
const requestHandler = require('../middleware/requestHandler');

router.post('/dailyInstalls', requestHandler(playerController.dailyInstalls));
router.post('/activeUsers', requestHandler(playerController.activeUsers));
router.post('/monthlyActiveUsers', requestHandler(playerController.monthlyActiveUsers));
router.post('/dailyProgress', requestHandler(playerController.dailyProgress));
router.post('/totalMatches', requestHandler(playerController.totalMatches));
router.post('/playerAvgDaily', requestHandler(playerController.playerAvgDaily));
router.post('/dailyReport', requestHandler(playerController.dailyReport));
router.post('/actualInstalls', requestHandler(playerController.actualInstalls));





module.exports = router;
