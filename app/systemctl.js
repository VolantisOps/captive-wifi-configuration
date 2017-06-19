var exec    = require("child_process").exec;

/*****************************************************************************\
    Enable or disable services with systemctl
\*****************************************************************************/
module.exports = function() {

    _enable = function (service_name, callback) {
        exec("sudo systemctl enable " + service_name, function(error, stdout, stderr) {
            if (error) return callback(error);
            return callback(null)
        });
    };

    _disable = function (service_name, callback) {
        exec("sudo systemctl disable " + service_name, function(error, stdout, stderr) {
            if (error) return callback(error);
            return callback(null)
        });
    };

    _restart = function (service_name, callback) {
        exec("sudo systemctl restart " + service_name, function(error, stdout, stderr) {
            if (error) return callback(error);
            return callback(null);
        })
    };

    _daemon_reload = function (callback) {
        exec("sudo systemctl daemon-reload", callback);
    }

    return {
        enable:        _enable,
        disable:       _disable,
        restart:       _restart,
        daemon_reload: _daemon_reload
    };
}
