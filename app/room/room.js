'use strict';

angular.module('room', ['ngRoute', 'firebase'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/room/:roomKey/:level', {
    templateUrl: 'room/room.html',
    controller: 'RoomCtrl'
  });
}])

.controller('RoomCtrl', ['$scope', '$routeParams', '$firebase', function($scope, $routeParams, $firebase) {
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

  // helper method
  var selectRandomKey = function(dict) {
    var keys = Object.keys(dict);
    var selectedKey = keys[Math.floor(Math.random() * keys.length)];
    return selectedKey;
  };

  // Reference to the level
  var levelRef = new Firebase("https://google-spaceteam.firebaseio.com").child($routeParams.roomKey)
      .child("level").child($routeParams.level);
  var levelSync = $firebase(levelRef);
  levelSync.$asObject().$bindTo($scope, "level");
  
  // start the level once we have gadgets
  // TODO wait until everyone has loaded the room
  $scope.$watch("level.gadgets", function(newValue, oldValue) {
    if (newValue !== undefined && oldValue === undefined && $scope.progress === 'in-progress') {
      generateInstruction();
    }
  });

  // Keep track of old instructions
  $scope.pastInstructions = [];

  // Creates a random instruction
  var randomInstruction = function(oldInstruction) {
    var gadgetKey = selectRandomKey($scope.level.gadgets);
    var gadget = $scope.level.gadgets[gadgetKey];
    var stateKey = selectRandomKey(gadget.possible);
    var state = gadget.possible[stateKey];
    while (state === gadget.state || 
      (oldInstruction != null && gadget.name === oldInstruction.name && state === oldInstruction.state)) {
      stateKey = selectRandomKey(gadget.possible);
      state = gadget.possible[stateKey];
    }
    return {gadgetKey : gadgetKey, name: gadget.name, state: state};
  }; 
  
  // Generate a new instruction and do setup 
  var generateInstruction = function() {
    cleanup();
      var instruction = randomInstruction($scope.instruction);
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
    $scope.pastInstructions.push(instruction);

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
  
  // Actually displaying the gadgets
  var gadgetsRef = levelRef.child("gadgets");
  var gadgetsSync = $firebase(gadgetsRef);
  gadgetsSync.$asObject().$bindTo($scope, "gadgets");

  // Set the state of the gadget based on button pushes
  var setGadgetState = function(gadgetKey, state) {
    gadgetsRef.child(gadgetKey).child("state").set(state);
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
  };

  var lose = function() {
    cleanup();
    levelRef.child('tasks').off('value');
    $scope.progress = "lose";
    $scope.instruction = null;
  };

  // Expose click handlers
  $scope.generateInstruction = generateInstruction; 
  $scope.setGadgetState = setGadgetState;
}]);
