'use strict';

angular.module('join', ['ngRoute', 'firebase'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/join', {
    templateUrl: 'join/join.html',
    controller: 'JoinCtrl'
  });
}])

.controller('JoinCtrl', ['$scope', '$firebase', '$location', 'levelGenerator', 'helper', function($scope, $firebase, $location, levelGenerator, helper) {
  var ref = new Firebase("https://google-spaceteam.firebaseio.com");
  var sync = $firebase(ref);
  var syncObject = sync.$asObject();
  syncObject.$bindTo($scope, "data");

  $scope.roomSet = false;
  
  $scope.joinRoom = function() {
    var roomRef = ref.child($scope.room.name);
    var usersRef = roomRef.child("users");
    var usersUpdateDict = {};
    usersUpdateDict[$scope.username] = true;
    usersRef.update(usersUpdateDict); //TODO: tx to check that the username isn't taken or do anon user thing
    helper.setUsername($scope.username);
    $scope.roomSet = true;
  };

  $scope.startRoom = function() {
    ref.child($scope.room.name).update({ state: "ungenerated"});
    levelGenerator($scope.username).then(function(level) {
      ref.child($scope.room.name).child("level/1/tasks").update(level.tasks);
      ref.child($scope.room.name).child("level/1/gadgets").update(level.gadgets);
      $location.path('room/' + $scope.room.name + "/1");
    });
  };
}]);
