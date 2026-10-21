@echo off
REM Serves a built copy of the trainer. Needs Node 20+.
node "%~dp0serve.mjs" "%~dp0dist" 4173
