@echo off
echo ========================================
echo ACTUALIZANDO API EN AZURE
echo ========================================
echo.

echo 1. Reconstruyendo imagen Docker...
az acr build --registry scispregistry --image "siniestros-api:latest" .

echo.
echo 2. Reiniciando contenedor...
az container restart --resource-group Rg-SCISP --name siniestros-api-container

echo.
echo 3. Esperando 15 segundos...
timeout /t 15 /nobreak

echo.
echo 4. Verificando logs...
az container logs --resource-group Rg-SCISP --name siniestros-api-container --tail 50

echo.
echo ========================================
echo ACTUALIZACION COMPLETADA
echo ========================================
echo.
echo Prueba la API:
echo http://siniestros-api.ahcbcddvbyg4ejew.westus2.azurecontainer.io:8000/inicio
echo.
pause
