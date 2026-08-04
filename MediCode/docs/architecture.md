# 데이터 처리 구조

```text
건강검진·유전자 원천 데이터
        ↓
SQL Server Stored Procedure
        ↓
위험도 점수와 등급 계산
        ↓
ASP.NET Web Forms
        ↓
요약 리포트와 상세 리포트
```

공개 데모에서는 실제 데이터베이스와 프로시저 대신 `data/report/0.json`부터 `10.json`까지의 샘플 결과를 사용합니다. 슬라이더의 건강검진 반영 비율을 10으로 나눈 값이 조회할 파일 번호가 됩니다.
