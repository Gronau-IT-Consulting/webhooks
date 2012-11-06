var nock  = require('nock')
  , fs    = require('fs')
  , logic = require('../lib/logic');

var Event        = require('../app/models/jobs/event')
  , Subscription = require('../app/models/subscriptions/subscription')
  , User         = require('../app/models/people/user')
  , Application  = require('../app/models/people/application')
  , AccessToken  = require('../app/models/people/access_token');

describe('when a new event happens', function() {

  var user, application, token, event, sub, callback;
  var fixture = __dirname + '/fixtures/event.json';

  // Open the stream to raise the HTTP request
  Event.find({ callback_processed: false })
    .tailable().stream().on('data', function (doc) { logic.execute(doc); });

  // Mock the HTTP request
  beforeEach(function() { callback = nock('http://www.google.com').get('/').reply(200); });

  // Create the needed data
  beforeEach(function(){
    User.create({ }, function (err, doc) { user = doc; });
    Application.create({ }, function (err, doc) { application = doc} );
    setTimeout(function() { AccessToken.create({ resource_owner_id: user._id, application: application._id, expires_in: 7200 }, function (err, doc) { token = doc }) }, 200);
    setTimeout(function() { Subscription.create({ client_id: application._id, resource: 'status', event: 'update', callback: 'http://www.google.com'}, function (err, doc) { subscription = doc }); }, 200);
    setTimeout(function() { Event.create({ resource_owner_id: user._id, resource: 'status', event: 'update', body: {} }, function (err, doc) { event = doc }); }, 200)
  });

  // Throws an assertion error if a request was not performed
  it('makes an HTTP request to the subscription URI callback', function(done) {
    setTimeout(function() { expect(callback.isDone()).toBe(true); done(); }, 400);
  });
});