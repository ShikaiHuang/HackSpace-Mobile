/*
* HackSpace Mobile
* services.js
* author: SHIKAI HUANG
* all the services of AngularJS are included
*/

angular.module('hackspace.services', [])

//this service provide the functions to setting and getting
//the info of current user
.service('userLogin',function(){
    // this.user = {};
    var user = {}
    this.getUsername = function() {
        return user.username;
    };
    this.setUsername = function (username) {
        user.username = username;
    };
    this.setUserDevice = function(deviceName){
        user.userDevice = deviceName;
    }
    this.getUserDevice = function(){
        return user.userDevice
    }
})

//return the Parse object that has been connected to database
.service('connectDb',function(){
    Parse.initialize("admin","123");
    Parse.serverURL = 'http://formiya.herokuapp.com/parse';
    this.connectDb = function(){
        return Parse
    }
})

.service('taskService',function(){
    var task = {}
    this.setTask = function(dataType,operation,number,output,action,ab_location,mo_location){
        task.dataType = dataType;
        task.operation = operation;
        task.number = number;
        task.output = output;
        task.action = action;
        task.ab_location = ab_location;
        task.mo_location = mo_location;
    }
})

.service('locationtaskService',function(){
    var loTask = {}
    this.isDone = function() {
        return loTask.isDone;
    };
    this.setDone = function (flag) {
        loTask.isDone = flag;
    };
    this.isNew = function() {
        return loTask.isNew;
    };
    this.setNew = function (flag) {
        loTask.isNew = flag;
    };
    this.getLat = function() {
        return loTask.lat;
    };
    this.setLat = function (lat) {
        loTask.lat = lat;
    };
    this.getLng = function() {
        return loTask.lng;
    };
    this.setLng = function (lng) {
        loTask.lng = lng;
    };
    this.getAddress = function() {
        return loTask.address;
    };
    this.setAddress = function (address) {
        loTask.address = address;
    };
    this.getOperation = function() {
        return loTask.operation;
    };
    this.setOperation = function (operation) {
        loTask.operation = operation;
    };
    this.getNumber = function() {
        return loTask.number;
    };
    this.setNumber = function (number) {
        loTask.number = number;
    };
})

.service('deviceDetialService',function(){
    var device = {}
    this.getDevicename = function() {
        return device.devicename;
    };
    this.setDevicename = function (devicename) {
        device.devicename = devicename;
    };
    this.setDeviceAccessible = function(accessible){
        device.accessible = accessible;
    };
    this.getDeviceAccessible = function(){
        return device.accessible;
    };
    this.getDeviceowner = function() {
        return device.owner;
    };
    this.setDeviceowner = function (owner) {
        device.owner = owner;
    };
    this.getDeviceid = function() {
        return device.id;
    };
    this.setDeviceid = function (id) {
        device.id = id;
    };
})