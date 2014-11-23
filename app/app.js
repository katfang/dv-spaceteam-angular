'use strict';

// Declare app level module which depends on views, and components
angular.module('googleSpaceteam', [
  'ngRoute',
  'firebase',
  'stringFormatterModule',
  'page',
  'join',
  'room',
  'roomServices',
  'gadgets',
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
    var removeKey = function(key, keys) {
      var index = keys.indexOf(key);
      if (index !== -1) {
        keys.splice(index,1);
      }
    };
    var keys = Object.keys(dict);
    removeKey('$id', keys);
    removeKey('$priority', keys);
    removeKey('$value', keys);
    if (keys.length === 0) {
      return null;
    } else {
      var selectedKey = keys[Math.floor(Math.random() * keys.length)];
      return selectedKey;
    }
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
