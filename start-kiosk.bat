@echo off
echo MotorOil POS - Kiosk Modu Baslatiliyor...
echo.
echo Tam ekran modunda acilacak.
echo Cikmak icin: Alt+F4
echo.
timeout /t 3

REM Chrome ile kiosk modunda aç
start chrome.exe --kiosk --app=http://localhost:3000 --disable-infobars --disable-session-crashed-bubble --disable-restore-session-state

REM Alternatif: Edge ile açmak için yukarıdaki satırı yorum yapın ve alttakini aktif edin
REM start msedge.exe --kiosk --app=http://localhost:3000 --disable-infobars
