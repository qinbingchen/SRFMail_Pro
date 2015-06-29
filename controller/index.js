var router = new require('express').Router();

router.use('/user', require('./user'));
router.use('/session', require('./session'));