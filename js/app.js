"use strict";
(function(angular, _) {
	angular.module("app", [ "ui.bootstrap", "LocalStorageModule", "ngTagsInput" ]);
	
	angular.module("app").config(["localStorageServiceProvider", function($storage) {
		$storage.setPrefix("hangdebt");
	}]);
	
	angular.module("app").controller("AppCtrl", ["$scope", "localStorageService", function($scope, $storage) {
		$scope.participants = $storage.get("participants") || [ ];
		$scope.purchases = $storage.get("purchases") || [ ];
		$scope.purchase = { };
		$scope.selectedPurchaseIndex = -1;
		$scope.total = 0;
		$scope.results = [];
		
		$scope.$watchCollection("participants", function(val) {
			$storage.set("participants", $scope.participants);
		});
		
		$scope.$watchCollection("purchases", function(val) {
			$storage.set("purchases", $scope.purchases);
			calculate();
		});
		
		$scope.dropAllParticipants = function() {
			$scope.participants = [ ];
			$storage.remove("participants");
		}
		
		$scope.savePurchase = function() {
			if($scope.selectedPurchaseIndex < 0) {
				$scope.purchases.push($scope.purchase);
			}
			else {
				$scope.purchases[$scope.selectedPurchaseIndex] = $scope.purchase;
			}
			$scope.cancelPurchase();
			$storage.set("purchases", $scope.purchases);
		}
		
		$scope.dropAllPurchases = function() {
			$scope.purchases = [ ];
			$scope.cancelPurchase();
			$storage.remove("purchases");
		}
		
		$scope.loadPurchase = function(index) {
			$scope.selectedPurchaseIndex = index;
			$scope.purchase = _.cloneDeep($scope.purchases[$scope.selectedPurchaseIndex]);
		}
		
		$scope.dropPurchase = function() {
			if($scope.selectedPurchaseIndex > -1) {
				_.pullAt($scope.purchases, $scope.selectedPurchaseIndex);
				$scope.cancelPurchase();
			}
		}
		
		$scope.cancelPurchase = function() {
			$scope.purchase = { };
			$scope.selectedPurchaseIndex = -1;
		}
		
		function calculate() {
			$scope.results = [ ];
			$scope.total = _.reduce($scope.purchases, function(total, purchase) {
				return total + parseInt(purchase.price);
			}, 0);
			
			var pairs = { }
				;
				
			_.each($scope.purchases, function(purchase) {
				var toAll = purchase.whom.length === 0,
					price = purchase.price / (toAll ? $scope.participants.length : purchase.whom.length),
					whom = toAll ? $scope.participants : purchase.whom,
					pair, ordered
					;
				
				_.each(whom, function(participant) {
					if(purchase.who === participant.text) {
						return;
					}
					ordered = [purchase.who, participant.text].sort();
					pair = ordered.join("$$");
					pairs[pair] = pairs[pair] || 0;
					if(participant.text == ordered[0]) {
						pairs[pair] += price;
					}
					else {
						pairs[pair] -= price;
					}
				});
			});

			_.each(pairs, function(total, pair) {
				var ordered;
				if(total > 0) {
					ordered = pair.split("$$");	
				}
				else {
					ordered = _(pair.split("$$")).reverse().value();
					total = -total;
				}
				
				$scope.results.push({
					from: ordered[0],
					to: ordered[1],
					total: total
				});
			});
			
			$scope.results = _.sortBy($scope.results, "from");
			console.log($scope.results);
		}
		
	}]);
})(angular, _);