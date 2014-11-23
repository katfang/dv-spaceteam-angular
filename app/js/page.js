'use strict';

// Declare app level module which depends on views, and components
angular.module('page', [])

.factory('Page', function() {
  var level = null;
  var uid = null;
  
  var ref = new Firebase('https://google-spaceteam.firebaseio.com');
  ref.onAuth(function(authData) {
    uid = (authData !== null) ? authData.uid : null;
  });
  
  return {
    getLevel: function() { return level; },
    setLevel: function(newTitle) { level = newTitle; },
    getUid: function() { return uid; },
    setUid: function(newUid) { uid = newUid; } 
  };
})

.controller('PageCtrl', ['$scope', 'Page', function($scope, Page) {
  $scope.Page = Page;
}]);
