(function(){
    if (typeof Vue === 'undefined') return;

    let urlReturnJsonAPI = "/Home/WebService.asmx/GetOpenData";

    // 생년월일 변환: UI는 YYMMDD, 서버는 YYYY-MM-DD 사용
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

    const toYYMMDD = (v) => {
        if (!v) return '';
        v = (''+v).trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v.slice(2).replace(/-/g,'');
        if (/^\d{8}$/.test(v)) return v.slice(2);
        if (/^\d{6}$/.test(v)) return v;
        return '';
    };

    const STEP5_AGE_MAP = {
        option1: 60, option4: 60,
        option2: 65, option5: 65,
        option3: 70, option6: 70
    };

    const mapStep5OptionToAge = (opt, custom) => {
        // 사용자가 직접 입력한 값(custom)이 옵션 기반 값보다 우선
        if (custom && !isNaN(parseInt(custom,10))) return parseInt(custom,10);
        if (!opt) return null;
        if (STEP5_AGE_MAP.hasOwnProperty(opt)) return STEP5_AGE_MAP[opt];
        // 이전 데이터 형식 호환: 옵션명 안의 숫자 토큰으로 fallback
        const sOpt = (opt == null) ? '' : ('' + opt);
        if (sOpt.indexOf('1') !== -1) return 60;
        if (sOpt.indexOf('2') !== -1) return 65;
        if (sOpt.indexOf('3') !== -1) return 70;
        return null;
    };

    var vm = new Vue({
        el: '#divVFA',
        data: {
            member_info: null,
            contractList: [],
            contractsLoaded: false,
            loading: true,
            step: 0,
            hasQueryMember: false,

            memberId: '',
            idParam: '',
            sCodeParam: '',
            answers: {
                step1: 'option1',
                cus_birth: '',
                step2: 'option1',
                step3: 'option1',
                step4: 'option1',
                step5: 'option2',
                step5_custom: null,
                step6: 'option1',
                step7: 'option1'
            },
            popup: {
                glideInfo: false,
                alert: false
            },
            hasFullQueryParams: false
        },
        computed: {
            showSetup() {
                return !!(this.idParam);
            },
            memberName() {
                if (!this.member_info) return '';
                return this.member_info.member_name || '';
            },
            hasMemberId() {
                return !!(this.memberId);
            },

            memberHasBirth() {
                if (!this.member_info || !this.member_info.member_birth) return false;
                const f = this.formatBirthToYYMMDD(this.member_info.member_birth);
                return !!(f && f.length === 6);
            },
            memberHasGender() {
                return !!(this.member_info && (this.member_info.member_gender === 'M' || this.member_info.member_gender === 'F'));
            },
            needsBirthInput() {
                return !this.memberHasBirth;
            },
            parsedBirthDate() {
                const server = (this.member_info && this.member_info.member_birth) ? toISO(this.member_info.member_birth) : '';
                if (server && /^\d{4}-\d{2}-\d{2}$/.test(server)) {
                    const d = new Date(server);
                    if (!isNaN(d)) return d;
                }
                const b = this.answers.cus_birth ? (''+this.answers.cus_birth).trim() : '';
                if (/^\d{6}$/.test(b)) {
                    const iso = toISO(b);
                    const d = new Date(iso);
                    if (!isNaN(d)) return d;
                }
                return null;
            },
            birthValid() {
                return !!this.parsedBirthDate;
            },
            insuranceAge() {
                const bd = this.parsedBirthDate;
                if (!bd) return null;
                const now = new Date();
                let age = now.getFullYear() - bd.getFullYear();
                if (now.getMonth() < bd.getMonth() || (now.getMonth() === bd.getMonth() && now.getDate() < bd.getDate())) age -= 1;
                let monthsSinceLastBirthday = now.getMonth() - bd.getMonth();
                if (now.getDate() < bd.getDate()) monthsSinceLastBirthday -= 1;
                if (monthsSinceLastBirthday < 0) monthsSinceLastBirthday += 12;
                if (monthsSinceLastBirthday >= 6) return age + 1;
                return age;
            },
            insuranceAgeLabel() {
                const a = this.insuranceAge;
                return (a === null || a === undefined) ? '' : (a + '세');
            },

            // 서버 member_gender 우선, 없으면 사용자 입력(answers.step1) fallback
            genderLabel() {
                if (this.member_info && this.member_info.member_gender) {
                    const g = (''+this.member_info.member_gender).toString();
                    if (g === 'M') return '남성';
                    if (g === 'F') return '여성';
                }
                if (this.answers.step1) {
                    return (this.answers.step1 === 'option1') ? '남성' : '여성';
                }
                return '';
            },

            investmentProfileLabel() {
                const mapOpt = (opt) => {
                    if (!opt) return 0;
                    if (opt === 'option1') return 0;
                    if (opt === 'option2') return 1;
                    if (opt === 'option3') return 2;
                    return 0;
                };
                const s2 = mapOpt(this.answers.step2);
                const s3 = mapOpt(this.answers.step3);
                const total = (Number.isFinite(s2) ? s2 : 0) + (Number.isFinite(s3) ? s3 : 0);
                if (total >= 0 && total <= 2) return '보수적 투자자';
                return '적극적 투자자';
            },
            shouldApplyGlide() {
                const profile = (this.investmentProfileLabel || '').toString();
                if (profile === '보수적 투자자') return true;
                if (profile === '적극적 투자자') {
                    const yrs = this.retirementRemainingYears;
                    if (yrs === null || yrs === undefined) return false;
                    return (Number(yrs) <= 10);
                }
                return false;
            },
            recommendationLabel() {
                if (this.answers.step6) {
                    if (this.answers.step6 === 'option1') return '자동 배분 조절형 추천';
                    if (this.answers.step6 === 'option2') return '고정 배분 운용형 추천';
                }
                return this.shouldApplyGlide ? '자동 배분 조절형 추천' : '고정 배분 운용형 추천';
            },
            investmentMethodDetail() {
                const sel = this.answers.step4 ? this.answers.step4 : 'option1';
                if (sel === 'option2') {
                    return '목적자금 사용까지 남은 기간과 고객 성향을 반영해 자산 비중을 자동으로 조절합니다.';
                }
                return '은퇴까지 남은 기간과 고객 성향을 반영해 자산 비중을 자동으로 조절합니다.';
            },

            selectedTargetAge() {
                const opt = this.answers.step5;
                const custom = this.answers.step5_custom;
                return mapStep5OptionToAge(opt, custom);
            },
            retirementRemainingYears() {
                const target = this.selectedTargetAge;
                const cur = this.insuranceAge;
                if (target === null || cur === null) return null;
                const years = parseInt(target,10) - parseInt(cur,10);
                return isNaN(years) ? null : (years < 0 ? 0 : years);
            },
            retirementRemainingLabel() {
                const y = this.retirementRemainingYears;
                if (y === null || y === undefined) return '';
                if (Number(y) <= 0) return '1년 미만';
                return (y + '년');
            },
            remainingPeriodTitle() {
                const purpose = this.answers.step4 ? this.answers.step4 : null;
                if (purpose) {
                    return (purpose === 'option1') ? '은퇴까지 남은 기간' : '목적자금 사용까지 남은 기간';
                }
                return (this.step === 5) ? '은퇴까지 남은 기간' : '목적자금 사용까지 남은 기간';
            },

            corpName() {
                const c0 = (this.contractList && this.contractList[0]) ? this.contractList[0] : null;
                return (c0 && c0.corp_name) ? c0.corp_name : '';
            },
            itemName() {
                const c0 = (this.contractList && this.contractList[0]) ? this.contractList[0] : null;
                return (c0 && c0.item_name) ? c0.item_name : '';
            },
            contractDate() {
                return (this.contractList && this.contractList[0] && this.contractList[0].contract_date) ? this.contractList[0].contract_date : '';
            }
        },
        watch: {
            // 은퇴(5) / 목적자금(6) 단계 진입 시 기본값 정렬
            step: function(newVal, oldVal) {
                if (newVal === 5) {
                    this.normalizeStep5('option2');
                } else if (newVal === 6) {
                    this.normalizeStep5('option5', ['option4','option5','option6']);
                }
            }
            // 라디오 옵션 선택 시 커스텀 입력값 초기화 (옵션 우선)
            , 'answers.step5': function(newVal, oldVal) {
                if (newVal && newVal !== oldVal) {
                    this.answers.step5_custom = null;
                }
            }
        },
        mounted: function () {
            this.init();
        },
        methods: {
            async init() {
                const qs = new URLSearchParams(location.search);

                const rawQMemberId = qs.get('member_id');
                const rawQId = qs.get('id');
                const rawQSCode = qs.get('sCode');

                const normalizeQ = (s) => {
                    if (!s || typeof s !== 'string') return '';
                    const t = s.trim().toLowerCase();
                    if (t === 'null' || t === 'undefined') return '';
                    return s;
                };

                const qMemberId = normalizeQ(rawQMemberId);

                const qId = normalizeQ(rawQId);
                const qSCode = normalizeQ(rawQSCode);

                // 세션 검증된 서버 주입값만 신뢰 (쿼리스트링 member_id는 보안상 신뢰 불가)
                const serverMember = document.getElementById('hdnMemberId')?.value ?? '';

                this.idParam = qId || '';
                this.sCodeParam = qSCode || '';
                // member_id는 hidden input으로 받고, 진입 게이트는 id 파라미터로만 판단
                this.hasFullQueryParams = !!(qId);

                this.memberId = serverMember || '';

                if (!this.memberId) {
                    if (this.hasFullQueryParams) {
                        // 쿼리에 id는 있는데 세션 검증된 member_id가 없음 → 로그인 유도
                        if (typeof VueAlert === 'function') VueAlert('권한이 없습니다. 로그인 후 이용해 주세요.'); else alert('권한이 없습니다. 로그인 후 이용해 주세요.');
                    } else {
                        if (typeof VueAlert === 'function') VueAlert('잘못된 접근입니다.'); else alert('잘못된 접근입니다.');
                    }
                    this.loading = false;
                    return;
                }

                try {
                    await this.getmemberInfo();
                    await this.getContractList();
                } catch (e) {
                    console.error('초기화 실패:', e);
                    this.contractList = [];
                    this.contractsLoaded = true;
                    this.loading = false;
                }
            },

            async getmemberInfo() {

                const memberId = this.memberId || '';

                let paramsObj = { target: "VFANew", cmd: "MemberInfoIM" };
                if (memberId && memberId !== '') {
                    paramsObj.member_id = memberId;
                }

                var params = JSON.stringify(paramsObj);

                return httpPost(urlReturnJsonAPI, params)
                    .then((json) => {
                        if (json && json.result == 1 && json.items && json.items.length > 0) {
                            this.member_info = json.items[0];

                            if (this.member_info) {
                                if (this.member_info.member_birth && (!this.answers.cus_birth || this.answers.cus_birth === '')) {
                                    this.answers.cus_birth = this.formatBirthToYYMMDD(this.member_info.member_birth);
                                }
                                if (this.member_info.member_gender) {
                                    const g = (''+this.member_info.member_gender).toString();
                                    if (g === '2') this.answers.step1 = 'option2';
                                    else if (g === '1') this.answers.step1 = 'option1';
                                }
                            }
                            // 서버 응답 기준으로 memberId 동기화
                            this.memberId = this.member_info.member_id;
                        } else {
                            console.warn('[VFA] getmemberInfo -> no member items returned');
                        }
                        return json;
                    })
                    .catch((error) => {
                        console.error('[VFA] getmemberInfo error:', error);
                    });
            },

            
            async getContractList() {
                    const member_id = this.memberId || '';

                    if (!member_id) {
                        this.contractList = [];
                        this.contractsLoaded = true;
                        this.loading = false;
                        return null;
                    }

                    // sCode(item_code)가 동반된 진입은 t_vfa_member_contract에서 단건 조회
                    if (this.sCodeParam) {
                        return this.getContractListByCode();
                    }

                    const paramsObj = { target: "ONENew", cmd: "GetPFListView", member_id: member_id, p_id: (this.idParam || ''), id: (this.idParam || '') };
                    const params = JSON.stringify(paramsObj);
                    
                    return httpPost(urlReturnJsonAPI, params)
                        .then(async (json) => {
                            
                                if (json && json.result == 1 && Array.isArray(json.items)) {
                                    // UI 바인딩 안정화를 위한 응답 정규화
                                    this.contractList = (json.items || []).map(i => {
                                        const it = Object.assign({}, i || {});
                                        it.account_number = it.account_number || '';
                                        it.item_name = it.item_name || '';
                                        it.corp_name = it.corp_name || '';
                                        it.ifa_item_code = it.ifa_item_code || '';
                                        // 일부 응답은 id 대신 contract_pk를 사용 → fallback
                                        it.id = (it.id !== undefined && it.id !== null && it.id !== '') ? it.id : (it.contract_pk !== undefined ? it.contract_pk : '');
                                        return it;
                                    });
                                    // 중복 검사: usp_vfa_has_contract의 @p_id는 t_contract_search.id 기대
                                    const checkId = this.idParam || (this.contractList && this.contractList[0] && this.contractList[0].id) || '';
                                    const existing = await this.checkHasContract(checkId);
                                    if (existing) {
                                        const msg = '이미 신청된 펀드입니다. 펀드 설정 변경을 진행해주세요.';
                                        if (typeof VueAlert === 'function') VueAlert(msg); else alert(msg);
                                        const params = new URLSearchParams();
                                        const redirectId = this.idParam || (this.contractList && this.contractList[0] && this.contractList[0].id) || '';
                                        if (redirectId) params.set('id', redirectId);
                                        window.location.href = 'Main.html' + (params.toString() ? ('?' + params.toString()) : '');
                                        return json;
                                        }
                                } else {
                                    this.contractList = [];
                                    const noMsg = '"펀드추천 서비스 요청하기"를 진행해주세요';
                                    if (typeof VueAlert === 'function') VueAlert(noMsg); else alert(noMsg);
                                }
                                return json;
                            })
                        .catch((error) => {
                            this.contractList = [];
                            throw error;
                        })
                        .finally(() => { this.contractsLoaded = true; this.loading = false; });

            },
            // sCode(item_code) 동반 진입 시 t_vfa_member_contract 단건 조회 (member_id + id + item_code)
            async getContractListByCode() {
                const member_id = this.memberId || '';
                const idVal = ('' + (this.idParam || '')).trim();
                const itemCode = ('' + (this.sCodeParam || '')).trim();

                const paramsObj = { target: 'VFANew', cmd: 'MemberContractByCode', member_id: member_id, id: idVal, item_code: itemCode };
                const params = JSON.stringify(paramsObj);

                return httpPost(urlReturnJsonAPI, params)
                    .then(async (json) => {
                        if (json && json.result == 1 && Array.isArray(json.items) && json.items.length > 0) {
                            const first = json.items[0] || {};
                            // 외부 펀드 중복 검사: t_vfa_member_contract.service_yn = 1 이면 이미 신청 완료
                            const svc = ('' + (first.service_yn || '')).trim();
                            if (svc === '1') {
                                const msg = '이미 신청된 펀드입니다. 펀드 설정 변경을 진행해주세요.';
                                if (typeof VueAlert === 'function') VueAlert(msg); else alert(msg);
                                const params2 = new URLSearchParams();
                                const redirectId = this.idParam || first.id || '';
                                if (redirectId) params2.set('id', redirectId);
                                window.location.href = 'Main.html' + (params2.toString() ? ('?' + params2.toString()) : '');
                                return json;
                            }

                            this.contractList = json.items.map(i => {
                                const it = Object.assign({}, i || {});
                                // 외부 펀드(t_vfa_member_contract): 내부 증번 없음 → account_number 빈 값
                                it.account_number = '';
                                it.item_name = it.item_name || '';
                                it.corp_name = it.corp_name || '';
                                it.ifa_item_code = it.ifa_item_code || '';
                                it.id = (it.id !== undefined && it.id !== null && it.id !== '') ? it.id : (it.contract_pk !== undefined ? it.contract_pk : '');
                                return it;
                            });
                        } else {
                            this.contractList = [];
                            const noMsg = '"펀드추천 서비스 요청하기"를 진행해주세요';
                            if (typeof VueAlert === 'function') VueAlert(noMsg); else alert(noMsg);
                        }
                        return json;
                    })
                    .catch((error) => {
                        this.contractList = [];
                        throw error;
                    })
                    .finally(() => { this.contractsLoaded = true; this.loading = false; });
            },
            // 내부 펀드 중복 검사: t_contract_search.id 기준, 매칭 row 1건 또는 null 반환
            async checkHasContract(idParam) {
                const member_id = this.memberId || '';
                const idVal = ('' + (idParam || '')).trim();
                if (!member_id || !idVal) return null;
                const paramsObj = { target: 'VFANew', cmd: 'HasVFAContract', member_id: member_id, id: idVal };

                const resp = await httpPost(urlReturnJsonAPI, JSON.stringify(paramsObj));
                if (resp && resp.result == 1 && Array.isArray(resp.items) && resp.items.length > 0) return resp.items[0];

                return null;
            },
            nextStep() {

                if (this.loading && this.step !== 0) {
                    return;
                }

                // step5(은퇴) / step6(목적자금)에서 남은 기간 검증, 진행 차단 시 step별 메시지 분기
                if (this.step === 5 || this.step === 6) {
                    const target = this.selectedTargetAge;
                    const cur = this.insuranceAge;
                    const rawYears = (target === null || cur === null) ? null : (parseInt(target, 10) - parseInt(cur, 10));
                    if (rawYears === null || isNaN(rawYears)) {
                        const msg = (this.step === 5) ? '은퇴 시점을 확인해 주세요.' : '목적자금 사용 시점을 확인해 주세요.';
                        if (typeof VueAlert === 'function') VueAlert(msg); else alert(msg);
                        try { this.answers.step5_custom = null; } catch (e) { console.error(e); }
                        return;
                    }
                    // 시점 입력 범위: 보험나이 + 1세 이상 ~ 85세 이하
                    if (rawYears <= 0 || target > 85) {
                        const subject = (this.step === 5) ? '은퇴 시점' : '목적자금 사용 시점';
                        const minAge = cur + 1;
                        const msg = subject + '은 ' + minAge + '세부터 85세까지 입력할 수 있습니다. 다시 입력해 주세요.';
                        if (typeof VueAlert === 'function') VueAlert(msg); else alert(msg);
                        try { this.answers.step5_custom = null; } catch (e) { console.error(e); }
                        return;
                    }
                }

                // step4(가입 목적) → 노후(option1)면 step5(은퇴시점), 그 외 step6(목적자금). step5/6 다음은 step7로 점프
                let next;
                if (this.step === 4) {
                    next = (this.answers.step4 === 'option1') ? 5 : 6;
                } else if (this.step === 5 || this.step === 6) {
                    next = 7;
                } else {
                    next = Math.min(this.step + 1, 9);
                }

                if (next === 9) {
                    this.loading = true;
                    this.submitContract().finally(() => { this.step = next; });
                } else {
                    // 서버가 생년월일+성별을 모두 보내준 경우 step1 숨김 → 다음 단계로 점프
                    if (next === 1 && this.memberHasBirth && this.memberHasGender) {
                        next = 2;
                    }
                    if (next === 6) {
                        this.normalizeStep5('option5', ['option4','option5','option6']);
                    }
                    if (next === 5) {
                        this.normalizeStep5('option2');
                    }
                    if (next === 7) {
                        // 운용 방식 기본값: 투자 성향에 따라 글라이드패스 적용 여부 결정
                        this.answers.step6 = this.shouldApplyGlide ? 'option1' : 'option2';
                    }
                    this.step = next;
                }
            },
            // 초기 비동기 로딩이 끝난 뒤에만 진행 (로딩 중이면 한 번만 watch)
            startIfReady() {
                if (this.contractsLoaded) {
                    this.nextStep();
                    return;
                }

                const unwatch = this.$watch('contractsLoaded', (val) => {
                    if (val) {
                        unwatch();
                        this.nextStep();
                    }
                });
            },
            nextStepClick() {
                if (this.step === 1) {
                    const genderVal = this.answers.step1 ? (''+this.answers.step1).trim() : '';
                    const birthVal = this.answers.cus_birth ? (''+this.answers.cus_birth).trim() : '';
                    const birthOk = (/^\d{6}$/.test(birthVal) || /^\d{8}$/.test(birthVal));
                    if (!genderVal || !birthVal || !birthOk) {
                        const msg = '성별 또는 생년월일 정보가 없습니다';
                                                if (typeof VueAlert === 'function') VueAlert(msg); else alert(msg);
                        const input = document.querySelector('input[placeholder*="생년월일"]');
                        if (input && typeof input.focus === 'function') input.focus();
                        return;
                    }
                }
                // 상품 정보 단계(4)에서 선택된 상품 없으면 진행 차단
                if (this.step === 4) {
                    const hasList = Array.isArray(this.contractList) && this.contractList.length > 0;
                    const hasInfo = !!(this.contractList && this.contractList[0]);
                    if (!hasList && !hasInfo) {
                        alert('상품 정보가 없습니다.');
                        return;
                    }
                }
                this.nextStep();
            },
            prevStep() {
                // step4 → step5/6 분기를 거꾸로 따라가야 함. step5/6에서 뒤로가면 커스텀 입력값 초기화
                if (this.step === 5 || this.step === 6) {
                    this.answers.step5_custom = null;
                }
                if (this.step === 6) {
                    if (this.answers.step4 !== 'option1') {
                        this.step = 4;
                        return;
                    }
                }
                if (this.step === 7) {
                    if (this.answers.step4 === 'option1') {
                        this.step = 5;
                    } else {
                        this.step = 6;
                    }
                    return;
                }
                let prev = this.step - 1;
                if (prev === 1 && this.memberHasBirth && this.memberHasGender) prev = 0;
                if (prev < 0) prev = 0;
                this.step = prev;
            },
            goStep(n) {
                this.step = n;
            },
            formatBirthToYYMMDD(val) {
                return toYYMMDD(val || '');
            },
            showGlidePopup() {
                this.popup.glideInfo = true;
                document.body.classList.add('vfa-popup-open');
                this.$nextTick(() => {
                    document.querySelectorAll('.popup_wrap').forEach(w => {
                        if (w.querySelector('.titBox')) w.classList.add('on');
                    });
                });
            },
            closeGlidePopup() {
                this.popup.glideInfo = false;
                document.body.classList.remove('vfa-popup-open');
                document.querySelectorAll('.popup_wrap').forEach(w => {
                    if (w.querySelector('.titBox')) w.classList.remove('on');
                });
            },
            closeAndReturn() {
                history.go(-1);
            },
            showAlertPopup() {
                this.popup.alert = true;
            },
            // purposeOpts: [option4, option5, option6] 형식, 전달되면 목적자금(step6) 모드로 동작
            normalizeStep5(defaultOpt, purposeOpts) {
                if (this.answers.step5_custom) return;

                let cur = this.answers.step5;
                if (!cur || typeof cur !== 'string') {
                    this.answers.step5 = defaultOpt;
                    return;
                }

                const isPurposeStep = Array.isArray(purposeOpts) && purposeOpts.length > 0;
                const m = cur.match(/^option([1-6])$/);
                const num = m ? Number(m[1]) : NaN;

                if (!isNaN(num)) {
                    if (isPurposeStep && num >= 1 && num <= 3) {
                        cur = 'option' + (num + 3);
                    } else if (!isPurposeStep && num >= 4 && num <= 6) {
                        cur = 'option' + (num - 3);
                    }
                    this.answers.step5 = cur;
                }

                if (isPurposeStep) {
                    if (!purposeOpts.includes(this.answers.step5)) {
                        this.answers.step5 = defaultOpt;
                    }
                    return;
                }

                if (!STEP5_AGE_MAP.hasOwnProperty(this.answers.step5)) {
                    this.answers.step5 = defaultOpt;
                }
            },
            async finishAndShowAlert(e) {
                if (e && typeof e.preventDefault === 'function') { e.preventDefault(); e.stopPropagation(); }

                try {
                    this.loading = true;
                    this.step = 9;

                    await this.updateMemberInfo().catch(() => {});

                    let submitResp = null;
                    submitResp = await this.submitContract();

                    // 저장 직후 백엔드 상태 반영을 위한 짧은 대기
                    await new Promise(r => setTimeout(r, 1500));

                    if (!submitResp || submitResp.result != 1) {
                        const serverMsg = (submitResp && submitResp.msg) ? submitResp.msg : '저장에 실패했습니다. 다시 시도해 주세요.';
                        if (typeof VueAlert === 'function') VueAlert(serverMsg); else alert(serverMsg);
                        this.loading = false;
                        this.step = 8;
                        return;
                    }

                    this.popup.alert = true;
                    this.$nextTick(() => {
                        document.querySelectorAll('.popup_wrap').forEach(wrap => {
                            if (wrap.querySelector('.p_box.alert')) {
                                wrap.classList.add('on');
                                var btn = wrap.querySelector('.p_box.alert .btn4');
                                if (btn && typeof btn.focus === 'function') btn.focus();
                            }
                        });
                    });
                } catch (e) {
                    alert('저장 중 오류가 발생했습니다. 다시 시도해 주세요.');
                } finally {
                    this.loading = false;
                }
            },
            async closeAlertPopup() {
                this.popup.alert = false;
                document.querySelectorAll('.popup_wrap').forEach(wrap => {
                    if (wrap.querySelector('.p_box.alert')) wrap.classList.remove('on');
                });

                const has = Array.isArray(this.contractList) && this.contractList.length > 0;
                if (has) {
                    const params = new URLSearchParams();
                    params.set('showVFAResult','1');
                    if (this.idParam) params.set('id', this.idParam);
                    window.location.href = 'Main.html' + (params.toString() ? ('?' + params.toString()) : '');
                    return;
                }                
            },
            buildContracts() {
                const now = new Date();
                const formatDate = (d) => {
                    const pad = (n) => (n<10? '0'+n : n);
                    return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+' '+pad(d.getHours())+':'+pad(d.getMinutes())+':'+pad(d.getSeconds());
                };

                const mapOptionToIndex012 = (opt) => {
                    if (!opt) return null;
                    if (opt.match(/(\d+)/)) {
                        // 백엔드가 1-based(option1→1)를 기대
                        const n = parseInt(opt.replace(/[^0-9]/g,''),10);
                        return isNaN(n) ? null : n;
                    }
                    return opt==='option1'?1:(opt==='option2'?2:3);
                };

                // option1=노후(1), option2=기타(2)
                const mapPurpose = (opt) => {
                    if (!opt) return null;
                    return opt==='option1'?1:2;
                };

                // 백엔드가 YYYY-MM-DD 형식을 기대
                const rawBirth = (this.answers.cus_birth && (''+this.answers.cus_birth).trim() !== '') ? (''+this.answers.cus_birth).trim() : (this.member_info && this.member_info.member_birth ? (''+this.member_info.member_birth).trim() : null);
                const cusBirth = rawBirth ? toISO(rawBirth) : null;

                const valStr = (v) => { return (v === null || v === undefined) ? '' : ('' + v); };
                const toIntOrEmpty = (v) => { const n = Number(v); return (isNaN(n) ? '' : n); };

                const it1 = toIntOrEmpty(mapOptionToIndex012(this.answers.step2));
                const it2 = toIntOrEmpty(mapOptionToIndex012(this.answers.step3));
                const ipurp = toIntOrEmpty(mapPurpose(this.answers.step4));
                const step5Val = this.answers.step5;
                let tAge = toIntOrEmpty(mapStep5OptionToAge(step5Val, this.answers.step5_custom));
                if (tAge === '') tAge = 65;

                // 외부 펀드(sCode)는 vfa_item_code가 없으므로 item_code(=sCode) 사용
                const c0 = (this.contractList && this.contractList[0]) ? this.contractList[0] : {};
                const stockVal = c0.account_number || '';
                const itemVal = this.sCodeParam ? (c0.item_code || this.sCodeParam) : (c0.vfa_item_code || '');

                const ageVal = Number.isFinite(this.insuranceAge) ? parseInt(this.insuranceAge,10) : null;


                const payload = {
                    member_id: valStr(this.memberId || ''),
                    stock_code: valStr(stockVal),
                    item_code: valStr(itemVal),
                    invest_type_01: (it1 === '' ? 0 : it1),
                    invest_type_02: (it2 === '' ? 0 : it2),
                    invest_purpose: (ipurp === '' ? 0 : ipurp),
                    target_age: tAge,
                    cus_birth: valStr(cusBirth),
                    gp_apply_yn: valStr((this.answers.step6 === 'option1') ? '1' : '2'),
                    alarm_yn: valStr((this.answers.step7 === 'option1') ? '1' : '2'),
                    age: valStr(ageVal === null ? '' : ageVal),
                    // 외부 펀드(sCode) 흐름: t_vfa_member_contract.id 전달 → SP에서 service_yn=1 업데이트
                    member_contract_id: this.sCodeParam ? valStr(this.idParam || '') : ''
                };

                return payload;
            },

            async updateMemberInfo() {
                const member_id = this.memberId || '';
                if (!member_id) {
                    return null;
                }

                const gender = (this.answers.step1 === 'option2') ? '2' : '1';
                const birthRaw = this.answers.cus_birth ? (''+this.answers.cus_birth).trim() : '';
                const birth = toISO(birthRaw) || '';

                const paramsObj = {
                    target: 'ONENew',
                    cmd: 'SaveMemberInfo',
                    member_id: member_id,
                    member_birth: birth,
                    member_gender: gender
                };

                const resp = await httpPost(urlReturnJsonAPI, JSON.stringify(paramsObj));

                if (!this.member_info) this.member_info = {};
                if (birth) this.member_info.member_birth = birth;
                if (gender) this.member_info.member_gender = gender;

                return resp;
            },

            async submitContract() {
                try {
                    const contract = this.buildContracts();

                    if (!Array.isArray(this.contractList) || this.contractList.length === 0 || !this.contractList[0].corp_name || !this.contractList[0].item_name) {
                        const msg = '상품 정보(펀드)를 다시 한번 확인해주세요';
                        if (typeof VueAlert === 'function') VueAlert(msg); else alert(msg);
                        return null;
                    }

                    const paramsObj = { target: 'VFANew', cmd: 'VFAContractAdd' };

                    // 외부 펀드(sCode 흐름)는 내부 증번이 없어 stock_code 빈 값 허용
                    const needItem = (contract && contract.item_code) || '';
                    const needStock = (contract && contract.stock_code) || '';
                    const isExternal = !!this.sCodeParam;
                    if (!needItem || (''+needItem).trim() === '' || (!isExternal && (!needStock || (''+needStock).trim() === ''))) {
                        const msg = '상품 정보(펀드) 코드가 누락되었습니다. 목록에서 펀드를 다시 선택해 주세요.';
                        if (typeof VueAlert === 'function') VueAlert(msg); else alert(msg);
                        return null;
                    }

                    // age는 백엔드 필수값 → 빈 값이면 생년월일 입력 유도
                    if (!contract || !Object.prototype.hasOwnProperty.call(contract, 'age') || (''+contract.age).trim() === '') {
                        const msg = '생년월일 정보가 필요합니다. 생년월일을 입력해 주세요.';
                        if (typeof VueAlert === 'function') VueAlert(msg); else alert(msg);
                        const input = document.querySelector('input[placeholder*="생년월일"]');
                        if (input && typeof input.focus === 'function') input.focus();
                        return null;
                    }

                    const flatKeys = ['member_id','stock_code','item_code','invest_type_01','invest_type_02','invest_purpose','target_age','cus_birth','gp_apply_yn','alarm_yn','age','member_contract_id'];
                    flatKeys.forEach(k => {
                        if (contract && Object.prototype.hasOwnProperty.call(contract, k) && contract[k] !== null && contract[k] !== undefined && ((''+contract[k]).toString().trim() !== '')) {
                            paramsObj[k] = contract[k];
                        }
                    });

                    const params = JSON.stringify(paramsObj);
                    const resp = await httpPost(urlReturnJsonAPI, params);
                    return resp;
                } finally {
                    this.loading = false;
                }
            },
            
        }
    });

    window.vm = vm;

})();
