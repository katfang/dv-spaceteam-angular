'use strict';

// Declare app level module which depends on views, and components
angular.module('gadgets', [])

.directive('helloWorld', function() {
  return {
      restrict: 'AE',
      replace: 'true',
      template: '<h3>Hello World!!</h3>'
  };
});
