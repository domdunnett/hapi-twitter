var Bcrypt = require('bcrypt');

exports.register = function(server, options, next) {

	server.route([

//sign in and create a session
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
		},

//check if the user is logged in/authenticated
		{
			method: 'GET',
			path: '/authenticated',
			handler: function(request, reply) {
				var session = request.session.get('hapi-twitter-session');
				var db = request.server.plugins['hapi-mongodb'].db;

				db.collection('sessions').findOne({ session_id: session.session_key }, function(err, result) {
					if(result === null) {
						return reply( {message: "Not authenticated"} );
					}
					else {
						return reply( {message: "Authenticated."} );
					}
				});

			}
		}
//log out/delete session
		// {
		// 	method: 'DELETE',
		// 	path: '/sessions',
		// 	handler: function(request, reply) {
		// 		var session = request.session.get('hapi-twitter-session');
		// 		var db = request.server.plugins['hapi-mongodb'].db;
		// 	}
		// }

	])

	next();

};

exports.register.attributes = {
	name: 'sessions-routes',
	version: '0.0.1'
};