var Bcrypt = require('bcrypt');

exports.register = function(server, options, next) {

	server.route([

		{
			method: 'POST',
			path: '/sessions',
			handler: function(request, reply)	{
				var db = request.server.plugins['hapi-mongodb'].db;
				var user = request.payload.user

				db.collection('users').findOne( { username: user.username }, function(err, userMongo) {
					if (err) { return reply('Internal MongoDB error', err); };

					if(userMongo === null) {
						return reply( { message: "User doesn't exist" } );
					}

					Bcrypt.compare(user.password, userMongo.password, function(err, match) {
						if (match) {

						  function randomKeyGenerator() {
    						return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
  						}
   
						  // Generate a random key
						  var randomKey = randomKeyGenerator() + randomKeyGenerator() + "-" + randomKeyGenerator() + "-4" + 
						  		randomKeyGenerator().substr(0,3) + "-" + randomKeyGenerator() + "-" + randomKeyGenerator() + 
						  		randomKeyGenerator() + randomKeyGenerator().toLowerCase();

							var newSession = {
								session_id: randomKey,
								user_id: userMongo._id
							};

							db.collection('sessions').insert(newSession, function(err, writeResult) {
								if(err) { return reply('Internal MongoDB error', err); }

								request.session.set('hapi-twitter-session', {
									session_key: randomKey,
									user_id: userMongo._id
								});

								return reply(writeResult);
							});

						}
						else { reply( {message: "Not authorised"} )}
					});

				});

			}		
		}

	])

	next();

};

exports.register.attributes = {
	name: 'sessions-routes',
	version: '0.0.1'
};