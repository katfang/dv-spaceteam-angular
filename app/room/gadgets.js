'use strict';

// Declare app level module which depends on views, and components
angular.module('gadgets', [])

.directive('buttonGadget', ['$timeout', function($timeout) {
  return {
    restrict: 'E',
    templateUrl: 'room/button-gadget.html',
    scope: {
      key: '=',
      gadget: '=',
      room: '=roomMetadata',
    },
    link: function($scope, element, attrs) {
      var ref = new Firebase("https://google-spaceteam.firebaseio.com/" + $scope.room.key + "/level/" + $scope.room.level + "/gadgets/" + $scope.key + "/state");
      $timeout(function() {
        $('#' + $scope.key).children("button").each(function(index) {
          $(this).on('click', function(event) { 
            ref.set($(this).text());
          });
        });
      });
    }
  };
}])

.directive('sliderGadget', ['$timeout', function($timeout) {
  return {
    restrict: 'E',
    templateUrl: 'room/slider-gadget.html',
    scope: {
      key: '=',
      gadget: '=',
      room: '=roomMetadata',
      state: '='
    },
    link: function($scope, element, attrs) {
      $timeout(function() {
        var sliderElem = document.getElementById($scope.key);
        sliderElem.addEventListener("input", function() {
          $scope.state = parseInt(sliderElem.value);
        }, false);
      });
    }
  };
}]);
