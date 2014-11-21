'use strict';

angular.module('room', ['ngRoute', 'firebase'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/room/:roomKey/:level', {
    templateUrl: 'room/room.html',
    controller: 'RoomCtrl'
  });
}])

.controller('RoomCtrl', ['$scope', '$routeParams', '$firebase', '$location', 'levelGenerator', 'gadgetsGenerator', 'host', function($scope, $routeParams, $firebase, $location, levelGenerator, gadgetsGenerator, host) {
  var authRef = new Firebase("https://google-spaceteam.firebaseio.com");
  $scope.auth = authRef.getAuth();
  $scope.uid = $scope.auth.uid;
  
  var gadgetRef = null;
  var timeout = null;
  
  // helper method for cleaning up listeners and timeouts
  var cleanup = function() {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    if (gadgetRef != null) {
      gadgetRef.off('value');
    }
    gadgetRef = null;
    timeout = null;
  }

  // Reference to the level & user (of level)
  var levelRef = new Firebase("https://google-spaceteam.firebaseio.com").child($routeParams.roomKey)
      .child("level").child($routeParams.level);
  var userRef = levelRef.child("users").child($scope.uid);

  // Number of tasks completed / failed 
  $scope.tasks = null;
  $firebase(levelRef.child("tasks")).$asObject().$bindTo($scope, "tasks");
  
  // Track state 
  $scope.levelState = null;
  var stateCallback = function(snap) {
    $scope.levelState = snap.val();
    
    // move onto next level
    if ($scope.levelState === 'win') { 
      var newLevel = parseInt($routeParams.level) + 1;
      var newLevelRef = levelRef.parent().child(newLevel);

      // START SERVER FUNC
      // generate gadgets for the next level
      gadgetsGenerator.newGadgets().then(function(gadgets) {
        newLevelRef.child("gadgets").update(gadgets);
        var usersUpdateDict = {};
        usersUpdateDict[$scope.uid] = false;
        newLevelRef.child("users").update(usersUpdateDict);
      });
      // END SERVER FUNC

      // START HOST CODE
      host.initTasks(newLevelRef);
      host.checkLevelGenerated(newLevelRef);
      // END HOST CODE

      // listen for next level
      var beginCallback = function(snap) {
        if (snap.val() === "ready") {
          $location.path('room/' + $routeParams.roomKey + '/' + newLevel);
          newLevelRef.child("state").off('value', beginCallback);
          $scope.$apply();
        }
      };
      newLevelRef.child('state').on('value', beginCallback);
      levelRef.child('state').off('value', stateCallback);
    }
  };
  levelRef.child("state").on('value', stateCallback);
  
  // start the level once we have gadgets
  // TODO wait until everyone has loaded the room
  $firebase(levelRef.child("gadgets")).$asObject().$bindTo($scope, "gadgets");
  var gadgetsUnwatcher = $scope.$watch("gadgets", function(newValue, oldValue) {
    if (newValue !== undefined && oldValue === undefined && 
       ($scope.levelState !== 'win' && $scope.levelState !== 'lose')) {
      setInstruction();
      gadgetsUnwatcher();
    }
  });

  // Keep track of old instructions
  $scope.pastInstructions = [];
  
  // START SERVER FUNC
  var setInstruction = function() {
    var oldInstruction = $scope.instruction;
    var instruction = gadgetsGenerator.randomInstruction($scope.gadgets);
    while (instruction.state === instruction.gadgetCurrentState || 
          (oldInstruction !== null && instruction.gadgetKey === oldInstruction.gadgetKey && instruction.state === oldInstruction.state)) {
      instruction = gadgetsGenerator.randomInstruction($scope.gadgets);
    }
    userRef.set(instruction);
  };
  // END SERVER FUNC 

  // Listen for instruction 
  $scope.instruction = null;
  var userStateCallback = function(snap) {
    if (snap.val() !== null) {
      var userState = snap.val();
      
      // we have instruction
      if (userState !== false && userState !== true && $scope.levelState === 'ready') {
        cleanup();
        $scope.instruction = snap.val();

        // listen for when the instruction is completed
        gadgetRef = levelRef.child("gadgets/" + $scope.instruction.gadgetKey + "/state");
        gadgetRef.on("value", function(gadgetSnap) {
          if (gadgetSnap.val() === $scope.instruction.state) {
            taskEnded(/* completed = */ true);
          }
        });

        // set a timeout after which point the instruction failed
        timeout = setTimeout(function() {
          taskEnded(/* completed = */ false);
        }, 3000);
      }
    }
  };
  userRef.on('value', userStateCallback);

  // finish task whether completed or failed 
  var taskEnded = function(completed) {
    var instruction = $scope.instruction;
    instruction['completed'] = completed;
    $scope.pastInstructions.push(instruction);
    cleanup();
    
    levelRef.child('tasks').transaction(function(currentData) {
      if (currentData === null) {
        return {completed: 0, failed: 0};
      }

      if (completed) {
        currentData.completed += 1; 
      } else {
        currentData.failed += 1;
      }

      return currentData;
    });

    setInstruction();
  }; 
  
  // Bind gadgets for display
  var myGadgetsRef = levelRef.child("gadgets").orderByChild("owner").equalTo($scope.uid);
  $firebase(myGadgetsRef).$asObject().$bindTo($scope, "ownedGadgets");
  
  // Set the state of the gadget based on button pushes
  var setGadgetState = function(gadgetKey, state) {
    console.log("start setGadget", gadgetKey, state);
    levelRef.child("gadgets").child(gadgetKey).child("state").set(state);
    console.log("end setGadget", gadgetKey, state);
    // TODO probably should kick things off locally because it's possible that gadgetRef gets removed
  };

  // START HOST CODE
  // Determine if you won or lost
  $scope.$watch("tasks", function(newValue) {
    if (newValue !== null) { 
      if (newValue.completed >= 10) {
        setFinalState("win"); 
      } else if (newValue.failed >= 10) {
        setFinalState("lose");
      }
    }
  });
  // END HOST CODE
  
  var setFinalState = function(state) {
    finalCleanup();
    levelRef.child("state").transaction(function(currentData) {
      if (currentData === "ready") {
        return state; 
      } else {
        return undefined;
      }
    });
  }; 
  
  var finalCleanup = function() {
    cleanup();
    $scope.instruction = null;
  };
  
  // Expose click handlers
  $scope.levelNumber = $routeParams.level;
  $scope.setInstruction = setInstruction; 
  $scope.setGadgetState = setGadgetState;
}]);
