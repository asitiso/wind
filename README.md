# Windrise — Playable Combat Integration

실행 가능한 v0.5 게임을 기반으로 v0.55 전투 흐름을 통합한 배포본입니다.

## 통합 내용

- v0.5 전체 플레이 루프와 에셋 유지
- v0.55 입력 버퍼, 콤보 흐름, 카운터 연결, 타격 확인, 접촉 보정, 전투 리듬 적용
- 위협 포커스와 전투 순간 오버레이 적용
- 전투 대상 중심 카메라 및 화면 흔들림 보정 적용
- v0.91과 동일한 전투 표현·위협 포커스·프레젠테이션 폴리시 포함
- 기존 Damage, Stagger, Poise, Parry 판정 유지

## 실행

```bash
npm run dev
```

브라우저에서 `http://127.0.0.1:4173`을 엽니다.

## 조작

- A / D: 이동
- Space: 점프
- Shift: 지상 회피 / 공중 Air Dash
- J: 연속베기 / Perfect Dodge Counter
- K: 강공격
- Q: 패링
- E: 처형 / 상호작용

## 검증

- Node 테스트 368개 통과
- 주요 JavaScript 문법 검사 통과
- 브라우저 로딩, 공격 입력, 화면 렌더링 및 콘솔 오류 확인
