(function () {
    "use strict";

    new Vue({
        el: "#divVue",
        data: {
            healthLoaded: false,
            geneLoaded: false,
            healthDate: "",
            geneDate: "",
            geneLoading: false,
            errorMessage: ""
        },
        created: function () {
            this.applyState(MediCodeDemoStore.getState());
        },
        methods: {
            applyState: function (state) {
                this.healthLoaded = state.healthLoaded;
                this.geneLoaded = state.geneLoaded;
                this.healthDate = state.healthLoaded ? "2024-12-06" : "";
                this.geneDate = state.gene && state.gene.loadedAt ? state.gene.loadedAt : "";
            },
            goToHealth: function () {
                if (!this.healthLoaded) location.href = "Health1.html";
            },
            loadGene: function () {
                if (this.geneLoaded || this.geneLoading) return;

                const self = this;
                self.geneLoading = true;
                self.errorMessage = "";

                MediCodeDemoStore.loadGene()
                    .then(function (state) { self.applyState(state); })
                    .catch(function (error) {
                        console.error(error);
                        self.errorMessage = "유전자 데이터를 불러오지 못했습니다.";
                    })
                    .finally(function () { self.geneLoading = false; });
            },
            openReport: function () {
                if (!this.healthLoaded && !this.geneLoaded) return;

                const state = MediCodeDemoStore.getState();
                state.selectedPercent = state.healthLoaded && state.geneLoaded ? 50 : (state.healthLoaded ? 100 : 0);
                MediCodeDemoStore.saveState(state);
                location.href = "Report.html";
            }
        }
    });
}());
