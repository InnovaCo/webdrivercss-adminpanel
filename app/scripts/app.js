'use strict';

angular.module('webdrivercssAdminpanelApp', [
    'ngResource',
    'ngSanitize',
    'ngRoute',
    'hljs'
])
.config(function($routeProvider, $locationProvider, hljsServiceProvider) {

    $routeProvider.when('/', {
        templateUrl: 'partials/main',
        controller: 'MainCtrl',
        resolve: { repositories: 'ImageRepository' }
    }).when('/regression-tests/:primaryNav', {
        templateUrl: 'partials/main',
        controller: 'MainCtrl',
        resolve: { repositories: 'ImageRepository' }
    }).when('/regression-tests/:primaryNav/:secondaryNav', {
        templateUrl: 'partials/main',
        controller: 'MainCtrl',
        resolve: { repositories: 'ImageRepository' }
    }).when('/regression-tests/:primaryNav/:secondaryNav/:tertiaryNav', {
        templateUrl: 'partials/main',
        controller: 'MainCtrl',
        resolve: { repositories: 'ImageRepository' }
    }).otherwise({
        redirectTo: '/'
    });

    $locationProvider.html5Mode(true);

    hljsServiceProvider.setOptions({
        // replace tab with 4 spaces
        tabReplace: '    '
    });
});
