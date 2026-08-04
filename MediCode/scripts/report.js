(function () {
    "use strict";

    new Vue({
        el: "#divVue",
        data: {
            memberName: "샘플 사용자",
            healthLoaded: false,
            geneLoaded: false,
            percent: 100,
            totalScoreList: [],
            activeRisk: "",
            loading: false,
            errorMessage: ""
        },
        created: function () {
            const state = MediCodeDemoStore.getState();
            this.healthLoaded = state.healthLoaded;
            this.geneLoaded = state.geneLoaded;
            this.percent = this.getInitialPercent(state);
            this.loadScore();
        },
        methods: {
            getInitialPercent: function (state) {
                if (state.healthLoaded && state.geneLoaded) return 50;
                if (state.healthLoaded) return 100;
                if (state.geneLoaded) return 0;
                return 100;
            },
            onPercentInput: function () {
                const state = MediCodeDemoStore.getState();
                state.selectedPercent = Number(this.percent);
                MediCodeDemoStore.saveState(state);
                this.loadScore();
            },
            loadScore: function () {
                const self = this;
                self.loading = true;
                self.errorMessage = "";

                MediCodeDemoStore.loadReport(self.percent)
                    .then(function (items) {
                        self.totalScoreList = items.filter(function (item) {
                            return item.disease_name && item.disease_name.trim() !== "";
                        });
                    })
                    .catch(function (error) {
                        console.error(error);
                        self.errorMessage = "분석 결과를 불러오지 못했습니다.";
                        self.totalScoreList = [];
                    })
                    .finally(function () { self.loading = false; });
            },
            byRisk: function (risk) {
                return this.totalScoreList
                    .filter(function (item) { return item.total_risk_name === risk; })
                    .sort(function (a, b) { return Number(b.total_score) - Number(a.total_score); });
            },
            toggleRisk: function (risk) {
                this.activeRisk = this.activeRisk === risk ? "" : risk;
            },
            openDetail: function (item) {
                MediCodeDemoStore.selectDisease(item);
                const query = new URLSearchParams({ disease: item.disease_name, percent: this.percent });
                location.href = "Report_Detail.html?" + query.toString();
            },
            goBack: function () {
                location.href = "Main_New.html";
            }
        },
        computed: {
            canMoveSlider: function () {
                return this.healthLoaded && this.geneLoaded;
            },
            guideText: function () {
                if (this.canMoveSlider) return "슬라이더를 움직여 건강검진과 유전자 데이터의 반영 비율을 조정할 수 있습니다.";
                if (this.healthLoaded) return "건강검진 데이터만 있어 건강검진 100%로 고정됩니다.";
                return "유전자 데이터만 있어 유전자 100%로 고정됩니다.";
            },
            serious: function () { return this.byRisk("심각"); },
            danger: function () { return this.byRisk("위험"); },
            caution: function () { return this.byRisk("주의"); },
            good: function () { return this.byRisk("양호"); }
        }
    });
}());
