<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Report_Detail.aspx.cs" Inherits="ifa.co.kr.Example.MediCode.Report_Detail" ResponseEncoding="utf-8" %>
<%@ Register Src="~/Example/MediCode/WebUserControl_Top.ascx" TagName="WebUserControl_Top" TagPrefix="uc1" %>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="ko">
<head runat="server">
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>메디코드 상세 리포트</title>
    <link href="/MobileHome/MediCode/styles/medi_code.css?v=<%=DateTime.Now.ToString("yyyyMMddHHmmss") %>" rel="stylesheet" />
    <link href="styles/portfolio-overrides.css" rel="stylesheet" />
    <script src="/Scripts/vue@2.3.3/vue.min.js"></script>
</head>
<body class="re_detail">
<form id="form1" runat="server">
    <uc1:WebUserControl_Top ID="WebUserControl_Top" runat="server" />
    <div id="divVue">
        <div class="wrap re_detail" v-if="item">
            <p class="title w_color mb1">{{ item.disease_name }}</p>
            <p class="f14 w_color mb3">메디코드 데이터 분석 결과</p>

            <div class="w_box tc mb2">
                <div class="s_title mb2 tl">종합 데이터 위험도</div>
                <p class="tc f40 bold mb2">{{ item.total_score }}점</p>
                <div class="lineWrap mb2">
                    <div class="l_bg">
                        <div class="line" :style="{ width: item.total_score + '%' }"></div>
                    </div>
                </div>
                <p class="f14 gr_color tc">
                    건강검진 {{ percent }}%와 유전자 {{ 100 - percent }}%를 반영한 결과
                </p>
            </div>

            <div class="w_box tc mb2">
                <div class="s_title mb2 tl">건강검진 위험도</div>
                <p class="tc f40 bold" v-if="healthScore">{{ healthScore.total_score }}점</p>
                <img src="/MobileHome/MediCode/images/No-data.png" alt="데이터 없음" v-else />
                <p class="f14 gr_color tc">{{ healthScore ? healthScore.health_grade : '분석 대상 데이터 없음' }}</p>
            </div>

            <div class="w_box tc mb2">
                <div class="s_title mb2 tl">유전자 분석 위험도</div>
                <p class="tc f40 bold" v-if="geneScore">{{ geneScore.total_score }}점</p>
                <img src="/MobileHome/MediCode/images/No-data.png" alt="데이터 없음" v-else />
                <p class="f14 gr_color tc">{{ geneScore ? geneScore.gen_grade : '분석 대상 데이터 없음' }}</p>
            </div>

            <div class="w_box mb3">
                <p class="s_title mb1">질병 정보</p>
                <p class="f14 gr_color">{{ item.disease_desc }}</p>
            </div>

            <p class="s_txt mb2" v-if="errorMessage">{{ errorMessage }}</p>
            <button type="button" class="g_btn g_on mb1" @click="goBack">돌아가기</button>
        </div>

        <div class="wrap re_detail" v-else>
            <div class="w_box tc mb2">
                <p class="s_title">{{ errorMessage || '상세 정보를 불러오는 중입니다.' }}</p>
            </div>
            <button type="button" class="g_btn g_on mb1" @click="goBack">돌아가기</button>
        </div>
    </div>
</form>
<script src="scripts/medicode-demo-store.js"></script>
<script src="scripts/report-detail.js"></script>
</body>
</html>
