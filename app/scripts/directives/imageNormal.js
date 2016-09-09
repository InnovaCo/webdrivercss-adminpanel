'use strict';

angular.module('webdrivercssAdminpanelApp').directive('imagenormal', function($http) {

    return {
        restrict: 'E',
        scope: {
            shot: '=',
            project: '='
        },
        link: function($scope, element) {

            $scope.toggleshot = 0;

            $scope.$watchCollection('[shot,project]', function(params) {
                $scope.shotImg = params[0];
                $scope.shotID = $scope.shotImg;
                $scope.project = params[1];

                element.attr('id', $scope.shotID);
            });


            $scope.removeImages = function() {
                $http({
                    method: 'POST',
                    url: '/api/repositories/removeImages',
                    data: {
                        project: $scope.project,
                        file: $scope.shot.replace(/baseline/, 'remove')
                    }
                }).success(function() {
                    element.parents('.panel:eq(0)').remove();
                    element.find('img').remove();
                    element.find('canvas, .toggleNormal').remove();
                });

            };

        },
        templateUrl: '/directives/imageNormal.html'
    };
});
