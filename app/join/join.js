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

.controller('JoinCtrl', ['$rootScope', '$scope', '$firebase', '$location', 'gadgetsGenerator', 'host', function($rootScope, $scope, $firebase, $location, gadgetsGenerator, host) {
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

    // generate gadgets and set user in the level
    // START SERVER FUNC
    gadgetsGenerator.newGadgets().then(function(gadgets) {
      ref.child($scope.room).child("level/1/gadgets").update(gadgets);
      ref.child($scope.room).child("level/1/users").update(usersUpdateDict);
    });
    // END SERVER FUNC
    
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
    var roomRef = ref.child($scope.room);
    
    // set room so server knows we're ready to start
    roomRef.child("level/1/state").set('waiting');

    // START HOST CODE 
    var levelRef = roomRef.child("level/1");
    host.initTasks(levelRef);
    host.checkLevelGenerated(levelRef, roomRef);
    // END HOST CODE
  };

  $rootScope.showFooter = false;
}])

.controller('LoseCtrl', ['$rootScope', '$scope', '$routeParams', 'host', function($rootScope, $scope, $routeParams, host) {
  $rootScope.showFooter = false;

  var roomRef = new Firebase("https://google-spaceteam.firebaseio.com").child($routeParams.roomKey);
  var levelRef = roomRef.child("lose-screen");
  
  // START HOST CODE
  // this is actually a check to make sure everyone got to the lose screen 
  host.checkLevelGenerated(levelRef, roomRef); 
  var readyCallback = function(snap) {
    if (snap.val() === "ready") {
      roomRef.set(null);
      levelRef.child("state").off('value', readyCallback);
    }
  };
  levelRef.child("state").on("value", readyCallback);
  // END HOST CODE

  var usersUpdateDict = {};
  usersUpdateDict[roomRef.getAuth().uid] = false;
  levelRef.child("users").update(usersUpdateDict);
}]);
