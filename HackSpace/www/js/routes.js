/*
* HackSpace Mobile
* services.js
* author: SHIKAI HUANG
* all the routes are included
*/

angular.module('hackspace.routes', [])

.config(function($stateProvider, $urlRouterProvider) {

    $stateProvider
        .state("tab", {
            url: "/tab",
            abstract: true,
            templateUrl: "templates/tabs.html",
        })
        .state('tab.devices', {
            url: '/devices',
            views: {
                'tab-devices': {
                    templateUrl: 'templates/tab-devices.html',
                    controller: "devicesCtrl"
                }
            }
        })
        .state('deviceDetail', {
            url: '/deviceDetail/:messageId',
            templateUrl: "templates/device-detail.html",
            controller: "deviceDetailCtrl"
        })
        .state('tab.map',{
            url: '/map',
            views: {
                // here is the same view as tab-device
                'tab-rules': {
                    templateUrl: 'templates/map.html',
                    controller: "mapCtrl"
                }
            }
        })
        .state('tab.rules', {
            url: '/rules',
            views: {
                'tab-rules': {
                    templateUrl: 'templates/tab-rules.html',
                    controller: "rulesCtrl"
                }
            }
        })
        .state('tab.history', {
            url: '/history',
            views: {
                'tab-history': {
                    templateUrl: 'templates/tab-history.html',
                    controller: "historyCtrl"
                }
            },
        })
        .state('tab.setting', {
            url: '/setting',
            views: {
                'tab-setting': {
                    templateUrl: 'templates/tab-setting.html',
                    controller: "settingCtrl"
                }
            }
        })
        .state('tab.account', {
            url: '/account',
            views: {
                'tab-setting': {
                    templateUrl: 'templates/account.html',
                    controller: "accountCtrl"
                }
            }
        })
        .state('tab.about-device', {
            url: '/about-device',
            views: {
                'tab-setting': {
                    templateUrl: 'templates/about-device.html',
                    controller: "aboutDeviceCtrl"
                }
            }
        })

    $urlRouterProvider.otherwise("/tab/devices");
});