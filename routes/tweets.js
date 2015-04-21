var Bcrypt = require('bcrypt');
var Joi = require('joi');
var Auth = require('./auth');

exports.register = function(server, options, next) {
	// Include routes
	server.route([ 

		//Get all tweets
		{
			method: 'GET',
			path: '/tweets',
			handler: function(request, reply) {
				var db = request.server.plugins['hapi-mongodb'].db;

				db.collection('tweets').find().toArray(function(err, tweets) {
					if(err) { throw err; };
					reply(tweets); 
				});

			}
		},
		
		
		//Get one tweet
		{
			method: 'GET',
			path: '/tweets/{id}',
			handler: function(request, reply) {
        var id = encodeURIComponent(request.params.id);
        var db = request.server.plugins['hapi-mongodb'].db;
        var ObjectID = request.server.plugins['hapi-mongodb'].ObjectID;
        
        db.collection('tweets').findOne( {"_id": ObjectID(id)}, function(err, tweet) {
          if (err) { throw err; }
          reply(tweet);
        });
			}
		},
		
		
		//Get user tweets
		{
			method: 'GET',
			path: '/users/{username}/tweets',
			handler: function(request, reply) {
        var userQuery = encodeURIComponent(request.params.username);
        var db = request.server.plugins['hapi-mongodb'].db;
				var ObjectID = request.server.plugins['hapi-mongodb'].ObjectID;

        console.log(userQuery);
        
        db.collection('users').findOne( { 'username': userQuery }, function(err, user) {
          if (err) { throw err; }
					
					if (user === null) {
						return reply([]);
					}
					
          db.collection('tweets').find({ user_id: ObjectID(user._id) }).toArray(function(err, userTweets) {
          	if (err) { throw err; }
						
          	reply(userTweets);
          });
        });
			}
		},
		
		
		//Create a new tweet
		{
			method: 'POST',
			path: '/tweets',
			handler: function(request, reply) {
				var db = request.server.plugins['hapi-mongodb'].db;
				var newTweet = request.payload.tweet;
				var session = request.session.get('hapi-twitter-session');
				var ObjectID = request.server.plugins['hapi-mongodb'].ObjectID;
				newTweet['user_id'] = ObjectID(session.user_id);
				newTweet['date'] = new Date;
				console.log(session.user_id);

				Auth.authenticated(request, function(result) {

					if(result.authenticated) {
						
						db.collection('users').findOne( { _id: ObjectID(session.user_id) }, function(err, user) {
							if (err) { reply(Hapi.error.internal('Internal MongoDB Error', err)); }
							
							newTweet['user'] = user.username;
							
							db.collection('tweets').insert(newTweet, function(err, writeResult) {
								console.log(newTweet);
								if (err) { reply(Hapi.error.internal('Internal MongoDB Error', err)); }
								else { reply(writeResult); }  
							});

						});
						
					}
					else {
						return reply(result.message);
					}

				});

			}
		},
		
		
		//Delete a tweet
		{
			method: 'DELETE',
			path: '/tweets/{id}',
			handler: function(request, reply) {
				var db = request.server.plugins['hapi-mongodb'].db;
        var id = encodeURIComponent(request.params.id);
        var ObjectID = request.server.plugins['hapi-mongodb'].ObjectID;
        
        db.collection('tweets').remove( {"_id": ObjectID(id)}, true );
        reply("Tweet with id " + id + " has been deleted.");
			}
		},
		
		
		//Search tweets
		{
			method: 'GET',
			path: '/tweets/search/{query}',
			handler: function(request, reply) {
        var query = encodeURIComponent(request.params.query);
        var db = request.server.plugins['hapi-mongodb'].db;
        
        db.collection('tweets').find( { $text: { $search: query } } ).toArray( function(err, searchResults) {
          if (err) { throw err; }
          reply(searchResults);
        });
			}
		}

	]);

	next();
};

// Give this file some attributes

exports.register.attributes = {
	name: 'tweets-route',
	version: '0.0.1'
};