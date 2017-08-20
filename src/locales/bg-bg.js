// bootbox.js locale configuration
// locale : Bulgarian
// author : ---

(function (global, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['../bootbox'], factory);
    } else if (typeof module === 'object' && module.exports) {
        factory(require('../bootbox'));
    } else {
        factory(global.bootbox);
    }
}(this, function (bootbox) {
    bootbox.addLocale('bg-bg', {
        OK      : 'Ок',
        CANCEL  : 'Отказ',
        CONFIRM : 'Потвърждавам'
    });
}));