// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkID=397704
// To debug code on page load in Ripple or on Android devices/emulators: launch your app, set breakpoints, 
// and then run "window.location.reload()" in the JavaScript Console.
(function () {
    "use strict";

    document.addEventListener('deviceready', onDeviceReady.bind(this), false);

    function onDeviceReady() {

        $("form").submit(function (e) {
            e.preventDefault();
        });

        getLichessUser();

        $('#login-btn').click(lichessLogin);

        $('#logout-btn').click(lichessLogout);

        $('#getUser-btn').click(getLichessUser);

        $('#createMachineGame-btn').click(createMachineGame);

        $('#createOTBGame-btn').click(createOTBGame);
        

        // Handle the Cordova pause and resume events
        document.addEventListener('pause', onPause.bind(this), false);
        document.addEventListener('resume', onResume.bind(this), false);

        // TODO: Cordova has been loaded. Perform any initialization that requires Cordova here.

    };

    function onPause() {
        // TODO: This application has been suspended. Save application state here.
    };

    function onResume() {
        // TODO: This application has been reactivated. Restore application state here.
    };
})();


// (c) 2013-2015 Don Coleman
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/* global mainPage, deviceList, refreshButton, statusDiv */
/* global detailPage, resultDiv, messageInput, sendButton, disconnectButton */
/* global cordova, bluetoothSerial  */
/* jshint browser: true , devel: true*/
'use strict';

var app = {
    initialize: function () {
        this.bindEvents();
        this.showMainPage();
    },
    bindEvents: function () {

        var TOUCH_START = 'touchstart';
        if (window.navigator.msPointerEnabled) { // windows phone
            TOUCH_START = 'MSPointerDown';
        }
        document.addEventListener('deviceready', this.onDeviceReady, false);
        refreshButton.addEventListener(TOUCH_START, this.refreshDeviceList, false);
        //sendButton.addEventListener(TOUCH_START, this.sendData, false);
        disconnectButton.addEventListener(TOUCH_START, this.disconnect, false);
        deviceList.addEventListener('touchstart', this.connect, false);
    },
    onDeviceReady: function () {
        app.refreshDeviceList();
    },
    refreshDeviceList: function () {
        bluetoothSerial.list(app.onDeviceList, app.onError);
    },
    onDeviceList: function (devices) {
        var option;

        // remove existing devices
        deviceList.innerHTML = "";
        app.setStatus("");

        devices.forEach(function (device) {

            var listItem = document.createElement('li'),
                html = '<b>' + device.name + '</b><br/>' + device.id;

            listItem.innerHTML = html;

            if (cordova.platformId === 'windowsphone') {
                // This is a temporary hack until I get the list tap working
                var button = document.createElement('button');
                button.innerHTML = "Connect";
                button.addEventListener('click', app.connect, false);
                button.dataset = {};
                button.dataset.deviceId = device.id;
                listItem.appendChild(button);
            } else {
                listItem.dataset.deviceId = device.id;
            }
            deviceList.appendChild(listItem);
        });

        if (devices.length === 0) {

            option = document.createElement('option');
            option.innerHTML = "No Bluetooth Devices";
            deviceList.appendChild(option);

            if (cordova.platformId === "ios") { // BLE
                app.setStatus("No Bluetooth Peripherals Discovered.");
            } else { // Android or Windows Phone
                app.setStatus("Please Pair a Bluetooth Device.");
            }

        } else {
            app.setStatus("Found " + devices.length + " device" + (devices.length === 1 ? "." : "s."));
        }

    },
    connect: function (e) {
        var onConnect = function () {
            // subscribe for incoming data
            bluetoothSerial.subscribe('\n', app.onData, app.onError);


            app.setStatus("Connected");
            app.showDetailPage();
        };

        var deviceId = e.target.dataset.deviceId;
        if (!deviceId) { // try the parent
            deviceId = e.target.parentNode.dataset.deviceId;
        }

        bluetoothSerial.connect(deviceId, onConnect, app.onError);
    },
    onData: function (data) { // data received from Arduino
        dataKeeper = data;
        console.log(dataKeeper + "was sent from EVO/chesstronic");

        source = dataKeeper.substring(0, 2);
        target = dataKeeper.substring(2, 4);
        sendMove(source, target);
    },
    //sendData: function (event) { // send data to Arduino

    //    //event.stopPropagation();

    //    var success = function () {
    //        console.log("success");
    //    };

    //    var failure = function () {
    //        alert("Failed writing data to Bluetooth peripheral");
    //    };

    //    var data = latestMove;
    //    bluetoothSerial.write(data, success, failure);

    //},
    disconnect: function (event) {
        bluetoothSerial.disconnect(app.showMainPage, app.onError);
    },
    showMainPage: function () {
        mainPage.style.display = "";
        detailPage.style.display = "none";
    },
    showDetailPage: function () {
        mainPage.style.display = "none";
        detailPage.style.display = "";
    },
    setStatus: function (message) {
        console.log(message);

        window.clearTimeout(app.statusTimeout);
        statusDiv.innerHTML = message;
        statusDiv.className = 'fadein';

        // automatically clear the status with a timer
        app.statusTimeout = setTimeout(function () {
            statusDiv.className = 'fadeout';
        }, 5000);
    },
    onError: function (reason) {
        alert("ERROR: " + reason); // real apps should use notification.alert
    }
};