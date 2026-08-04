(function () {
    "use strict";

    new Vue({
        el: "#divVue",
        data: { section: 1 },
        methods: {
            showSection: function (section) { this.section = section; },
            startDemo: function () { location.href = "Main_New.html"; },
            goBack: function () {
                if (this.section === 2) this.section = 1;
                else history.back();
            }
        }
    });
}());
