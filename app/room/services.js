'use strict';

angular.module('roomServices', ['firebase'])

.factory('host', ['$firebase', function($firebase) {
  var checkLevelGenerated = function(levelRef) {
    var numInRoom = null;
    var numInLevel = null;
    var roomUsersRef = levelRef.parent().parent().child("users");
    var levelUsersRef = levelRef.child("users");
    var roomCallback = function(snap) {
      console.log("room callback");
      if (snap.val() !== null) {
        numInRoom = snap.numChildren();
        checkForStart();
      }
    }; 
    var levelCallback = function(snap) {
      console.log("level callback");
      if (snap.val() !== null) {
        numInLevel = snap.numChildren();
        checkForStart();
      }
    };
    var checkForStart = function() {
      console.log("check for start");
      if (numInRoom !== null && numInLevel !== null && numInRoom === numInLevel) {
        roomUsersRef.off('value', roomCallback);
        levelUsersRef.off('value', levelCallback);
        levelRef.child("state").set("ready");
      }
    };
    roomUsersRef.on('value', roomCallback);
    levelUsersRef.on('value', levelCallback);
  };

  var initTasks = function(levelRef) {
    levelRef.child("tasks").set({completed:0, failed:0});
  };

  return {
    checkLevelGenerated: checkLevelGenerated,
    initTasks: initTasks 
  };
}])

.factory('gadgetsGenerator', ['$firebase', '$q', 'helper', function($firebase, $q, helper) {
  var ref = new Firebase("https://google-spaceteam.firebaseio.com/-gadgets");
  var auth = ref.getAuth();
  ref.onAuth(function(authData) {
    auth = authData;
  });

  var newGadgets = function() {
    var deferred = $q.defer();
    if (auth === null) {
      deferred.reject("No authentication data");
    } else {
      var uid = auth.uid;
      var callback = function(snap) {
        var allGadgets = snap.val();
        if (allGadgets !== null) {
          ref.off('value', callback);
          var gadgets = {};
          while (Object.keys(gadgets).length < 5) {
            var gadgetKey = helper.selectRandomKey(allGadgets);
            gadgets[gadgetKey] = allGadgets[gadgetKey];
            gadgets[gadgetKey].owner = uid;
          }
          deferred.resolve(gadgets);
        }
      };
    }
    ref.on('value', callback);
    return deferred.promise;
  };

  var randomInstruction = function(gadgets) {
    var gadgetKey = helper.selectRandomKey(gadgets);
    while (gadgetKey === '$id' || gadgetKey === '$priority') {
      gadgetKey = helper.selectRandomKey(gadgets);
    }
    var gadget = gadgets[gadgetKey];
    var stateKey = helper.selectRandomKey(gadget.possible);
    var state = gadget.possible[stateKey];
    var text = gadget.display.format(state);
    var gadgetCurrentState = (gadget.state !== undefined) ? gadget.state : null; 
    return {gadgetKey : gadgetKey, text: text, gadgetCurrentState: gadgetCurrentState, state: state};
  };
  
  return {
    newGadgets: newGadgets,
    randomInstruction: randomInstruction
  };
}])

.factory('levelGenerator', ['$firebase', '$q', 'helper', function($firebase, $q, helper) {
  var ref = new Firebase("https://google-spaceteam.firebaseio.com/-gadgets");
  return function(username) {
    var deferred = $q.defer();
    var callback = function(snap) {
      if (snap.val() !== null) {
        ref.off('value', callback);
        var gadgets = snap.val();
        var level = {tasks: {completed:0, failed:0}, gadgets:{}};
        while (Object.keys(level.gadgets).length < 5) {
          var gadgetKey = helper.selectRandomKey(gadgets);
          level.gadgets[gadgetKey] = gadgets[gadgetKey];
          level.gadgets[gadgetKey].owner = helper.getUsername();
        }
        deferred.resolve(level);
      }
    };
    ref.on('value', callback);
    return deferred.promise;
  };
}]);
