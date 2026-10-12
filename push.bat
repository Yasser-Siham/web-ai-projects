@echo off
color 0A
echo ==================================================
echo 🚀 Pushing kolchi l GitHub...
echo ==================================================

:: كيأجوطي كاع لي بروجي الجداد والملفات لي تبدلو
git add .

:: كيدير كوميت أوتوماتيكي بالتاريخ والساعة ديال ديك اللحظة
git commit -m "Mise a jour automatique - %date% %time%"

:: كيبوشي لـ GitHub
git push origin main

echo ==================================================
echo ✅ C'est fait a khouya! Zbel kamel tpusha mzyan.
echo ==================================================
pause