'use strict';

angular.module('webdrivercssAdminpanelApp').directive('deleterepo', function($http) {

    return {
        restrict: 'E',
        scope: {
            shot: '=',
            project: '='
        },
        link: function($scope, element) {

            $scope.showRemove = 0;

            $scope.$watchCollection('[shot, project]', function(params) {
                $scope.project = params[1];
                if ($scope.project) {
                    $scope.showRemove = 1
                }
            });


            $scope.deleteRepo = function() {
                var deleteRepo = confirm("Are you sure that you want to delete images from: " + $scope.project + "?");
                if (deleteRepo) {
                    $http({
                        method: 'POST',
                        url: '/api/repositories/deleteRepo',
                        data: {
                            project: $scope.project,
                        }
                    }).success(function() {
                        location.href = '/';
                    });
                }
            };

        },
        templateUrl: '/directives/deleteRepo.html'
    };
});
