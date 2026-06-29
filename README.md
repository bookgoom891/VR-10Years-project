# Personal Web App

개인용 웹앱을 만들기 위한 기본 골격입니다. 현재는 외부 패키지 없이 브라우저에서 바로 실행되는 정적 웹앱으로 시작합니다.

## 실행

Codex 번들 Node.js로 로컬 서버를 실행할 수 있습니다.

```powershell
.\start-webapp.ps1
```

브라우저에서 `http://localhost:5173`을 열면 됩니다.

## Git 기본 흐름

```powershell
git status
git add .
git commit -m "Initial web app setup"
```

이 PC의 일반 PATH에 Git이 없다면 Codex 번들 Git을 사용해야 합니다. 이 저장소에서는 로컬 초기화만 해두었고, GitHub 원격 저장소 연결은 아직 하지 않았습니다.

GitHub에 새 저장소를 만든 뒤 아래 형식으로 연결하면 됩니다.

```powershell
git remote add origin https://github.com/YOUR_NAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

커밋 작성자 설정이 필요하면 다음을 먼저 실행하세요.

```powershell
git config --global user.name "YOUR_NAME"
git config --global user.email "YOUR_EMAIL"
```
