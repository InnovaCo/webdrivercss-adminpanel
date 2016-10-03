'use strict';

angular.module('webdrivercssAdminpanelApp').controller('MainCtrl', function($scope, repositories, $routeParams) {

    $scope.repositories = repositories;
    $scope.project = $routeParams.primaryNav;
    $scope.noReposFound = Object.keys($scope.repositories).length === 0;

    $scope.diffs = [];
    $scope.shots = [];
    $scope.api = document.location.protocol + '//' + document.location.hostname + ':' + document.location.port + '/api/repositories/';
    $scope.apiForDownload = document.location.protocol + '//' + document.location.hostname + ':' + document.location.port + '/api/tar/';

    if ($routeParams.primaryNav && Object.keys(repositories).length) {
        $scope.project = $routeParams.primaryNav
        if ($routeParams.tertiaryNav) {
            $scope.project = $scope.project + "/" + $routeParams.secondaryNav + "/" + $routeParams.tertiaryNav;
        } else if ($routeParams.secondaryNav) {
            $scope.project = $scope.project + "/" + $routeParams.secondaryNav;
        }
        $scope.dir = $scope.project
        $scope.diffs = repositories[$scope.project].diffs;
        $scope.shots = repositories[$scope.project].images;
    }

    angular.forEach($scope.diffs, function(diff) {
        $scope.shots.splice($scope.shots.indexOf(diff.replace(/diff/, 'regression')), 1);
        $scope.shots.splice($scope.shots.indexOf(diff.replace(/diff/, 'baseline')), 1);
    });

});
