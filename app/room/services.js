'use strict';

angular.module('roomServices', ['firebase'])

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
