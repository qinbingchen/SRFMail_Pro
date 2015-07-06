var router = new require('express').Router();

router.use('/dispatcher', require('./dispatcher'));
router.use('/reviewer', require('./reviewer'));
router.use('/worker', require('./worker'));
router.use('/upload', require('./upload'));

module.exports = router;