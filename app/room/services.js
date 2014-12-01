'use strict';

angular.module('roomServices', ['firebase'])

.factory('gadgetsGenerator', ['$firebase', '$q', 'helper', function($firebase, $q, helper) {
  var randomInstruction = function(gadgets) {
    var gadgetKey = helper.selectRandomKey(gadgets);
    if (gadgetKey === null) {
      return null;
    } else {
      var gadget = gadgets[gadgetKey];
      var stateKey = helper.selectRandomKey(gadget.possible);
      var state = gadget.possible[stateKey];
      var text = gadget.display.format(state);
      var gadgetCurrentState = (gadget.state !== undefined) ? gadget.state : null; 
      return {gadgetKey : gadgetKey, text: text, gadgetCurrentState: gadgetCurrentState, state: state};
    }
  };
  
  return {
    randomInstruction: randomInstruction
  };
}]);
