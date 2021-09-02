var express                     = require('express');
var router                      = express.Router();
var jwt                         = require('jsonwebtoken');
var passport                    = require('passport');
const { validationResult } 	    = require('express-validator');
var bcrypt                      = require('bcrypt');
var randomstring                = require("randomstring");
const MainValidator				= require(__path_validators + 'auth');
const ParamsHelper				= require(__path_helpers + 'getParams');
const MainModel					= require(__path_models_users + 'users');
const systemConfig 				= require(__path_configs + 'system');
const NotifyConfig 				= require(__path_configs + 'notify');

const layoutFrontend            =  __path_users  + 'login';
const folderView                = __path_users + 'pages/auth/';
const pageTitle                 = 'Login Page';
const linkSingIn                = '/' + systemConfig.prefixUsers +'/accounts/sing-in';
var LocalStrategy               = require('passport-local').Strategy;
const FacebookStrategy          = require('passport-facebook').Strategy
const GoogleStrategy            = require('passport-google-oauth20').Strategy;
const folderView2	            =  ('/' + systemConfig.prefixUsers + '/accounts/sing-in').replace('//','/');
const saltRounds                = 10;

router.get('/:views', async(req, res, next) => {
    let views	= ParamsHelper.getParamsHelper(req.params, 'views', 'sing-in');
    let item = {password : '', username: ''};
    if(views == 'sing-up') item.name = '';
    let err = [];
    res.render(`${folderView}${views}`, { 
        pageTitle,
        layout   : layoutFrontend,
        item,
        err,
        notify : await req.flash('message')
    });
});

router.post('/sing-up/', MainValidator.validatorRegister, async(req, res, next) => {
    req.body		    = JSON.parse(JSON.stringify(req.body));
    let item		    = Object.assign(req.body);
    const errors 	    = validationResult(req);
    let err 		    =  errors.array();
    
    await MainModel.find(item.username, {task : 'find-username'}).then((user) => {
        if(user)  err.push({param : 'username', msg : NotifyConfig.ERROR_USER_EXIST})
    })
    
    if(err.length != 0) {
        res.render(`${folderView}sing-up`, { pageTitle, layout   : layoutFrontend, item, err});
        
    }else {
        let data = {password : '', username: ''};
        let notify = [{msg : NotifyConfig.WARNING_ACTIVE__ACCOUNT}];
        item.user_id = randomstring.generate(32);
        item.token = await jwt.sign({ user_id: item.user_id }, systemConfig.secretNodemailer);

        MainModel.save(item, {task : 'sing-up'}).then((result) => {
            res.render(`${folderView}sing-in`, { pageTitle, layout   : layoutFrontend, item : data, err, notify});
        })
    }
        
});
router.post('/sing-in',MainValidator.validatorLogin, async(req, res, next) => {
    req.body		    = JSON.parse(JSON.stringify(req.body));
    let item		    = Object.assign(req.body);
    const errors 	    = validationResult(req);
    let err 		    =  errors.array();
    const notify        = [];
    if(err.length != 0) {  
        res.render(`${folderView}sing-in`, { pageTitle, layout   : layoutFrontend, item, err, notify});
    } else {
        passport.authenticate('local', async(err, user) =>{
            if (errs || !user) {
                return res.redirect(`${folderView2}`)
            }
            req.logIn(user, function(errs) {
                if (errs) { 
                    return res.redirect(`${folderView2}`);
                }
                let err = []
                let data = {password : '', username: ''};
                let notify = [{msg : 'Thanh cong'}];
                res.render(`${folderView}sing-in`, { pageTitle, layout   : layoutFrontend, item : data, err, notify});
            });
        })(req, res, next)
        
    }
        
});
// Active Account
router.get('/active-account(/:token)?',(req, res, next) => {
    let token	= ParamsHelper.getParamsHelper(req.params, 'token', '');
    console.log(token);
    
});
// Facebook
router.get('/auth/facebook', passport.authenticate('facebook', { scope : ['email'] })
);

router.get('/facebook/secrets', async(req, res, next) => {
    
    passport.authenticate('facebook', function(errs, user, info) {
        if (errs || !user) {
            return res.redirect(`${folderView2}`)
        }
        req.logIn(user, function(errs) {
            if (errs) { 
                return res.redirect(`${folderView2}`);
            }
            let err = []
            let data = {password : '', username: ''};
            let notify = [{msg : 'Thanh cong'}];
            res.render(`${folderView}sing-in`, { pageTitle, layout   : layoutFrontend, item : data, err, notify});
        });
    })(req, res, next)
});


// Google
router.get('/auth/google',
    passport.authenticate('google', { scope: ['profile','email'] })
);

router.get('/google/callback', async(req, res, next) => {
    passport.authenticate('google', function(errs, user, info) {
        if (errs || !user) {
            return res.redirect(`${folderView2}`)
        }
        req.logIn(user, function(errs) {
            if (errs) { 
                return res.redirect(`${folderView2}`);
            }
            let err = []
            let data = {password : '', username: ''};
            let notify = [{msg : 'Thanh cong'}];
            res.render(`${folderView}sing-in`, { pageTitle, layout   : layoutFrontend, item : data, err, notify});
        });
    })(req, res, next);
}
);
// Local
passport.use(new LocalStrategy(
    (username, password, done) => {
        UsersModel.findOne({username : username, status : 'active'},{_id : 1, name : 1, password : 1}).then(async(user) => {
            if(user == null || user == undefined ||  user == ""){ 
                return done(null,false,req.flash('message',{
                    msg	: 'Tai khoan chua duoc dang ki.',
                }))
            }else {
                if(await bcrypt.compare(password, user.password) == false) {
                    return done(null,false, req.flash('message',{
                        msg	: NotifyConfigs.ERROR_PASSWORD_FALSE,
                    }));
                }else {
                    return done(null,user);
                }
            }
            
        });
    }
));
  // Facebok
passport.use(new FacebookStrategy(systemConfig.facebook,  async(accessToken, refreshToken, profile, done) => {
    await MainModel.find(profile._json.id, {task : 'find-user_id'}).then((user) => {
        if(user) {
            return done(null,user);
        } else {
            user = profile._json.id;
            let item = {
                name : (profile._json.name != '') ? profile._json.give_name : 'user',
                username : (profile._json.email != '') ? profile._json.email : '',
                user_id : profile._json.id,
                passport : bcrypt.hash(randomstring.generate(10), saltRounds),
            }
            MainModel.save(item, {task : 'google-facebook'}).then((result) => {
                return done(null, user);
            })
        }
        
    })
}
));
// Google
passport.use(new GoogleStrategy(systemConfig.google,  async(accessToken, refreshToken, profile, cb) =>{
    MainModel.find(profile._json.sub, {task : 'find-user_id'}).then((user) => {
        if(user) {
            return cb(null,user);
        } else {
            user = profile._json.sub;
            let item = {
                name : (profile._json.given_name != '') ? profile._json.give_name : 'user',
                username : profile._json.email,
                user_id : profile._json.sub,
                passport : bcrypt.hash(randomstring.generate(10), saltRounds),
            }
            MainModel.save(item, {task : 'google-facebook'}).then((result) => {
                return cb(null, user);
            })
        }
        
    })
}
));

passport.serializeUser(function(user, done) {
    done(null,user);
});
passport.deserializeUser(function(user, done) {
    done(null,user)
});
module.exports = router;