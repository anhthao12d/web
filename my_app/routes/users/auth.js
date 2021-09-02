var express                     = require('express');
var router                      = express.Router();
var jwt                         = require('jsonwebtoken');
var passport                    = require('passport');
const { validationResult } 	    = require('express-validator');
var randomstring                = require("randomstring");
const MainValidator				= require(__path_validators + 'auth');
const ParamsHelper				= require(__path_helpers + 'getParams');
const MainModel					= require(__path_models_users + 'users');
const systemConfig 				= require(__path_configs + 'system');
const NotifyConfig 				= require(__path_configs + 'notify');

const layoutFrontend            =  __path_users  + 'login';
const folderView                = __path_users + 'pages/auth/';
const pageTitle                 = 'Login Page';
const folderView2	            =  ('/' + systemConfig.prefixUsers + '/accounts/sing-in').replace('//','/');

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
        passport.authenticate('local', (errs, user) =>{
            if (errs || !user) {
                return res.redirect(`${folderView2}`)
            }
            req.logIn(user, function(errs) {
                if (errs) { 
                    return res.redirect(`${folderView2}`);
                }
                console.log('222222');
                
                let err = []
                let data = {password : '', username: ''};
                let notify = [{msg : 'Thanh cong'}];
                res.render(`${folderView}sing-in`, { pageTitle, layout   : layoutFrontend, item : data, err, notify});
            });
        })(req, res, next)
        
    }
        
});
// Facebook
router.get('/auth/facebook', passport.authenticate('facebook', { scope : ['email'] })
);
router.get('/facebook/secrets', async(req, res, next) => {
    
    passport.authenticate('facebook', (errs, user, info) =>{
        if (errs || !user) {
            req.flash('message',{
                msg	: NotifyConfig.ERROR_GOOGLE_FACEBOOK_SINGIN_SINGUP,
            })
            return res.redirect(`${folderView2}`)
        }
        req.logIn(user, function(errs) {
            if (errs) { 
                req.flash('message',{
                    msg	: NotifyConfig.ERROR_GOOGLE_FACEBOOK_SINGIN_SINGUP,
                })
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
            req.flash('message',{
                msg	: NotifyConfig.ERROR_GOOGLE_FACEBOOK_SINGIN_SINGUP,
            })
            return res.redirect(`${folderView2}`)
        }
        req.logIn(user, function(errs) {
            if (errs) { 
                req.flash('message',{
                    msg	: NotifyConfig.ERROR_GOOGLE_FACEBOOK_SINGIN_SINGUP,
                })
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
// Active Account
router.get('/active-account(/:token)?',(req, res, next) => {
    let token	= ParamsHelper.getParamsHelper(req.params, 'token', '');
    console.log(token);
    
});

module.exports = router;