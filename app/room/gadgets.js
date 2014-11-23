'use strict';

// Declare app level module which depends on views, and components
angular.module('gadgets', [])

.directive('buttonGadget', function() {
  return {
    restrict: 'E',
    templateUrl: 'room/button-gadget.html',
    scope: {
      key: '=key',
      gadget: '=gadget'
    }
  };
})

.directive('sliderGadget', ['$timeout', function($timeout) {
  return {
    restrict: 'E',
    templateUrl: 'room/slider-gadget.html',
    scope: {
      key: '=key',
      gadget: '=gadget'
    },
    link: function(scope, element, attrs) {
      /* JQUERY
      $(window).load(function() {
        console.log($('#slider' + scope.key));
        $('#slider' + scope.key).slider({
          value:100,
          min: 0,
          max: 500,
          step: 50,
          slide: function( event, ui ) {
            console.log(ui.value);
          }
        });
        */

        //* BOOTSTRAP
      $timeout(function () {
        $('#' + scope.key).slider({
          formatter: function(value) {
            console.log("What about now?", value);
            return 'Current value: ' + value;
          }
        }); 
      }); //*/
    }
  };
}]);
