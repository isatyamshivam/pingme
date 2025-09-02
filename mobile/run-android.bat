@echo off
echo Setting up Android environment...

set ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk
set PATH=%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools;%ANDROID_HOME%\tools\bin;%PATH%

echo ANDROID_HOME: %ANDROID_HOME%
echo Checking for connected devices...
adb devices

echo.
echo Starting React Native app...
npx @react-native-community/cli run-android

pause
