'use strict';

angular.module('roomServices', ['firebase'])

.factory('levelGenerator', ['$firebase', '$q', function($firebase, $q) {
  var ref = new Firebase("https://google-spaceteam.firebaseio.com/-gadgets");
  return function() {
    var deferred = $q.defer();
    var callback = function(snap) {
      if (snap.val() !== null) {
        ref.off('value', callback);
        deferred.resolve({
          tasks: {completed:0, failed:0},
          gadgets: snap.val()
        });
      }
    };
    ref.on('value', callback);
    return deferred.promise;
  };
}]);
