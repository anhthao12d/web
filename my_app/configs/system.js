module.exports = {
    prefixAdmin : 'adminZendvn',
    prefixUsers : '',
    env         : 'production',
    user: "dinhthaonguyen19996@gmail.com",
    pass: "anhthao12d42013491",
    secretNodemailer : 'HHB8PLznCb4t7KYGtmmIEJ6iBOC1jljGIR',
    port : 3000,
    facebook : {
        clientID        : "4254267354689280",
        clientSecret    : "dc1b61fc7001104d92191ad0342e4379",
        callbackURL     : `http://localhost:3000/accounts/facebook/secrets`,
        profileFields   : ['id', 'displayName', 'name', 'gender', 'picture.type(large)','email', 'locale']
    },
    google : {
        clientID: "244082104306-5cq2tns63o7rkknjs65km7a6c1p0hp3h.apps.googleusercontent.com",
        clientSecret: "xywPOaC2_znMatgYFEuTdtCP",
        callbackURL: "http://localhost:3000/accounts/google/callback"
    }
}