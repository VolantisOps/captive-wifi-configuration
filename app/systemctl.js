var exec    = require("child_process").exec;

/*****************************************************************************\
    Enable or disable services with systemctl
\*****************************************************************************/
module.exports = function() {

    _enable = function(service_name, callback) {
        exec("systemctl enable " + service_name, function(error, stdout, stderr) {
            if (error) return callback(error);
            return callback(null)
        });
    };

    _disable = function(service_name, callback) {
        exec("systemctl disable " + service_name, function(error, stdout, stderr) {
            if (error) return callback(error);
            return callback(null)
        });
    };

    _restart = function (service_name, callback) {
        exec("systemctl restart " + service_name, function(error, stdout, stderr) {
            if (error) return callback(error);
            return callback(null);
        })
    };

    return {
        enable: _enable,
        disable: _disable,
        restart: _restart
    };
}
