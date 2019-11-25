const nodemailer = require("nodemailer");

module.exports = function (_, passport, Admins, Users, async) {
    return {
        SetRouting: function (router) {
            router.get('/', this.visitorDash);
            router.get('/admin', this.adminDash);
            router.get('/visitorSignup', this.localVisitorsignup);
            router.get('/adminSignup', this.localadminsignup);
            router.get('/pastvisits', this.pastVisit)

            router.post('/checkin', this.checkin);
            router.post('/checkout', this.checkout);
            router.post('/visitorSignup', this.postVisitorSignUp);
            router.post('/adminSignup', this.postadminSignUp);
        },

        // VISTOR SIGNUP AREA
        pastVisit: function (req, res) {
            if (req.user) {
                return res.render('pastVisits', { user: req.user });
            }
            else {
                res.redirect('/visitorSignup');
            }
        },
        visitorDash: function (req, res) {

            if (req.user) {

                async.parallel([
                    function (callback) {
                        Admins.find({}, (err, result) => {
                            callback(err, result);
                        })
                    },
                ], (err, results) => {
                    const res1 = results[0];
                    const res2 = results[1];
                    const res3 = results[2];
                    const dataChunk = [];
                    const chunkSize = 3;
                    for (let i = 0; i < res1.length; i += chunkSize) {
                        dataChunk.push(res1.slice(i, i + chunkSize));
                    }


                    return res.render('visitorDash', { user: req.user, data: res1 });
                })
            }
            else {
                res.redirect('/visitorSignup');
            }
        },
        localVisitorsignup: function (req, res) {
            res.render('visitorSignup');
        },
        postVisitorSignUp: passport.authenticate('local.signup', {
            successRedirect: '/',
            failiureRedirect: '/visitorSignup',
            failiureFlash: true
        }),


        //admin SIGNUP AREA

        adminDash: function (req, res) {
            if (req.user) {
                res.render('adminDash', { admin: req.user });
            }
            else {
                res.redirect('/adminSignup');
            }
        },
        localadminsignup: function (req, res) {
            res.render('adminSignup');
        },
        postadminSignUp: passport.authenticate('local.adminSignup', {
            successRedirect: '/admin',
            failiureRedirect: '/adminSignup',
            failiureFlash: true
        }),

        // Check Out
        checkout: function (req, res) {


            Admins.findOne({ email: req.body.hostEmail }, function (err, foundHost) {
                if (err) {
                    console.log("An error occured, Description: " + err);
                } else {
                    console.log(req.body.visitorEmail);

                    if (foundHost) {
                        foundHost.visitors.push({
                            name: req.body.visitorName,
                            email: req.body.visitorEmail,
                            phone: req.body.visitorPhone
                        });
                        foundHost.save(function (err, data) {
                            if (err) {
                                console.log("An error occured, description: " + err);
                            }
                        })
                    }
                }
            });

            var time = getDateTime();
            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'rvdubey.rvd@gmail.com',
                    pass: '@nainitaal'
                }
            });

            var mailOptions = {
                from: 'rvdubey.rvd@gmail.com',
                to: req.body.visitorEmail,
                subject: 'Check Out',
                html: '<h1>Hi  ' + req.body.hostEmail + ' </h1><p>Check-Out time : ' + time + '</p>'
            };

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });
            res.redirect('/');
        },

        // Check IN
        checkin: function (req, res) {


            Admins.findOne({ email: req.body.hostEmail }, function (err, foundHost) {
                if (err) {
                    console.log("An error occured, Description: " + err);
                } else {
                    console.log(req.body.visitorEmail);
                    Users.findOne({ email: req.body.visitorEmail }, function (err, visitor) {
                        console.log(visitor);
                        if (visitor) {
                            visitor.past.push({
                                name: foundHost.username,
                                time: getDateTime(),
                            });
                            visitor.save(function (err, data) {
                                if (err) {
                                    console.log("An error occured, description: " + err);
                                }
                            })
                        }
                    })

                }
            });


            var time = getDateTime();
            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'rvdubey.rvd@gmail.com',
                    pass: '@nainitaal'
                }
            });

            var mailOptions = {
                from: 'rvdubey.rvd@gmail.com',
                to: req.body.hostEmail,
                subject: 'Check In',
                html: '<table style="width:100%"><tr><th>Visitor Name</th><th>Visitor Email</th><th>Visitor Phone Number</th><th>Check In time</th></tr><tr><td>' + req.body.visitorName + '</td><td>' + req.body.visitorEmail + '</td><td>' + req.body.visitorPhone + '</td><td>' + getDateTime() + '</td></tr></table>'
            };

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });
            res.redirect('/');
        }
    }
    function getDateTime() {

        var date = new Date();

        var hour = date.getHours();
        hour = (hour < 10 ? "0" : "") + hour;

        var min = date.getMinutes();
        min = (min < 10 ? "0" : "") + min;

        var sec = date.getSeconds();
        sec = (sec < 10 ? "0" : "") + sec;

        var year = date.getFullYear();

        var month = date.getMonth() + 1;
        month = (month < 10 ? "0" : "") + month;

        var day = date.getDate();
        day = (day < 10 ? "0" : "") + day;

        return year + ":" + month + ":" + day + ":" + hour + ":" + min + ":" + sec;

    }
}
