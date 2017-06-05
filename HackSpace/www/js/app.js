/*
* HackSpace Mobile
* app.js
* author: SHIKAI HUANG
* Ionic Starter App. angular.module is a global place for creating, registering and retrieving Angular modules
* 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
* the 2nd parameter is an array of 'requires'
*/

angular.module('hackspace', ['ionic', 'hackspace.controllers', 'hackspace.routes',
    'hackspace.services', 'hackspace.directives','ngCordova',
])


// to repair the problem in chrome 
.directive('select',function(){ //same as "ngSelect"
    return {
        restrict: 'E',
        scope: false,
        link: function (scope, ele) {
            ele.on('touchmove touchstart',function(e){
                e.stopPropagation();
            })
        }
    }
})

.config(['$ionicConfigProvider', function($ionicConfigProvider) {

    $ionicConfigProvider.tabs.position('bottom'); // other values: top

}])

//initialize global variables
//before $rootscope is the original
//service works
//delete messageService and dateService
.run(function($ionicPlatform, $http ,$rootScope, $state, $ionicTabsDelegate,userLogin) {
    // $rootScope.$on('$ionicView.afterEnter', function () {
    //   // if the state to enter names "rules"，then the title bar conseals, else disappears
    //   if($state.current.name == 'tab.map'){
    //     alert("Here is map!");
    //     //mapService.initMap();
    //     // window.onload = function () {
    //     //     mapService.setiInit();
    //     // }
    // }
    //   // $ionicTabsDelegate.showBar($state.current.name != 'tab.rules');
    // });

    var url = "";
    if (ionic.Platform.isAndroid()) {
        url = "/android_asset/www/";
    }

    $ionicPlatform.ready(function() {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            StatusBar.styleDefault();
        }
    });
});
