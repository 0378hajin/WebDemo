(function (window) {
    "use strict";

    const STORAGE_KEY = "medicodeMockData";
    const SELECTED_DISEASE_KEY = "medicodeSelectedDisease";

    function defaultState() {
        return {
            healthLoaded: false,
            geneLoaded: false,
            selectedPercent: 100,
            health: null,
            gene: null
        };
    }

    function getState() {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (!saved) return defaultState();

        try {
            return Object.assign(defaultState(), JSON.parse(saved));
        } catch (error) {
            console.error("MediCode 데모 상태 파싱 실패", error);
            return defaultState();
        }
    }

    function saveState(state) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        return state;
    }

    function loadJson(url) {
        return fetch(url, { cache: "no-store" }).then(function (response) {
            if (!response.ok) throw new Error("데이터 요청 실패: " + response.status);
            return response.json();
        });
    }

    function loadHealth() {
        return loadJson("data/health.json").then(function (health) {
            const state = getState();
            state.healthLoaded = true;
            state.health = health;
            state.selectedPercent = state.geneLoaded ? 50 : 100;
            return saveState(state);
        });
    }

    function loadGene() {
        return loadJson("data/gene-summary.json").then(function (gene) {
            const state = getState();
            state.geneLoaded = gene.loaded === true;
            state.gene = gene;
            state.selectedPercent = state.healthLoaded && state.geneLoaded ? 50 : 0;
            return saveState(state);
        });
    }

    function loadReport(percent) {
        const normalized = Math.max(0, Math.min(100, Number(percent) || 0));
        const index = Math.round(normalized / 10);
        return loadJson("data/report/" + index + ".json");
    }

    function selectDisease(item) {
        sessionStorage.setItem(SELECTED_DISEASE_KEY, JSON.stringify(item));
    }

    function getSelectedDisease() {
        const saved = sessionStorage.getItem(SELECTED_DISEASE_KEY);
        return saved ? JSON.parse(saved) : null;
    }

    window.MediCodeDemoStore = {
        getState: getState,
        saveState: saveState,
        loadHealth: loadHealth,
        loadGene: loadGene,
        loadReport: loadReport,
        selectDisease: selectDisease,
        getSelectedDisease: getSelectedDisease
    };
}(window));
