'use strict';

angular.module('join', ['ngRoute', 'firebase'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/join', {
    templateUrl: 'join/join.html',
    controller: 'JoinCtrl'
  });
}])

.controller('JoinCtrl', ['$scope', '$firebase', '$location', 'gadgetsGenerator', 'host', function($scope, $firebase, $location, gadgetsGenerator, host) {
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
    host.checkLevelGenerated(levelRef);
    // roomRef.child("level/1/tasks").set({completed:0, failed:0});

    /*
    // check users in room == users in level 
    var numInRoom = null;
    var numInLevel = null;
    var roomUsersRef = roomRef.child("users");
    var levelUsersRef = roomRef.child("level/1/users");
    var roomCallback = function(snap) {
      if (snap.val() !== null) {
        numInRoom = snap.numChildren();
        checkForStart();
      }
    }; 
    var levelCallback = function(snap) {
      if (snap.val() !== null) {
        numInLevel = snap.numChildren();
        checkForStart();
      }
    };
    var checkForStart = function() {
      if (numInRoom !== null && numInLevel !== null && numInRoom === numInLevel) {
        roomUsersRef.off('value', roomCallback);
        levelUsersRef.off('value', levelCallback);
        roomRef.child("level/1/state").set('ready');
      }
    };
    roomUsersRef.on('value', roomCallback);
    levelUsersRef.on('value', levelCallback);
    END HOST CODE */
  };
}]);
