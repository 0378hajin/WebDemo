(function () {
    "use strict";

    window.completeHealthAnalysis = function (event) {
        event.preventDefault();

        MediCodeDemoStore.loadHealth()
            .then(function () { location.href = "Main_New.html"; })
            .catch(function (error) {
                console.error(error);
                alert("건강검진 데이터를 불러오지 못했습니다.");
            });
    };
}());
