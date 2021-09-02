var LocalStrategy               = require('passport-local').Strategy;
const FacebookStrategy          = require('passport-facebook').Strategy
const GoogleStrategy            = require('passport-google-oauth20').Strategy;
var bcrypt                      = require('bcrypt');
var randomstring                = require("randomstring");

const MainModel					= require(__path_models_users + 'users');
const NotifyConfigs 	        = require(__path_configs + 'notify');
const systemConfig 				= require(__path_configs + 'system');

const saltRounds                = 10;

module.exports = (passport) => {
    // Local
    passport.use(new LocalStrategy({ passReqToCallback : true}, async(req, username, password, done) => {
            await MainModel.find(username, {task : 'find-username-login'}).then(async(user) => {
                console.log(user);
                
                if(user == null || user == undefined ||  user == ""){ 
                    return done(null,false,req.flash('message',{
                        msg	: NotifyConfigs.ERROR_USER_NOT_EXIST,
                    }))
                }else {
                    if(await bcrypt.compare(password, user.password) == false) {
                        return done(null,false, req.flash('message',{
                            msg	: NotifyConfigs.ERROR_PASSWORD_FALSE,
                        }));
                    } else if(user.status != 'active') {
                        return done(null,false,req.flash('message',{
                            msg	: NotifyConfigs.WARNING_ACTIVE__ACCOUNT,
                        }))
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
        await MainModel.find(profile._json.sub, {task : 'find-user_id'}).then((user) => {
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
}