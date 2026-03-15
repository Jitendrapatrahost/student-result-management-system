const express = require('express');
const router = express.Router();
const { login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate, loginValidation } = require('../middleware/validation');

router.post('/login', validate(loginValidation), login);
router.get('/me', protect, getMe);

module.exports = router;