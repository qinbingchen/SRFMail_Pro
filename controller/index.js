var router = new require('express').Router();
var Log = require('../lib/log')('[controller-index]');

router.use(function(req, res, next) {
    Log.d({req: req});
    next();
});
router.use('/user', require('./user'));
router.use('/session', require('./session'));
router.use('/action', require('./action'));

exports = module.exports = router;