@echo off
echo Setting up environment...
set ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.12.7-hotspot
set PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools;%ANDROID_HOME%\build-tools\35.0.0;%PATH%

echo Environment variables set:
echo ANDROID_HOME: %ANDROID_HOME%
echo JAVA_HOME: %JAVA_HOME%

echo.
echo Checking connected devices...
adb devices

echo.
echo Attempting to build and install APK...
cd android
gradlew.bat assembleDebug
if %errorlevel% neq 0 (
    echo Build failed. Trying with --stacktrace for more info...
    gradlew.bat assembleDebug --stacktrace
    pause
    exit /b 1
)

echo.
echo Installing APK on device...
adb install app\build\outputs\apk\debug\app-debug.apk

echo.
echo Starting the app...
adb shell am start -n com.pingmemobile/.MainActivity

echo.
echo Done! Check your device for the PingMe app.
pause
