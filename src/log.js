
'use strict';

(() => {

    const Logger = (prefix) => {
        return (...args) => {
            console.log(prefix, ...args);
        };
    };

    module.exports = Logger;

})();
