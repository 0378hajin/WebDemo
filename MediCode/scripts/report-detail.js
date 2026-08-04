(function () {
    "use strict";

    new Vue({
        el: "#divVue",
        data: {
            item: null,
            percent: 100,
            healthScore: null,
            geneScore: null,
            errorMessage: ""
        },
        created: function () {
            const query = new URLSearchParams(location.search);
            const percentValue = query.get("percent");
            this.percent = percentValue === null ? 100 : Number(percentValue);
            this.item = MediCodeDemoStore.getSelectedDisease();
            this.loadSourceScores();
        },
        methods: {
            loadSourceScores: function () {
                const self = this;
                if (!self.item) {
                    self.errorMessage = "선택한 질병 정보가 없습니다.";
                    return;
                }

                Promise.all([MediCodeDemoStore.loadReport(100), MediCodeDemoStore.loadReport(0)])
                    .then(function (results) {
                        const name = self.item.disease_name;
                        self.healthScore = results[0].find(function (row) { return row.disease_name === name; }) || null;
                        self.geneScore = results[1].find(function (row) { return row.disease_name === name; }) || null;
                    })
                    .catch(function (error) {
                        console.error(error);
                        self.errorMessage = "상세 데이터를 불러오지 못했습니다.";
                    });
            },
            goBack: function () { history.back(); }
        }
    });
}());
