const express = require('express');
const passport = require('passport');

require('./passport');

const router = express.Router();

router.get('/google',
  passport.authenticate('google', {
    scope: [
      'profile',
      'https://www.googleapis.com/auth/youtube.readonly',
      // 'https://www.googleapis.com/auth/youtube',
      // 'https://www.googleapis.com/auth/youtube.force-ssl'
    ],
  }));

router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', (err, user) => {
    if (err) { return next(err); }
    if (!user) { return res.redirect('/'); }
    res.cookie('accessToken', user.accessToken);
    res.redirect('/callback.html');
  })(req, res, next);
});

module.exports = router;
