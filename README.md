# VR 리밸런싱

TQQQ 기반 개인 VR(Value Rebalancing) 운용 계산 보조 웹앱입니다.

## 실행

```powershell
pnpm install
pnpm dev
```

브라우저에서 `http://localhost:5173`을 열면 됩니다.

Windows 로그인 시 자동 실행은 시작프로그램의 `VR Rebalancing Auto Start`
바로가기로 설정합니다. 서버가 준비되면 Chrome에서 `http://127.0.0.1:5173/`을
엽니다. 서버는 숨겨진 창으로 실행되며, 로그는 `work/vr-autostart.log`에 저장됩니다.
자동 실행을 해제하려면 시작프로그램 폴더에서 해당 바로가기를 제거합니다.

## 범위

- 실제 주문, 계좌 연동, 자동매매, 실시간 시세 API는 포함하지 않습니다.
- 모든 입력값은 사용자가 직접 관리하며 localStorage에 저장됩니다.
- 이 앱은 개인 운용 계산 보조 도구이며 투자 판단과 주문 실행은 사용자의 책임입니다.
