var async               = require("async"),
    wifi_manager        = require("./app/wifi_manager")(),
    dependency_manager  = require("./app/dependency_manager")(),
    config              = require("./config.json"),
    ping                = require("net-ping").createSession(),
    exec                = require("child_process").exec,
    iwconfig            = require('wireless-tools/iwconfig');

/*****************************************************************************\
    1. Check for an existing internet connection
    2. Check for dependencies
    3. Check to see if we are connected to a wifi AP
    4. If connected to a wifi, do nothing -> exit
    5. Convert system to act as a AP (with a configurable SSID)
    6. Host a lightweight HTTP server which allows for the user to connect and
       configure the system's wifi connection. The interfaces exposed are RESTy so
       other applications can similarly implement their own UIs around the
       data returned.
    7. Once the system is successfully configured, reset it to act as a wifi
       device (not AP anymore), and setup its wifi network based on what the
       user picked.
    8. At this stage, the system is named, and has a valid wifi connection which
       its bound to, reboot the system and re-run this script on startup.
\*****************************************************************************/
async.series([
    function test_if_wireless_interface_exists(next_step) {
        iwconfig.status(function(error, status) {
            if (!error && status[0] != null) {
                var interface = status[0]['interface'];
                // @todo Save stdout as the wireless interface name
                next_step();
            } else {
                console.log("No wireless interface exists. Exiting.")
                process.exit(0);
            }
        });
    },

    // Check if we already have an internet connection and bail out if so
    function test_is_internet_up(next_step) {
        ping.pingHost('www.google.com', function (error, target) {
            if (!error) {
                console.log("There is an existing internet connection. Exiting.")
                process.exit(0);
            }
            next_step();
        });
    },

    // Check if we have the required dependencies installed
    function check_binary_deps(next_step) {
        dependency_manager.check_deps({
            "binaries": ["dhcpd", "hostapd", "iw"]
        }, function(error) {
            if (error) console.log("\nOne or more dependencies missing, attempting to install dependencies.");
            exec('sudo pacman -Sy --noconfirm --needed dhcp hostapd iw', next_step);
        });
    },

    // Check if wifi is enabled / connected
    function test_is_wifi_enabled(next_step) {
        wifi_manager.is_wifi_enabled(function(error, result_ip) {
            if (result_ip) {
                console.log("\nWifi is enabled, and IP " + result_ip + " assigned");
                process.exit(0);
            } else {
                console.log("\nWifi is not enabled, Enabling AP for self-configure");
            }
            next_step(error);
        });
    },

    // Turn system into an access point
    function enable_system_ap(next_step) {
        wifi_manager.enable_ap_mode(config.access_point.ssid, function(error) {
            if(error) {
                console.log("... AP Enable ERROR: " + error);
            } else {
                console.log("... AP Enable Success!");
            }
            next_step(error);
        });
    },

    // Host HTTP server while functioning as AP, the "api.js"
    //   file contains all the needed logic to get a basic express
    //   server up. It uses a small angular application which allows
    //   us to choose the wifi of our choosing.
    function start_http_server(next_step) {
        require("./app/api.js")(wifi_manager, next_step);
    }

], function(error) {
    if (error) {
        console.log("ERROR: " + error);
    }
});
