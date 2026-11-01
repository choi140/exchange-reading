// 7-4 첫 화면이 그려지기 전에 밤 모드를 적용하는 짧은 스크립트 (layout <head>에 넣는다)
// 서버 layout에서 쓰므로 "use client" 모듈과 분리한다. 키는 src/lib/prefs.ts와 같아야 한다.
export const PREFS_KEY = "nb:prefs";
export const THEME_BOOT_SCRIPT = `try{var p=JSON.parse(localStorage.getItem("${PREFS_KEY}")||"{}");document.documentElement.dataset.theme=p.night?"night":"day";}catch(e){}`;
