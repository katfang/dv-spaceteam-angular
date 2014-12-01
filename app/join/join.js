'use strict';

angular.module('join', ['ngRoute', 'firebase'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/join', {
    templateUrl: 'join/join.html',
    controller: 'JoinCtrl'
  });
  $routeProvider.when('/lose/:roomKey', {
    templateUrl: 'join/lose.html',
    controller: 'LoseCtrl'
  });
}])

.controller('JoinCtrl', ['$rootScope', '$scope', '$firebase', '$location', '$http', function($rootScope, $scope, $firebase, $location, $http) {
  var ref = new Firebase("https://google-spaceteam.firebaseio.com");
  $scope.joinState = "no-auth"; // options are no-auth -> no-room -> waiting -> ready 

  // Get authentication
  $scope.auth = null;
  $scope.uid = null;
  var authUnwatcher = $scope.$watch("auth", function(newValue, oldValue) {
    if (newValue !== null) {
      $scope.uid = newValue.uid;
      $scope.joinState = "no-room";
      authUnwatcher();
    }
  });
  $scope.auth = ref.getAuth();
  if ($scope.auth === null) {
    ref.authAnonymously(function(error, authData) {
      if (error !== null) {
        console.log("Error authenticating anonymously", error);
      } else {
        $scope.auth = authData;
        $scope.$apply();
      }
    }, {remember: "sessionOnly"}); 
  }

  $scope.joinRoom = function() {
    var roomRef = ref.child($scope.room);
    $scope.joinState = "waiting";
    
    // set user in the room
    var usersRef = roomRef.child("users");
    var usersUpdateDict = {};
    usersUpdateDict[$scope.uid] = false;
    usersRef.update(usersUpdateDict); //TODO: tx to check that the username isn't taken or do anon user thing

    // LISTEN for when the room begins
    var beginCallback = function(snap) {
      if (snap.val() === "ready") {
        $location.path('room/' + $scope.room + "/1");
        roomRef.child("level/1/state").off('value', beginCallback);
        $scope.$apply();
      }
    };
    roomRef.child("level/1/state").on('value', beginCallback); 
  };
  
  $scope.startRoom = function() {
    // !!! SERVER
    // $http.post("http://130.211.156.29:8080/roomgen", {key: $scope.room, level:1}).
    $http.post("http://localhost:8080/roomgen", {key: $scope.room, level:1}).
    success(function(data, status, headers, config) {
      console.log("SUCCESSFUL roomgen");
    }).
    error(function(data, status, headers, config) {
      console.log("ERROR on roomgen");
    });
  };

  $rootScope.showFooter = false;
}])

.controller('LoseCtrl', ['$rootScope', '$scope', '$routeParams', '$http', function($rootScope, $scope, $routeParams, $http) {
  $rootScope.showFooter = false;

  var roomRef = new Firebase("https://google-spaceteam.firebaseio.com").child($routeParams.roomKey);
  var levelRef = roomRef.child("lose-screen");
  var usersUpdateDict = {};
  usersUpdateDict[roomRef.getAuth().uid] = false;
  levelRef.child("users").update(usersUpdateDict);

  var callServer = function() { 
    // !!! SERVER
    // $http.post("http://130.211.156.29:8080/lose-screen", {key: $routeParams.roomKey}).
    $http.post("http://localhost:8080/lose-screen", {key: $routeParams.roomKey}).
    success(function(data, status, headers, config) {
      console.log("SUCCESSFUL lose-screen");
    }).
    error(function(data, status, headers, config) {
      console.log("ERROR on lose-screen");
    });
  };
  callServer();

}]);
