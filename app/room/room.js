'use strict';

angular.module('room', ['ngRoute', 'firebase'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/room/:roomKey/:level', {
    templateUrl: 'room/room.html',
    controller: 'RoomCtrl'
  });
}])

.controller('RoomCtrl', ['$scope', '$routeParams', '$firebase', '$location', 'levelGenerator', 'helper', function($scope, $routeParams, $firebase, $location, levelGenerator, helper) {
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

  // Reference to the level
  var levelRef = new Firebase("https://google-spaceteam.firebaseio.com").child($routeParams.roomKey)
      .child("level").child($routeParams.level);
  var levelSync = $firebase(levelRef);
  levelSync.$asObject().$bindTo($scope, "level");
  
  // start the level once we have gadgets
  // TODO wait until everyone has loaded the room
  var gadgetsWatcher = $scope.$watch("level.gadgets", function(newValue, oldValue) {
    console.log("$scope.$watch");
    if (newValue !== undefined && oldValue === undefined && $scope.progress === 'in-progress') {
      generateInstruction();
      gadgetsWatcher();
    }
  });

  // Keep track of old instructions
  $scope.pastInstructions = [];

  // Creates a random instruction
  var randomInstruction = function() {
    var gadgetKey = helper.selectRandomKey($scope.level.gadgets);
    var gadget = $scope.level.gadgets[gadgetKey];
    var stateKey = helper.selectRandomKey(gadget.possible);
    var state = gadget.possible[stateKey];
    return {gadgetKey : gadgetKey, gadget: gadget, state: state};
  }; 
  
  // Generate a new instruction and do setup 
  var generateInstruction = function() {
    cleanup();
    var oldInstruction = $scope.instruction;
    var instruction = randomInstruction();
    while (instruction.state === instruction.gadget.state || (oldInstruction != null && instruction.gadgetKey === oldInstruction.gadgetKey && instruction.state === oldInstruction.state)) {
      instruction = randomInstruction();
    }
    console.log(instruction);
    instruction.text = instruction.gadget.display.format(instruction.state);
    $scope.instruction = instruction;

    // listen for when the instruction is completed
    gadgetRef = levelRef.child("gadgets/" + instruction.gadgetKey + "/state");
    gadgetRef.on("value", function(snap) {
      if (snap.val() === instruction.state) {
        incrementCompleted();
      }
    });

    // set a timeout after which point the instruction failed
    timeout = setTimeout(function() {
      incrementFailed();
    }, 3000);
  };

  // keep track of how many have been completed 
  var incrementCompleted = function() {
    var instruction = $scope.instruction;
    instruction['completed'] = true;
    $scope.pastInstructions.push(instruction.text);

    cleanup();
    generateInstruction();
    
    levelRef.child('tasks').transaction(function(currentData) {
      if (currentData === null) {
        return {'completed': 1, 'failed': 0};
      }
      currentData.completed += 1; 
      return currentData;
    });
  }; 

  // keep track of how many have been failed 
  var incrementFailed = function() {
    var instruction = $scope.instruction;
    instruction['completed'] = false;
    $scope.pastInstructions.push(instruction);

    cleanup();
    generateInstruction(); 
    levelRef.child('tasks').transaction(function(currentData) {
      if (currentData === null) {
        return {'completed': 0, 'failed': 1};
      }
      currentData.failed += 1; 
      return currentData;
    });
  }; 
  
  // Bind gadgets for display
  var myGadgetsRef = levelRef.child("gadgets").orderByChild("owner").equalTo($scope.uid);
  $firebase(myGadgetsRef).$asObject().$bindTo($scope, "gadgets");
  
  // Set the state of the gadget based on button pushes
  var setGadgetState = function(gadgetKey, state) {
    console.log("start setGadget", gadgetKey, state);
    levelRef.child("gadgets").child(gadgetKey).child("state").set(state);
    console.log("end setGadget", gadgetKey, state);
    // TODO probably should kick things off locally because it's possible that gadgetRef gets removed
  };

  // Determine if you won or lost
  $scope.progress = "in-progress"
  levelRef.child('tasks').on('value', function(snap) {
    if (snap.val() === null) { 
      $scope.progress = "in-progress"
    } else if (snap.val().completed >= 10) {
      win();
    } else if (snap.val().failed >= 10) {
      lose();
    }
  });
  
  var win = function() {
    cleanup();
    levelRef.child('tasks').off('value');
    $scope.progress = "win";
    $scope.instruction = null;

    // move onto next level
    levelGenerator().then(function(level) {
      var newLevel = parseInt($routeParams.level) + 1;
      levelRef.parent().child(newLevel).child("tasks").update(level.tasks);
      levelRef.parent().child(newLevel).child("gadgets").update(level.gadgets);
      $location.path('room/' + $routeParams.roomKey + '/' + newLevel);
    });
  };

  var lose = function() {
    cleanup();
    levelRef.child('tasks').off('value');
    $scope.progress = "lose";
    $scope.instruction = null;
  };
  
  // Expose click handlers
  $scope.levelNumber = $routeParams.level;
  $scope.generateInstruction = generateInstruction; 
  $scope.setGadgetState = setGadgetState;
}]);
