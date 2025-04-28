$components = @(
    "src\components\ShelfToSheet.jsx",
    "src\components\QRManagementModal.jsx",
    "src\components\PrestamoDevolucion.jsx",
    "src\components\MiPerfil.jsx",
    "src\components\ItemListEditor.jsx",
    "src\components\Home.jsx",
    "src\components\Historial.jsx",
    "src\components\CrearModificarBolsa.jsx",
    "src\components\EditarAlmacen.jsx",
    "src\components\Configuracion.jsx",
    "src\components\ConsultarBolsa.jsx",
    "src\components\Alerta.jsx"
)

foreach ($component in $components) {
    $content = Get-Content $component -Raw
    $newContent = $content -replace "const BASE_URL = `"http://10\.0\.0\.49:8000`".*`n", "import { API_URL } from '../config'`n`nconst BASE_URL = API_URL;`n"
    $newContent | Set-Content $component -NoNewline
    Write-Host "Updated $component"
}
