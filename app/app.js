'use strict';

// Declare app level module which depends on views, and components
angular.module('googleSpaceteam', [
  'ngRoute',
  'firebase',
  'join',
  'room',
  'roomServices',
  'stringFormatterModule'
]).

config(['$routeProvider', function($routeProvider) {
  $routeProvider.otherwise({redirectTo: '/join'});
}])

.filter('reverse', function() {
  return function(items) {
    return items.slice().reverse();
  };
})

.factory('helper', function() {
  var selectRandomKey = function(dict) {
    var keys = Object.keys(dict);
    var selectedKey = keys[Math.floor(Math.random() * keys.length)];
    return selectedKey;
  };

  var savedUsername = null;
  var setUsername = function(username) {
    savedUsername = username;
  };
  var getUsername = function() {
    return savedUsername;
  };
  
  return {
    selectRandomKey: selectRandomKey,
    setUsername: setUsername,
    getUsername: getUsername,
  };
});
