const apiUrl = "/Home/WebService.asmx/GetOpenData";

// 생년월일 형식 변환: YYMMDD, YYYYMMDD, YYYY-MM-DD 모두 받아 YYYY-MM-DD 반환
const toISO = (v) => {
    if (!v) return '';
    v = (''+v).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    if (/^\d{8}$/.test(v)) return v.slice(0,4) + '-' + v.slice(4,6) + '-' + v.slice(6,8);
    if (/^\d{6}$/.test(v)) {
        const yy = parseInt(v.slice(0,2),10);
        const mm = v.slice(2,4);
        const dd = v.slice(4,6);
        const curYY = (new Date()).getFullYear() % 100;
        const century = (yy > curYY ? 1900 : 2000);
        return (century + yy) + '-' + mm + '-' + dd;
    }
    return '';
};

document.addEventListener('DOMContentLoaded', function() {
    const app = new Vue({
    el: '#changeApp',
    data: {
        member_info: null,
        memberId: '',
        id: '',
        mode: '',
        confirmOpen: false,
        confirmMessage: '',
        confirmOnYes: null,
        confirmOnNo: null,
        answers: {
            invest_type_01: '',
            invest_type_02: '',
            invest_purpose: '',
            target_age: '',
            gp_apply_yn: '',
            update_days: ''
        },
        newAnswers: {
            invest_type_01: '',
            invest_type_02: '',
            invest_purpose: '',
            target_age: '',
            gp_apply_yn: '',
            update_days: ''
        },
        initialAnswers: {}
    },
    computed: {
        changedKeys() {
            const changed = [];
            const a = this.initialAnswers || {};
            const n = this.newAnswers || {};
            Object.keys(n).forEach(k => {
                if ((a[k] ?? '').toString() !== (n[k] ?? '').toString()) changed.push(k);
            });
            return changed;
        }
    },
    
        mounted() {
        const qs = new URLSearchParams(location.search);
        this.memberId = document.getElementById('hdnMemberId')?.value ?? '';
        this.id = qs.get('id') ?? '';
        this.mode = qs.get('mode') ?? '';

        // 기존 설정값은 API 응답만 신뢰 (DOM 초기값에 의존 X)
        this.checkHasContract(this.id).then(existing => {
            if (existing) {
                this.answers = {
                    invest_type_01: existing.invest_type_01 ?? existing.invest_type1 ?? existing.invest_type01 ?? '',
                    invest_type_02: existing.invest_type_02 ?? existing.invest_type2 ?? existing.invest_type02 ?? '',
                    invest_purpose: existing.invest_purpose ?? existing.purpose ?? '',
                    target_age: existing.target_age ?? existing.age ?? '',
                    gp_apply_yn: existing.gp_apply_yn ?? existing.gp_apply ?? '',
                    update_days: existing.update_days ?? ''
                };

                this.newAnswers = JSON.parse(JSON.stringify(this.answers));
                this.initialAnswers = JSON.parse(JSON.stringify(this.answers));
            } else {
                this.newAnswers = JSON.parse(JSON.stringify(this.answers));
                this.initialAnswers = JSON.parse(JSON.stringify(this.answers));
            }
        });
    },
    
    methods: {
        // 팝업 DOM 엘리먼트 직접 접근용 (메시지 텍스트, 버튼 핸들러 부착에 사용)
        getPopupElements() {
            const wrapper = document.querySelector('.popup_wrap');
            const messageP = wrapper && (wrapper.querySelector('.p_box.alert .innerBox p.l_title_b.tac') || wrapper.querySelector('.p_box.alert p'));
            const yesBtn = wrapper && wrapper.querySelector('.df_btn .btn4');
            const noBtn = wrapper && wrapper.querySelector('.df_btn .btn3');
            return { wrapper, messageP, yesBtn, noBtn };
        },

        // 확인 팝업: 사용자 선택을 Promise<boolean>으로 반환 (Yes=true, No=false)
        showConfirmPopup(messageHtml) {
            return new Promise(resolve => {
                this.confirmMessage = messageHtml || '';
                this.confirmOnYes = () => resolve(true);
                this.confirmOnNo = () => resolve(false);
                this.confirmOpen = true;

                this.$nextTick(() => {
                    const { wrapper, messageP, yesBtn, noBtn } = this.getPopupElements();
                    if (!wrapper) return;
                    if (messageP) messageP.innerHTML = this.confirmMessage;
                    wrapper.style.display = 'block';
                    wrapper.classList.add('on');

                    if (this._confirmYesHandler && yesBtn) yesBtn.removeEventListener('click', this._confirmYesHandler);
                    if (this._confirmNoHandler && noBtn) noBtn.removeEventListener('click', this._confirmNoHandler);

                    this._confirmYesHandler = () => {
                        wrapper.style.display = 'none';
                        wrapper.classList.remove('on');
                        this.confirmOpen = false;
                        const cb = this.confirmOnYes;
                        this.confirmOnYes = null;
                        this.confirmOnNo = null;
                        if (cb) cb();
                    };
                    this._confirmNoHandler = () => {
                        wrapper.style.display = 'none';
                        wrapper.classList.remove('on');
                        this.confirmOpen = false;
                        const cb = this.confirmOnNo;
                        this.confirmOnYes = null;
                        this.confirmOnNo = null;
                        if (cb) cb();
                    };

                    if (yesBtn) yesBtn.addEventListener('click', this._confirmYesHandler);
                    if (noBtn) noBtn.addEventListener('click', this._confirmNoHandler);

                    // 접근성: 첫 번째 액션 버튼에 포커스
                    const focusBtn = wrapper.querySelector('.p_box.alert .btn4');
                    if (focusBtn && typeof focusBtn.focus === 'function') focusBtn.focus();
                });
            });
        },
        async onProfileSave() {
            const changed = this.changedKeys;
            if (!changed || changed.length === 0) { alert('변경할 항목이 없습니다'); return; }
            const onlyUpdateDays = changed.length > 0 && changed.every(k => k === 'update_days');
            let message = '리밸런싱 주기를 변경하시겠어요?<br />변경 내용은 다음 리밸런싱부터 적용됩니다.';
            if (!onlyUpdateDays) message = '펀드 설정을 변경하시겠어요?<br />변경 내용은 다음 리밸런싱부터 적용됩니다.';
            const a = this.answers || {};
            const n = this.newAnswers || {};
            const pick = key => (n[key] !== undefined && n[key] !== null && (n[key] !== '')) ? n[key] : (a[key] ?? '');

            await this.getmemberInfo();

            if (!this.member_info || !this.member_info.member_birth) {
                const msg = '회원 정보를 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.';
                if (typeof VueAlert === 'function') VueAlert(msg); else alert(msg);
                return;
            }

            const targetRaw = pick('target_age');
            const target = (targetRaw === null || targetRaw === undefined || (''+targetRaw).toString().trim() === '') ? null : Number(targetRaw);

            // invest_purpose=1 또는 option1이면 은퇴(연금), 그 외는 목적자금
            const purposeVal = pick('invest_purpose');
            const isRetirement = (''+purposeVal).toString() === '1' || (''+purposeVal).toLowerCase().indexOf('option1') !== -1;

            // 생년월일은 서버 응답만 신뢰 (DOM 입력값 fallback 없음)
            const birthRaw = this.member_info.member_birth;
            const iso = toISO(birthRaw);
            let parsedBirth = null;
            if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) parsedBirth = new Date(iso);
            if (!parsedBirth || isNaN(parsedBirth)) {
                const msg = '시점을 확인해 주세요.';
                if (typeof VueAlert === 'function') VueAlert(msg); else alert(msg);
                return;
            }
            const now = new Date();
            // 보험나이 계산: `age`(만나이)를 기준으로 생일이 6개월 이상 지났으면 +1
            let age = now.getFullYear() - parsedBirth.getFullYear();
            if (now.getMonth() < parsedBirth.getMonth() || (now.getMonth() === parsedBirth.getMonth() && now.getDate() < parsedBirth.getDate())) age -= 1;
            let monthsSinceLastBirthday = now.getMonth() - parsedBirth.getMonth();
            if (now.getDate() < parsedBirth.getDate()) monthsSinceLastBirthday -= 1;
            if (monthsSinceLastBirthday < 0) monthsSinceLastBirthday += 12;
            const insuranceAge = (monthsSinceLastBirthday >= 6) ? (age + 1) : age;

            const rawYears = (target === null || insuranceAge === null) ? null : (parseInt(target,10) - parseInt(insuranceAge,10));
            if (rawYears === null || isNaN(rawYears)) {
                const msg = isRetirement ? '은퇴 시점을 확인해 주세요.' : '목적자금 사용 시점을 확인해 주세요.';
                if (typeof VueAlert === 'function') VueAlert(msg); else alert(msg);
                return;
            }
            // 시점 입력 범위: 보험나이 + 1세 이상 ~ 85세 이하
            if (rawYears <= 0 || target > 85) {
                const subject = isRetirement ? '은퇴 시점' : '목적자금 사용 시점';
                const minAge = insuranceAge + 1;
                const msg = subject + '은 ' + minAge + '세부터 85세까지 입력할 수 있습니다. 다시 입력해 주세요.';
                if (typeof VueAlert === 'function') VueAlert(msg); else alert(msg);
                return;
            }

            if (await this.showConfirmPopup(message)) {
                await this.saveConfigReserved();
            }
        },
        async onRebalancingSave() {
            const changed = this.changedKeys;
            if (!changed || changed.length === 0) { alert('변경할 항목이 없습니다'); return; }
            const includesUpdateDays = changed.includes('update_days');
            if (!includesUpdateDays) {
                const msg = '펀드 설정을 변경하시겠어요?<br />변경 내용은 다음 리밸런싱부터 적용됩니다.';
                if (await this.showConfirmPopup(msg)) await this.saveConfigReserved();
                return;
            }
            const msg = '리밸런싱 주기를 변경하시겠어요?<br />변경 내용은 다음 리밸런싱부터 적용됩니다.';
            if (await this.showConfirmPopup(msg)) await this.saveConfigReserved();
        },
        async saveConfigReserved() {
            const a = this.answers || {};
            const n = this.newAnswers || {};
            const pick = key => (n[key] !== undefined && n[key] !== null && (n[key] !== '')) ? n[key] : (a[key] ?? '');
            const payload = {
                member_id: this.memberId ?? '',
                id: this.id ?? '',
                invest_type_01: pick('invest_type_01'),
                invest_type_02: pick('invest_type_02'),
                invest_purpose: pick('invest_purpose'),
                target_age: pick('target_age'),
                gp_apply_yn: pick('gp_apply_yn'),
                update_days: pick('update_days')
            };
            const paramsObj = Object.assign({ target: 'VFANew', cmd: 'VFAConfigReservedSave' }, payload);
            const params = JSON.stringify(paramsObj);
            const resp = await httpPost(apiUrl, params);
                if (resp && resp.result == 1) {
                alert('저장되었습니다');
                if (typeof window.prevStep === 'function') {
                    window.prevStep();
                } else {
                    location.href = 'Main.html?id=' + encodeURIComponent(this.id || '');
                }
                return resp;
            }
            alert((resp && resp.msg) ? resp.msg : '저장에 실패했습니다. 다시 시도해 주세요.');
            return resp;
        },
        async getmemberInfo() {
            const memberId = this.memberId || '';
            const paramsObj = { target: 'VFANew', cmd: 'MemberInfoIM' };
            if (memberId) paramsObj.member_id = memberId;
            const resp = await httpPost(apiUrl, JSON.stringify(paramsObj));
            if (resp && resp.result == 1 && Array.isArray(resp.items) && resp.items.length > 0) {
                this.member_info = resp.items[0];
            }
            return this.member_info;
        },
        // 기존 설정값 조회: 매칭 row 1건 또는 null 반환
        async checkHasContract(idParam) {
            const member_id = this.memberId || '';
            const idVal = ('' + (idParam || '')).trim();
            if (!member_id || !idVal) return null;
            const paramsObj = { target: 'VFANew', cmd: 'VFAConfigReserved', member_id: member_id, id: idVal };
            try {
                const resp = await httpPost(apiUrl, JSON.stringify(paramsObj));
                if (resp && resp.result == 1 && Array.isArray(resp.items) && resp.items.length > 0) return resp.items[0];
            } catch (ex) {
                console.error('checkHasContract error', ex);
            }
            return null;
        }
    }
    });

    window.vm = app;
});

// 헤더 뒤로가기 버튼: history 있으면 뒤로, 없으면 Main2로 id 유지하며 이동
window.prevStep = function() {
    if (history.length > 1) {
        history.back();
        return;
    }
    const idParam = encodeURIComponent(window.vm?.id || '');
    location.href = 'Main.html?id=' + idParam;
};
