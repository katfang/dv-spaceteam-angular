'use strict';

// Declare app level module which depends on views, and components
angular.module('googleSpaceteam', [
  'ngRoute',
  'firebase',
  'join',
  'room',
  'roomServices',
]).

config(['$routeProvider', function($routeProvider) {
  $routeProvider.otherwise({redirectTo: '/join'});
}])

.filter('reverse', function() {
  return function(items) {
    return items.slice().reverse();
  };
});

