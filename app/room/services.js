'use strict';

angular.module('roomServices', ['firebase'])

.factory('gadgetsGenerator', ['$firebase', '$q', 'helper', function($firebase, $q, helper) {
  var ref = new Firebase("https://google-spaceteam.firebaseio.com/-gadgets");
  var auth = ref.getAuth();
  ref.onAuth(function(authData) {
    auth = authData;
  });

  return function() {
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
