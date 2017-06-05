/*
* HackSpace Mobile
* services.js
* author: SHIKAI HUANG
* all the controllers are included
* the controllers can be found by the indice
*/

angular.module('hackspace.controllers', [])

/*******************************************************************
//index login
*******************************************************************/
.controller('loginCtrl',function($scope,userLogin,connectDb,$state,$ionicPopup,$ionicLoading){
    $scope.data ={};
    // login function
    $scope.login = function(){
    //connect to database
        var curParse = connectDb.connectDb();
        var deviceid = new Fingerprint({canvas: true}).get();
        $ionicLoading.show({
            content: 'Connecting to the database...',
            showBackdrop: false
        });
        curParse.User.logIn($scope.data.username, $scope.data.password, {
            success: function(user) {
                // after successful login.
                $ionicLoading.hide();
                alert('Successfully login! ' + 'Hello! '+$scope.data.username);
                userLogin.setUsername($scope.data.username);
                //stores the current username in sessionStorage to pass to controllers
                window.sessionStorage.setItem('curUser',$scope.data.username);
                window.location.href='main.html';
            },
            error: function(user, error) {
                // The login failed. Check error to see why.
                alert("Error: " + " " + error.message);
                $ionicLoading.hide();
            }
        });
    }
    // jump to signup view page
    $scope.signup = function(){
        window.location.href='signup.html';
    }
})

/*******************************************************************
//index signup
*******************************************************************/
.controller('signupCtrl',function($scope,connectDb,$ionicLoading){
    $scope.data ={};
    $scope.signup = function(){
        var curParse = connectDb.connectDb()
        // Parse.initialize("admin","123");
        // Parse.serverURL = 'http://formiya.herokuapp.com/parse';
        //create a new object type User
        var user = new curParse.User();
        user.set('username',$scope.data.username);
        user.set('password',$scope.data.password);
        user.set('email',$scope.data.email);
        $ionicLoading.show({
            content: 'Connecting to the database...',
            showBackdrop: false
        });
        // Checks to make sure that both the username and email are unique. 
        // Securely hashes the password in the cloud using bcrypt
        user.signUp(null, {
            success: function(user) {
                $ionicLoading.hide();
                alert('New user has been created: ' + user.get('username'));
                window.location.href='index.html'
            },
            error: function(user, error) {
                // Show the error message somewhere and let the user try again.
                $ionicLoading.hide();
                alert("Error: " + error.code + " " + error.message);
            }
        });
    }
})

