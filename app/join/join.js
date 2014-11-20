'use strict';

angular.module('join', ['ngRoute', 'firebase'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/join', {
    templateUrl: 'join/join.html',
    controller: 'JoinCtrl'
  });
}])

.controller('JoinCtrl', ['$scope', '$firebase', '$location', function($scope, $firebase, $location) {
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
    $location.path('room/' + $scope.room.name + "/1");
    var roomRef = ref.child($scope.room.name);
    var roomSync = $firebase(roomRef);
    roomSync.$update({
      state: "ungenerated",
      level: {
        1: {
          tasks: { completed: 0, failed: 0 },
          gadgets: {
            push1: {
              name: "Carrots",
              possible: {push0:0, push1:1, push2:2, push3:3, push4:4},
              state: 0
            },
            push2: {
              name: "Cabbage",
              possible: {push0:0, push1:1, push2:2, push3:3, push4:4},
              state: 0
            }
          }
        }
      }
    });
  };

}]);
