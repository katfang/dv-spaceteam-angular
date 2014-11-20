'use strict';

angular.module('join', ['ngRoute', 'firebase'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/join', {
    templateUrl: 'join/join.html',
    controller: 'JoinCtrl'
  });
}])

.controller('JoinCtrl', ['$scope', '$firebase', '$location', 'levelGenerator', function($scope, $firebase, $location, levelGenerator) {
  var ref = new Firebase("https://google-spaceteam.firebaseio.com");
  var sync = $firebase(ref);
  var syncObject = sync.$asObject();
  syncObject.$bindTo($scope, "data");

  $scope.roomSet = false;
  
  $scope.joinRoom = function() {
    var roomRef = ref.child($scope.room.name);
    var usersRef = roomRef.child("users");
    var usersSync = $firebase(usersRef);
    var updateObj = {};
    updateObj[$scope.username] = true; //TODO: tx to check that the username isn't taken or do anon user thing
    usersSync.$update(updateObj);
    $scope.roomSet = true;
  };

  $scope.startRoom = function() {
    ref.child($scope.room.name).update({ state: "ungenerated"});
    levelGenerator().then(function(level) {
      ref.child($scope.room.name).child("level/1").update(level);
      $location.path('room/' + $scope.room.name + "/1");
    });
  };
}]);
