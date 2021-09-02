const MainModel 	= require(__path_schemas + 'users');
var bcrypt          = require('bcrypt');

const nodemailer    = require(__path_configs + 'nodemailer');

const saltRounds    = 10;

module.exports = {
    // find
    find : (data, options = null) => {
        if(options.task == 'find-username'){
            return MainModel.findOne({username : data}, {user_id : 1});
        }

        if(options.task == 'check-password'){
            return MainModel.findOne({username : data}, {user_id : 1, username: 1, password : 1, status : 1});
        }
        if(options.task == 'find-user_id'){
            return MainModel.findOne({user_id : data}, {user_id : 1});
        }
        if(options.task == 'find-username-login'){
            return MainModel.findOne({username : data},{user_id : 1, name : 1, password : 1, status : 1});
        }
    },
    save : async(item, options = null) => {
        item.created= {
            user_name: item.name,
            time: Date.now(),
        };
        item.role = 'client';
        if(options.task == 'sing-up'){
            nodemailer.sendConfirmationEmail(item.name,item.username,item.token);
            item.password = await bcrypt.hash(item.password, saltRounds);
            item.status = 'inactive';
        }
        if(options.task == 'google-facebook'){
            item.status = 'active';
        }
        return new MainModel(item).save();
        
    },
}