/*******************************************************************
//index device controller
*******************************************************************/
.controller('devicesCtrl', function($scope, $ionicModal,connectDb,userLogin,$state,deviceDetialService,$ionicLoading,$ionicPopup) {
    var deviceid = new Fingerprint({canvas: true}).get();
    var curParse = connectDb.connectDb();
    var Device = curParse.Object.extend("Device");

    $scope.$on("$ionicView.beforeEnter", function(){
        // getting the username from sessionStorage
        userLogin.setUsername(window.sessionStorage.getItem('curUser'));
        // getting the device id by fingerprint algorithm
        //var deviceid = new Fingerprint({canvas: true}).get();
        // sending query to database 
        var query_userdevice = new curParse.Query(Device);
        var query_publicdevice = new curParse.Query(Device);
        // finding the devices that belong to the user
        query_userdevice.equalTo("deviceowner", userLogin.getUsername());
        // finding the devices that are set as 'public'
        query_publicdevice.equalTo("accessible", 'public');
        query_main = curParse.Query.or(query_userdevice,query_publicdevice);
        query_main.find({
            success: function(results) {
                // clear the device array
                $scope.devices.length = 0;
                for (var i = 0; i < results.length; i++) {
                    var object = results[i];
                    // pushing new items to the devices array
                    $scope.devices.push({name: object.get('devicename'), accessible: object.get('accessible'),state: object.get('state'),owner: object.get('deviceowner'),deviceid: object.get('deviceid')});
                }
                // refresh the $scope
                $scope.$apply();
            },
            error: function(error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    });

    $scope.devices = [];

    $scope.accessibles = [
        {a: 'private'},
        {a: 'public'}
    ]

    // to create the modal window
    $ionicModal.fromTemplateUrl('templates/modal.html', {
        scope: $scope
    }).then(function(modal) {
        $scope.modal = modal;
    });

    // to view the device details
    $scope.deviceDetils = function(d) {
        deviceDetialService.setDevicename(d.name);
        //deviceDetialService.setDeviceAccessible(d.accessible);
        deviceDetialService.setDeviceowner(d.owner);
        deviceDetialService.setDeviceid(d.deviceid);
        var myPopup = $ionicPopup.show({
            title: 'What do you want to do?',
            scope: $scope,
            buttons: [
                // button1 : stop the current task
                {
                    text: 'View the details',
                    onTap: function(e){
                        $state.go("deviceDetail", {
                            "deviceId": d.name
                        });
                    }
                },
                {
                    text: 'Logoff the device',
                    type: 'button-dark',
                    onTap: function(e){
                        var myPopup = $ionicPopup.show({
                            title: 'Are you sure to Logoff the task?',
                            template: 'If you confirm to logoff it, the device needs to be registered again',
                            scope: $scope,
                            buttons: [
                                {text: 'Cancel'},
                                {
                                    text: 'Confirm',
                                    type: 'button-dark',
                                    onTap: function(e){
                                        var query = new curParse.Query(Device);
                                        query.equalTo('deviceid',deviceid)
                                        query.first({
                                            success: function(result){
                                                result.destroy({
                                                    success: function(destroy_result) {
                                                        alert("the device "+ deviceid + " has been destoryed.");
                                                        //$scope.$apply();
                                                        $state.reload();
                                                    },
                                                    error: function(destroy_result, error) {
                                                    }
                                                });
                                            },
                                            error: function(){
                                            }
                                        })
                                    }
                                }
                            ]
                        })
                    }
                },
                {
                    text: 'Cancle',
                },
            ],
        });
    };
    
    $scope.refresh = function(){
        $state.reload();
    }

    // to register the current device and declarm its states
    // such as the owner and whether it is public or private 
    $scope.registerDevice = function(d) {
        var deviceid = new Fingerprint({canvas: true}).get();
        var curParse = connectDb.connectDb()
        var Device = curParse.Object.extend("Device");
        var device = new Device();
        var query = new curParse.Query(Device);
        // a new device to be registered can not have a duplicated id
        // a new device is allowed to have a duplicated device name
        // if there has been the same deviceid in the database, refusing register
        query.equalTo("deviceid", deviceid);
        // query.equalTo("deviceowner",userLogin.getUsername());
        $ionicLoading.show({
            content: 'Please wait a moment...',
            showBackdrop: false
        });
        query.find({
            success: function(results) {
                // to judge if this device has been registered.
                if(results.length == 0){
                    device.set('devicename',d.name);
                    device.set('deviceowner',userLogin.getUsername());
                    device.set('deviceid',deviceid);
                    device.set('accessible',d.accessible.a);
                    // to make the state 'activated', turn to setting
                    device.set('state','sleep');
                    device.save(null, {
                        success: function(result) {
                            $ionicLoading.hide();
                            alert('Successfully register! ' + result.get('devicename') + ' '+ 'is set as ' +result.get('accessible'));
                            $scope.devices.push({name: result.get('devicename'), accessible: result.get('accessible'), state: 'activated'})
                            $scope.modal.hide();
                            $state.reload();
                        },
                        error: function(result, error) {
                            $ionicLoading.hide();
                            alert('Failed to create new object, with error code: ' + error.message);
                        }
                    });
                }else{
                    $ionicLoading.hide();
                    alert('Sorry this device has been registered and device id is '+ deviceid);
                    $scope.modal.hide();
                    $state.reload();
                }
            },
            error: function(error) {
            }
        }); //find method ends
    }; //function registerDevice ends
})

/*******************************************************************
//index device detail controller
*******************************************************************/
.controller('deviceDetailCtrl',function($scope,deviceDetialService,$cordovaGeolocation,connectDb){
    $scope.deviceDetail = []
    $scope.$on("$ionicView.beforeEnter", function(){
        $scope.deviceDetail.length = 0;
        $scope.deviceDetail.push({key: "deviceName", value: deviceDetialService.getDevicename()});
        $scope.deviceDetail.push({key: "deviceOwner", value: deviceDetialService.getDeviceowner()});
        $scope.deviceDetail.push({key: "deviceId", value: deviceDetialService.getDeviceid()});
        curParse = connectDb.connectDb();
        var Coordinates = curParse.Object.extend("Coordinates");
        var query_c = new curParse.Query(Coordinates);
        // find out the device by device id
        query_c.equalTo("deviceid", deviceDetialService.getDeviceid());
        // findout the lastest location of the target device
        query_c.descending("_updated_at");
        query_c.first({
            success: function(object) {
                var json = object.toJSON();
                var lat = json.location.latitude;
                var lng = json.location.longitude;
                var latlng = new google.maps.LatLng(-37.7984899, 144.96381629999996);
                var newCoord = new google.maps.LatLng(lat, lng);
                var myOptions = {
                    zoom: 13,
                    center: latlng,
                    mapTypeId: google.maps.MapTypeId.ROADMAP
                };
                map = new google.maps.Map(document.getElementById("map"), myOptions);
                marker = new google.maps.Marker({
                    position: newCoord,
                    map: map
                });
            },
            error: function(error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
        
        //$scope.$apply();
    });
})

/*******************************************************************
//index rules controller
*******************************************************************/
.controller('rulesCtrl',function($scope,$state,locationtaskService,$timeout,connectDb,userLogin){
    var curParse = connectDb.connectDb()
    var Task = curParse.Object.extend("Task");
    var deviceid = new Fingerprint({canvas: true}).get();
    $scope.datatypes = [
        {dt: "Instagram_hashtag", disabled: true, flag_ab:false,flag_mo:false},
        {dt: "Instagram_number",disabled: true,flag_ab:false,flag_mo:false},
        {dt: "absolute_geolocation",disabled: false,flag_ab:true,flag_mo:false},
        {dt: "moving_geolocation",disabled: false,flag_ab:false,flag_mo:true}
    ];
    $scope.operations = [
        {op: "<", disabled: false},
        {op: "<=", disabled: false},
        {op: "==", disabled: false},
        {op: ">=", disabled: false},
        {op: ">", disabled: false},
        {op: "!=", disabled: false}
    ];
    $scope.logicgates = [
        {logi: "AND", disabled: true},
        {logi: "OR", disabled: true},
        {logi: "NOT", disabled: true}
    ];
    $scope.numbers = [
        {n: 100, disabled: false},
        {n: 300, disabled: false},
        {n: 500, disabled: false},
        {n: 1000, disabled: false},
        {n: 1500, disabled: false},
        {n: 2000, disabled: false},
        {n: 2500, disabled: false},
        {n: 3000, disabled: false}
    ];
    $scope.outputs = [
        {out: "Arduino", disabled: true},
        {out: "Philip Hue", disabled: true},
        {out: "Screen",disabled: false}
    ];
    $scope.actions = [
        {act: "alarm", disabled: false},
        {act: "shock", disabled: true}
    ];

    $scope.dates = [
        {d: "Monday", disabled: true},
        {d: "Tuesday", disabled: true},
        {d: "Wednesday", disabled: true},
        {d: "Thursday", disabled: true},
        {d: "Friday", disabled: true}
    ];
    $scope.times = [
        {t: "9:00", disabled: true},
        {t: "10:00", disabled: true},
        {t: "11:00", disabled: true},
        {t: "12:00", disabled: true},
        {t: "13:00", disabled: true},
        {t: "14:00", disabled: true},
        {t: "15:00", disabled: true},
        {t: "16:00", disabled: true},
        {t: "17:00", disabled: true}
    ];

    $scope.devices = [];

    $scope.selectedData = {};

    $scope.select = function(){
        $state.go("tab.map");
    };

    $scope.hackit = function(){
        var Device = curParse.Object.extend("Device");
        var device = new Device();
        var query = new curParse.Query(Device);
        query.equalTo("deviceid", deviceid);
        query.find({
            success: function(results) {
                    // should firstly register the device
                if(results.length == 0) {
                    alert('Sorry the device has not been registered, please register your device');
                } else{
                    if($scope.selectedData.selectedDataType == undefined){
                        alert('Please choose a datatype')
                    }else if($scope.selectedData.selectedOperation == undefined) {
                        alert('Please choose an operation')
                    }else if($scope.selectedData.selectedNum == undefined){
                        alert('Please choose a number')
                    }else if($scope.selectedData.selectedOutput == undefined){
                        alert('Please choose an output')
                    }else if($scope.selectedData.selectedAction == undefined){
                        alert('Please choose an action')
                    }else if($scope.selectedData.selectedTargetDevice ==undefined && $scope.selectedData.selectedAbsoluteLocation == undefined){
                        alert('Please choose your target location or device')
                    // The user choose an absolute location
                    }else if($scope.selectedData.selectedAbsoluteLocation !=undefined){
                        // alert($scope.selectedData.selectedDataType.dt+ ' ' + $scope.selectedData.selectedOperation.op + ' ' +$scope.selectedData.selectedNum.n + ' ' + $scope.selectedData.selectedOutput.out + ' ' + $scope.selectedData.selectedAction.act + ' ' +$scope.selectedData.selectedAbsoluteLocation);
                        var point = new curParse.GeoPoint({latitude: locationtaskService.getLat(), longitude: locationtaskService.getLng()});
                        // totally 12 attributes to save to the database
                        var task = new Task();
                        task.set("deviceid",deviceid);
                        task.set("location", point);
                        task.set("output",$scope.selectedData.selectedOutput.out)
                        task.set("user",userLogin.getUsername());
                        task.set("operation",$scope.selectedData.selectedOperation.op);
                        task.set("datatype",$scope.selectedData.selectedDataType.dt);
                        task.set("number",$scope.selectedData.selectedNum.n);
                        task.set("action",$scope.selectedData.selectedAction.act);
                        task.set("targetdevice",null)
                        task.set("targetdeviceid",null)
                        task.set("state","frozen")
                        task.set("address",$scope.selectedData.selectedAbsoluteLocation)
                        task.save(null, {
                            success: function(savedtask) {
                                alert('New task created with objectId: ' + savedtask.id);
                                $state.go("tab.history");
                            },
                            error: function(savedtask, error) {
                                alert('Failed to create new object, with error code: ' + error.message);
                            }
                        });
                    // the user choose a moving location
                    }else if($scope.selectedData.selectedTargetDevice != undefined){
                        // totally 12 attributes
                        var task = new Task();
                        task.set("deviceid",deviceid);
                        task.set("location", null);
                        task.set("user",userLogin.getUsername());
                        task.set("output",$scope.selectedData.selectedOutput.out)
                        task.set("operation",$scope.selectedData.selectedOperation.op);
                        task.set("datatype",$scope.selectedData.selectedDataType.dt);
                        task.set("number",$scope.selectedData.selectedNum.n);
                        task.set("action",$scope.selectedData.selectedAction.act);
                        task.set("targetdevice",$scope.selectedData.selectedTargetDevice.name)
                        task.set("targetdeviceid",$scope.selectedData.selectedTargetDevice.deviceid)
                        task.set("state","frozen")
                        task.set("address",null)
                        task.save(null, {
                            success: function(savedtask) {
                                alert('New task created with objectId: ' + savedtask.id);
                                $state.go("tab.history");
                            },
                            error: function(savedtask, error) {
                                alert('Failed to create new object, with error code: ' + error.message);
                            }
                        });
                    }
                }
            }
        });
    }

    $scope.$on("$ionicView.beforeEnter", function(){
        // alert($scope.selectedData.selectedDataType.dt+ ' ' + $scope.selectedData.selectedOperation.op + ' ' +$scope.selectedData.selectedNum.n + ' ' + $scope.selectedData.selectedOutput.out + ' ' + $scope.selectedData.selectedAction.act + ' ' +$scope.selectedData.selectedTargetDevice.name + $scope.selectedData.selectedTargetDevice.deviceid);
        $scope.selectedData.selectedAbsoluteLocation = locationtaskService.getAddress();
        var curParse = connectDb.connectDb();
        var Device = curParse.Object.extend("Device");
        var query_userdevice = new curParse.Query(Device);
        var query_admindevice = new curParse.Query(Device);
        var deviceid = new Fingerprint({canvas: true}).get();
        // find out all the private device of the user
        query_userdevice.equalTo("deviceowner", userLogin.getUsername);
        // find out the public devices
        query_admindevice.equalTo("accessible", 'public');
        query_main = curParse.Query.or(query_userdevice,query_admindevice);
        query_main.find({
            success: function(results) {
                $scope.devices.length = 0;
                for (var i = 0; i < results.length; i++) {
                    var object = results[i];
                    //eliminate the device itself
                    if(object.get('deviceid') == deviceid){
                        //judge that if the device can be chosen in moving_location
                        $scope.devices.push({name: object.get('devicename'), disabled: true, deviceid: object.get('deviceid')});
                        // if the state of the device is activated, it can be 
                        // chosen from the select box
                    }else if(object.get('state') == 'activated'){
                        $scope.devices.push({name: object.get('devicename'), disabled: false, deviceid: object.get('deviceid')});
                    }else{
                        $scope.devices.push({name: object.get('devicename'), disabled: true, deviceid: object.get('deviceid')});
                    }
                }
                $scope.$apply();
            },
            error: function(error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    });
})

/*******************************************************************
//index mapcontroller
*******************************************************************/
.controller('mapCtrl',function($scope,userLogin,$cordovaGeolocation,$state,$ionicLoading, locationtaskService){
    var map;
    var marker;
    var infowindow;
    var geocoder;
    var markersArray = [];
    var circleArray = [];
    var curLat;
    var curLng;
    var curAddress;

    function initialize() {
        //setting the center
        var latlng = new google.maps.LatLng(-37.7984899, 144.96381629999996);
        var myOptions = {
            zoom: 13,
            center: latlng,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        map = new google.maps.Map(document.getElementById("map"), myOptions);
        geocoder = new google.maps.Geocoder();
        //listening the map click
        google.maps.event.addListener(map, 'click', function (event) {
            placeMarker(event.latLng);
            //drawCircle(event.latLng,300,'#FF0000');
            //drawCircle(event.latLng,500,'#008080');
        });
        google.maps.event.addListener(map, 'mousemove', function (event) {
            clearOverlays(infowindow); 
        });
    }

    $scope.centerOnMe = function() {
        $ionicLoading.show({
            content: 'Getting current location...',
            showBackdrop: false
        });
        navigator.geolocation.getCurrentPosition(function(pos) {
            newCoord = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
            map.setCenter(newCoord);
            //$scope.loading.hide();
            $ionicLoading.hide();
            marker = new google.maps.Marker({
                position: newCoord,
                map: map
            });
        }, function(error) {
            alert('Unable to get location: ' + error.message);
        });
    };

    function drawCircle(location,radius,color) {
        var mapCircle = new google.maps.Circle({
            strokeColor: color,
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: color,
            fillOpacity: 0.1,
            map: map,
            center: location,
            radius: radius
          });
        //mapCircle.setMap(map);
        circleArray.push(mapCircle);
    }

    function placeMarker(location) {
        clearOverlays(infowindow);//delete all the marks on the map
        marker = new google.maps.Marker({
            position: location,
            map: map,
            icon: 'img/blue_MarkerT.png'
        });
        //marker.setMap(map);
        markersArray.push(marker);
        //getting coordinates by lat and lng
        if (geocoder) {
            geocoder.geocode({ 'location': location }, function (results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    if (results[0]) {
                        attachSecretMessage(marker, results[0].geometry.location, results[0].formatted_address);
                    }
                } else {
                    alert("Geocoder failed due to: " + status);
                }
            });
        }
    }
    //showing lat and lng in the map
    function attachSecretMessage(marker, piont, address) {
        var message = "<b>Coordinates:</b>" + piont.lat() + " , " + piont.lng() + "<br />" + "<b>Address:</b>" + address;
        var infowindow = new google.maps.InfoWindow(
            {
                content: message,
                size: new google.maps.Size(50, 50)
            });
        infowindow.open(map, marker);
        if (typeof (mapClick) == "function") mapClick(piont.lng(), piont.lat(), address);
    }
    //delete all the marks
    function clearOverlays(infowindow) {
        if (circleArray && circleArray.length > 0) {
            for (var i = 0; i < circleArray.length; i++) {
                circleArray[i].setMap(null);
            }
            circleArray.length = 0;
        }
        if (markersArray && markersArray.length > 0) {
            for (var i = 0; i < markersArray.length; i++) {
                markersArray[i].setMap(null);
            }
            markersArray.length = 0;
        }
        if (infowindow) {
            infowindow.close();
        }
    }

    function mapClick(lng, lat, address) {
        document.getElementById("lng").value = lng;
        document.getElementById("lat").value = lat;
        document.getElementById("address").value = address;
        curLng = lng;
        curLat = lat;
        curAddress = address;
    }

    $scope.save = function(){
        locationtaskService.setLat(curLat);
        locationtaskService.setLng(curLng);
        locationtaskService.setAddress(curAddress);
        //locationtaskService.setNew(true);
        //alert('current coordinates: '+locationtaskService.getAddress());
        var fingerprint = new Fingerprint({canvas: true}).get();
        //alert(fingerprint);
        $state.go("tab.rules");
    }

    initialize();
})

/*******************************************************************
//index history controller
*******************************************************************/
.controller('historyCtrl',function($scope,locationtaskService,userLogin,$state,connectDb,$ionicPopup){
    $scope.historys = [];
    var deviceid = new Fingerprint({canvas: true}).get();
    var curParse = connectDb.connectDb();
    var Task = curParse.Object.extend("Task");
    $scope.intervelDict = {};
    $scope.$on("$ionicView.beforeEnter", function() {
        $scope.historys.length = 0;
        var query = new curParse.Query(Task);
        query.equalTo("deviceid", deviceid);
        query.find({
            success: function(results) {
                for (var i = 0; i < results.length; i++) {
                    var object = results[i];
                    // totally 13 attributes(adding 'createAt')
                    $scope.historys.push({taskid:object.id,user:object.get('user'),operation:object.get('operation'), datatype:object.get('datatype'), number:object.get('number'),action: object.get('action'),location:object.get('location'),output: object.get('output'),targetdevice:object.get('targetdevice'),state:object.get('state'),beginDate:object.createdAt,address:object.get('address'),targetdeviceid: object.get('targetdeviceid')});
                }
                // update data binding
                $scope.$apply();
            },
            error: function(error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    });
    $scope.refresh = function(){
        $state.reload();
    }

    $scope.doneTask = function(taskid,beginDate,datatype,user,operation,number,action,output,targetdevice,address){
        var myPopup = $ionicPopup.show({
            title: 'What do you want to do?',
            scope: $scope,
            buttons: [
                { 
                    text: 'Delete the task',
                    type: 'button-dark',
                    onTap: function(e){
                        var myPopup = $ionicPopup.show({
                            title: 'Are you sure to delete the task?',
                            scope: $scope,
                            buttons: [
                                {text: 'Cancel'},
                                {
                                    text: 'Confirm',
                                    type: 'button-dark',
                                    onTap: function(e){
                                        var query = new curParse.Query(Task);
                                        query.get(taskid, {
                                            success: function(retrieving_result) {
                                                retrieving_result.destroy({
                                                    success: function(destroy_result) {
                                                        alert("the task "+ taskid + " has been destoryed.");
                                                        //$scope.$apply();
                                                        $state.reload();
                                                    },
                                                    error: function(destroy_result, error) {
                                                    }
                                                });
                                            },
                                            error: function(retrieving_result, error) {
                                            }
                                        });
                                    }
                                }
                            ]
                        })
                    }
                },
                // the third button: cancel the task
                { text: 'Cancel' },
            ]
        });
    }

    $scope.frozenTask = function(taskid,beginDate,datatype,user,operation,number,action,output,targetdevice,targetdeviceid,address){
        var myPopup = $ionicPopup.show({
            title: 'What do you want to do?',
            scope: $scope,
            buttons: [
                // the first button: process the task
                {
                    text: 'Process the task',
                    type: 'button-dark',
                    onTap: function(e) {
                        var flag = false;
                        // when the distance is less than a given number, then allow high accuracy positioning
                        var option = {maximumAge:100000, timeout:3000, enableHighAccuracy: flag}
                        var interval = setInterval(function(){
                            navigator.geolocation.getCurrentPosition(function(position){
                                //console.log(position.coords.latitude + ' ' +position.coords.longitude)
                                var myPoint = new curParse.GeoPoint({latitude: position.coords.latitude, longitude: position.coords.longitude});
                                var query = new curParse.Query(Task);
                                // processing an absolute location
                                if(targetdevice == undefined){
                                    query.get(taskid, {
                                        success: function(task) {
                                            //console.log()
                                            targetPoint = task.get('location');
                                            var distance = myPoint.kilometersTo(targetPoint) * 1000;
                                            //console.log(distance);
                                            // open the high accuracy positioning
                                            if(distance <= number+100 || distance >= number-100){
                                                flag = true;
                                            }
                                            if(operation == '<=' || operation == '<'){
                                                if(distance <= number){
                                                    alert('Your task completed! '+'Taskid: ' + taskid + ' Details: ' + operation +' ' + number + ' ' + address);
                                                    clearInterval($scope.intervelDict[taskid]);
                                                    task.set('state','done');
                                                    task.save();
                                                    $state.reload();
                                                }
                                            }
                                            if(operation == '>=' || operation == '>'){
                                                if(distance >= number){
                                                    alert('Your task completed! '+'Taskid: ' + taskid + ' Details: ' + operation +' ' + number + ' ' + address);
                                                    clearInterval($scope.intervelDict[taskid]);
                                                    task.set('state','done');
                                                    task.save();
                                                    $state.reload();
                                                }
                                            }
                                            if(operation == '='){
                                                if(distance == number){
                                                    alert('Your task completed! '+'Taskid: ' + taskid + ' Details: ' + operation +' ' + number + ' ' + address);
                                                    clearInterval($scope.intervelDict[taskid]);
                                                    task.set('state','done');
                                                    task.save();
                                                    $state.reload();
                                                }
                                            }
                                        },
                                        error: function(task, error) {
                                        }
                                    });
                                // processing an moving_location task
                                }else{
                                    var Coordinates = curParse.Object.extend("Coordinates");
                                    var query_c = new curParse.Query(Coordinates);
                                    // find out the device by device id
                                    query_c.equalTo("deviceid", targetdeviceid);
                                    // findout the lastest location of the target device
                                    query_c.descending("_updated_at");

                                    query.get(taskid, {
                                        success: function(task) {
                                            query_c.first({
                                                success: function(result) {
                                                    if(result.length == 0){
                                                        alert("Sorry we cannot find the location of the device, try again later please")
                                                    }else{
                                                        //console.log(result.id);
                                                        targetPoint = result.get('location');
                                                        var distance = myPoint.kilometersTo(targetPoint) * 1000;
                                                        //console.log(distance)
                                                        // the following operation is similar to absolute-location processing
                                                        if(distance <= number+100 || distance >= number-100){
                                                            flag = true;
                                                        }
                                                        if(operation == '<=' || operation == '<'){
                                                            if(distance <= number){
                                                                alert('Your task completed! '+'Taskid: ' + taskid + ' Details: ' + operation +' ' + number + ' ' + targetdevice);
                                                                clearInterval($scope.intervelDict[taskid]);
                                                                task.set('state','done');
                                                                task.save();
                                                                $state.reload();
                                                            }
                                                        }
                                                        if(operation == '>=' || operation == '>'){
                                                            if(distance >= number){
                                                                alert('Your task completed! '+'Taskid: ' + taskid + ' Details: ' + operation +' ' + number + ' ' + targetdevice);
                                                                clearInterval($scope.intervelDict[taskid]);
                                                                task.set('state','done');
                                                                task.save();
                                                                $state.reload();
                                                            }
                                                        }
                                                        if(operation == '='){
                                                            if(distance == number){
                                                                alert('Your task completed! '+'Taskid: ' + taskid + ' Details: ' + operation +' ' + number + ' ' + targetdevice);
                                                                clearInterval($scope.intervelDict[taskid]);
                                                                task.set('state','done');
                                                                task.save();
                                                                $state.reload();
                                                            }
                                                        }
                                                    }
                                                },
                                                error: function(error) {
                                                    alert("Error: " + error.code + " " + error.message);
                                                }
                                            });
                                        },
                                        error: function(task,error){
                                        }
                                    });
                                }
                            },function(error){console.log('Just a minute...')},option);
                        },2000);
                        $scope.intervelDict[taskid] = interval;
                        var query = new curParse.Query(Task);
                        query.get(taskid, {
                            success: function(task) {
                                task.set("state","processing")
                                task.save();
                                $state.reload();
                            },
                            error: function(task, error) {
                            }
                        });
                    },
                },
                // The second button: delete the task
                { 
                    text: 'Delete the task',
                    type: 'button-dark',
                    onTap: function(e){
                        var myPopup = $ionicPopup.show({
                            title: 'Are you sure to delete the task?',
                            scope: $scope,
                            buttons: [
                                {text: 'Cancel'},
                                {
                                    text: 'Confirm',
                                    type: 'button-dark',
                                    onTap: function(e){
                                        var query = new curParse.Query(Task);
                                        query.get(taskid, {
                                            success: function(retrieving_result) {
                                                retrieving_result.destroy({
                                                    success: function(destroy_result) {
                                                        alert("the task "+ taskid + " has been destoryed.");
                                                        //$scope.$apply();
                                                        $state.reload();
                                                    },
                                                    error: function(destroy_result, error) {
                                                    }
                                                });
                                            },
                                            error: function(retrieving_result, error) {
                                            }
                                        });
                                    }
                                }
                            ]
                        })
                    }
                },
                // the third button: cancel the task
                { text: 'Cancel' },
            ]
        });
    }

    $scope.processingTask = function(taskid,beginDate,datatype,user,operation,number,action,output,targetdevice,address){
        var myPopup = $ionicPopup.show({
            title: 'What do you want to do?',
            scope: $scope,
            buttons: [
                // button1 : stop the current task
                {
                    text: 'Stop the task',
                    onTap: function(e){
                        clearInterval($scope.intervelDict[taskid]);
                        var query = new curParse.Query(Task);
                        query.get(taskid, {
                            success: function(task) {
                                task.set("state","frozen")
                                task.save();
                                alert('The task has been set as frozen!')
                                $state.reload();
                            },
                            error: function(task, error) {
                            }
                        });
                    }
                },
                {
                    text: 'Delete the task',
                    type: 'button-dark',
                    onTap: function(e){
                        var myPopup = $ionicPopup.show({
                            title: 'Are you sure to delete the task?',
                            scope: $scope,
                            buttons: [
                                {text: 'Cancel'},
                                {
                                    text: 'Confirm',
                                    type: 'button-dark',
                                    onTap: function(e){
                                        var query = new curParse.Query(Task);
                                        query.get(taskid, {
                                            success: function(retrieving_result) {
                                                retrieving_result.destroy({
                                                    success: function(destroy_result) {
                                                        alert("the task "+ taskid + " has been destoryed.");
                                                        //$scope.$apply();
                                                        $state.reload();
                                                    },
                                                    error: function(destroy_result, error) {
                                                    }
                                                });
                                            },
                                            error: function(retrieving_result, error) {
                                            }
                                        });
                                    }
                                }
                            ]
                        })
                    }
                },
                {
                    text: 'Cancle',
                },
            ],
        });
    }
})


/*******************************************************************
//account controller
*******************************************************************/
.controller('accountCtrl',function($scope,userLogin){
    $scope.account = [];
    $scope.$on("$ionicView.beforeEnter",function(){
        // clear the cookie
        $scope.account.length = 0;
        $scope.account.push({key:"name", value:userLogin.getUsername()});
    });
})

/*******************************************************************
//about device controller
*******************************************************************/
.controller('aboutDeviceCtrl',function($scope,userLogin,connectDb){
    $scope.device = [];
    $scope.$on("$ionicView.beforeEnter",function(){
        // clear the cookie
        var curParse = connectDb.connectDb();
        var deviceid = new Fingerprint({canvas: true}).get();
        var Device = curParse.Object.extend("Device");
        var query = new curParse.Query(Device);
        query.equalTo("deviceid", deviceid);
        query.first({
            success: function(result){
                var owner = result.get('deviceowner');
                $scope.device.length = 0;
                $scope.device.push({key:"deviceid", value:deviceid},{key:"device owner", value: owner});
                $scope.$apply();
            },
            error: function(){

            }
        })
    });
})



/*******************************************************************
//index setting controller
*******************************************************************/
.controller('settingCtrl', function($scope, $state, connectDb,$ionicPopup) {
    $scope.intervel = null;
    $scope.pushNotification = { checked: false };
    var curParse = connectDb.connectDb();
    var deviceid = new Fingerprint({canvas: true}).get();
    var Coordinates = curParse.Object.extend("Coordinates");
    var coor = new Coordinates();
    $scope.$on("$ionicView.beforeEnter",function(){
        // clear the cookie
        var Device = curParse.Object.extend("Device");
        var query = new curParse.Query(Device);
        query.equalTo("deviceid", deviceid);
        query.find({
            success: function(results){
                if(results.length == 0) {
                    $scope.pushNotification.checked = false;
                    $scope.$apply();
                }
            },
            error: function(){

            }
        })
    });


    $scope.pushNotificationChange = function() {
        //console.log('Push Notification Change', $scope.pushNotification.checked);
        if($scope.pushNotification.checked){
            var Device = curParse.Object.extend("Device");
            var device = new Device();
            var query = new curParse.Query(Device);
            //console.log('deviceid' + deviceid)
            query.equalTo("deviceid", deviceid);
            query.find({
                success: function(results) {
                    // should firstly register the device
                    if(results.length == 0) {
                        alert('sorry the device has not been registered');
                        $scope.pushNotification.checked = false;
                        $scope.$apply();
                    } else {
                        //actually only one will be retrieved
                        //alert("Successfully retrieved " + results.length + " scores.");
                        for (var i = 0; i < results.length; i++) {
                            var object = results[i];
                            // set the device as 'activated'
                            object.set('state','activated');
                            object.save();
                            alert('The device has been set as ' + object.get('state') + ' . Please refresh your devices view');
                            if (navigator.geolocation) {
                                $scope.intervel = setInterval(function(){
                                    navigator.geolocation.getCurrentPosition($scope.uploadPosition);
                                },3000)
                            } else {
                                alert("Geolocation is not supported by this browser");
                            }
                        }

                    }
                },
                error: function(error) {
                    alert("Error: " + error.code + " " + error.message);
                }
            });
        }
        if(!$scope.pushNotification.checked){
            var Device = curParse.Object.extend("Device");
            var device = new Device();
            var query = new curParse.Query(Device);
            query.equalTo("deviceid", deviceid);
            query.find({
                success: function(results) {
                    //alert("Successfully retrieved " + results.length + " scores.");
                    for (var i = 0; i < results.length; i++) {
                        var object = results[i];
                        // set the device to be 'sleep'
                        object.set('state','sleep');
                        object.save();
                        alert('The device has been set as ' +object.get('state') + ' . Please refresh your devices view');
                        clearInterval($scope.intervel);
                    }
                },
                error: function(error) {
                    alert("Error: " + error.code + " " + error.message);
                }
            });
        }
      };

    $scope.uploadPosition = function (position) {
        var point = new curParse.GeoPoint({latitude: position.coords.latitude, longitude: position.coords.longitude});
        coor.set("location", point);
        coor.set("deviceid", deviceid);
        coor.save(null, {
            success: function(newCoordinate) {
                //console.log('New object created with objectId: ' + newCoordinate.id);
            },
            error: function(newCoordinate, error) {
                alert('Failed to create new object, with error code: ' + error.message);
            }
        });
    }

    $scope.logout = function() {
        var Device = curParse.Object.extend("Device");
        var device = new Device();
        var query_d = new curParse.Query(Device);
        var Task = curParse.Object.extend("Task");
        var query_t = new curParse.Query(Task);
        var myPopup = $ionicPopup.show({
            template: 'The device will sleep after you log out and all the tasks in the device will be provisionally freezed.',
            title: 'Are you sure to log out?',
            //subTitle: 'Please use normal things',
            scope: $scope,
            buttons: [
                { text: 'Cancel' },
                {
                    text: '<b>Confirm</b>',
                    type: 'button-dark',
                    onTap: function(e) {
                        // firstly set the device to be 'sleep', then set all the tasks to be 'frozen'
                        query_d.equalTo("deviceid", deviceid);
                        query_d.find({
                            success: function(results) {
                                for (var i = 0; i < results.length; i++) {
                                    var object = results[i];
                                    object.set('state','sleep');
                                    object.save();
                                // alert('The device has been set as ' +object.get('state') + ' . Please refresh your devices view');
                                }
                                query_t.equalTo("deviceid", deviceid);
                                query_t.find({
                                    success: function(results_t){
                                        //alert(results_t.length);
                                        for(var j = 0; j < results_t.length; j++){
                                            var object_t = results_t[j];
                                            object_t.set('state','frozen');
                                            object_t.save();
                                        }
                                        window.location.href='index.html';
                                    },
                                    error: function(error){
                                        alert("Error: " + error.code + " " + error.message);
                                    }
                                });
                            },
                            error: function(error) {
                                alert("Error: " + error.code + " " + error.message);
                            }
                        });

                    }
                },
            ]
        });
        myPopup.then(function(res) {
             console.log('Tapped!', res);
        });
   };
})


