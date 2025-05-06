import React, { useEffect, useState, useCallback } from "react"; // useCallback añadido aunque no se use mucho aquí
import { useNavigate } from "react-router-dom";
import Screen from "../components/Screen";
import styles from './ShelfToSheet.module.css'; // <--- Importar CSS Module
import { prepareInventoryData, exportToExcel } from '../utils/excelExport'; // Importar funciones de exportación
import * as XLSX from 'xlsx'; // Importar librería XLSX directamente

import { API_URL } from '../utils/api'

const BASE_URL = API_URL;

export default function ShelfToSheet() {
  const navigate = useNavigate();

  // --- Estados ---
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true); // <--- Nuevo: Estado de carga del usuario
  const [almacenes, setAlmacenes] = useState([]);
  const [loadingAlmacenes, setLoadingAlmacenes] = useState(true); // <--- Nuevo: Estado de carga de almacenes
  const [error, setError] = useState(null); // <--- Nuevo: Estado para errores generales
  const [feedback, setFeedback] = useState({ message: null, type: null }); // <--- Nuevo: Para mensajes de éxito/error
  const [showModal, setShowModal] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false); // <--- Nuevo: Estado para creación/eliminación
  const [nuevoAlm, setNuevoAlm] = useState({
    almacenName: "",
    categoryName: "", // Considerar si realmente se necesita o el backend lo infiere
    categoryCount: 0,
  });
  const [loading, setLoading] = useState(false); // Estado para mostrar carga
  
  // --- Estados para Shelf-to-Sheet ---
  const [currentCycle, setCurrentCycle] = useState(null);
  const [scanEntries, setScanEntries] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [scannedBag, setScannedBag] = useState(null);
  const [showScanModal, setShowScanModal] = useState(false);
  const [discrepancies, setDiscrepancies] = useState(0);
  const [totalScanned, setTotalScanned] = useState(0);
  const [scanStatus, setScanStatus] = useState('idle'); // 'idle', 'scanning', 'success', 'error'
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [cycles, setCycles] = useState([]);
  const [isLoadingCycles, setIsLoadingCycles] = useState(false);
  const [missingBags, setMissingBags] = useState([]); // Estado para almacenar las bolsas faltantes
  
  // --- Derivados ---
  const isAdmin = currentUser?.rol === "admin";
  const isGestor = currentUser?.rol === "gestor" || isAdmin;
  const canManageCycles = isGestor;
  const cycleInProgress = !!currentCycle;

  // --- Limpiar Feedback ---
  const clearFeedback = () => setFeedback({ message: null, type: null });

  // Crear un nuevo ciclo de conteo
  const handleCreateCycle = async () => {
    try {
      setIsSubmitting(true);
      clearFeedback();
      setFeedback({ message: "Creando nuevo ciclo de conteo...", type: 'info' });
      
      // Crear un ciclo local si no hay conexión con el backend
      const newCycle = {
        id: Date.now(), // Usar timestamp como ID temporal
        status: "OPEN",
        started_at: new Date().toISOString(),
        ended_at: null,
        created_by_username: currentUser?.username || "usuario_local"
      };
      
      setCurrentCycle(newCycle);
      setScanEntries([]);
      setDiscrepancies(0);
      setTotalScanned(0);
      
      // Guardar en localStorage para persistencia
      const localCycles = JSON.parse(localStorage.getItem('localCycles') || '[]');
      localCycles.push(newCycle);
      localStorage.setItem('localCycles', JSON.stringify(localCycles));
      
      setFeedback({ 
        message: `Ciclo de conteo #${newCycle.id} iniciado correctamente (modo local)`, 
        type: 'success' 
      });
    } catch (error) {
      console.error("Error creando ciclo:", error);
      setFeedback({ 
        message: `Error al crear ciclo: ${error.message}`, 
        type: 'error' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Cerrar un ciclo de conteo
  const handleCloseCycle = async () => {
    try {
      if (!currentCycle || !currentCycle.id) {
        setFeedback({ message: "No hay un ciclo activo para cerrar", type: 'warning' });
        return;
      }
      
      setIsSubmitting(true);
      clearFeedback();
      setFeedback({ message: "Cerrando ciclo de conteo...", type: 'info' });
      
      // Verificar bolsas faltantes antes de cerrar el ciclo
      const missingBags = await checkMissingBags();
      
      // Actualizar ciclo local
      const updatedCycle = {
        ...currentCycle,
        status: "CLOSED",
        ended_at: new Date().toISOString(),
        missingBags: missingBags // Guardar las bolsas faltantes en el ciclo
      };
      
      // Actualizar en localStorage
      const localCycles = JSON.parse(localStorage.getItem('localCycles') || '[]');
      const updatedCycles = localCycles.map(cycle => 
        cycle.id === currentCycle.id ? updatedCycle : cycle
      );
      localStorage.setItem('localCycles', JSON.stringify(updatedCycles));
      
      setCurrentCycle(updatedCycle);
      
      // Mensaje de éxito con información de bolsas faltantes
      let successMessage = `Ciclo de conteo #${updatedCycle.id} cerrado correctamente (modo local)`;
      if (missingBags.length > 0) {
        successMessage += `. Se detectaron ${missingBags.length} bolsas faltantes.`;
      }
      
      setFeedback({ 
        message: successMessage, 
        type: 'success' 
      });
      
      // Recargar ciclos
      fetchCycles();
      
      // Generar reporte automáticamente
      setTimeout(() => {
        handleDownloadReport(updatedCycle.id);
      }, 1000);
      
    } catch (error) {
      console.error("Error cerrando ciclo:", error);
      setFeedback({ 
        message: `Error al cerrar ciclo: ${error.message}`, 
        type: 'error' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Verificar bolsas faltantes (que deberían estar en la ubicación pero no se escanearon)
  const checkMissingBags = async () => {
    try {
      // Obtener todas las bolsas desde el backend
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/bolsas?token=${token}`);
      
      if (!response.ok) {
        throw new Error(`Error obteniendo bolsas: ${response.status}`);
      }
      
      const allBags = await response.json();
      console.log("Total de bolsas en el sistema:", allBags.length);
      
      // Obtener entradas del ciclo actual (bolsas ya escaneadas)
      const entries = JSON.parse(localStorage.getItem(`cycleEntries_${currentCycle.id}`) || '[]');
      
      // Crear un conjunto de IDs de bolsas ya escaneadas para búsqueda rápida
      const scannedBagIds = new Set(entries.map(entry => entry.bag_id));
      
      // Filtrar todas las bolsas que no han sido escaneadas
      const missing = allBags.filter(bag => !scannedBagIds.has(bag.id.toString()));
      
      console.log("Se detectaron", missing.length, "bolsas faltantes");
      return missing;
    } catch (error) {
      console.error("Error verificando bolsas faltantes:", error);
      return [];
    }
  };
  
  // Descargar reporte del ciclo actual
  const handleDownloadReport = async () => {
    try {
      if (!currentCycle) {
        setFeedback({
          message: "No hay ciclo activo para generar reporte",
          type: "warning"
        });
        return;
      }
      
      setIsSubmitting(true);
      
      // Obtener entradas del ciclo
      const entries = JSON.parse(localStorage.getItem(`cycleEntries_${currentCycle.id}`) || '[]');
      
      if (entries.length === 0) {
        setFeedback({
          message: "No hay datos para generar el reporte",
          type: "warning"
        });
        setIsSubmitting(false);
        return;
      }
      
      // Crear un mapa de ubicaciones para facilitar la búsqueda
      const ubicacionesMap = {};
      
      // Añadir ubicaciones principales
      almacenes.forEach(almacen => {
        ubicacionesMap[almacen.id] = almacen.nombre;
        
        // Añadir subniveles si existen
        if (almacen.subniveles) {
          almacen.subniveles.forEach(subnivel => {
            ubicacionesMap[subnivel.id] = `${almacen.nombre} > ${subnivel.nombre}`;
          });
        }
      });
      
      console.log("Mapa de ubicaciones:", ubicacionesMap);
      console.log("Entradas para el reporte:", entries);
      
      // Preparar datos para el reporte
      const reportData = entries.map(entry => {
        // Determinar ubicación escaneada
        let ubicacionEscaneada = entry.scanned_location_name || 
                                ubicacionesMap[entry.scanned_location_id] || 
                                `ID: ${entry.scanned_location_id}`;
        
        // Determinar ubicación esperada
        let ubicacionEsperada = entry.expected_location_name || 
                               (entry.expected_location_id ? 
                                 ubicacionesMap[entry.expected_location_id] || 
                                 `ID: ${entry.expected_location_id}` 
                                : 'Sin ubicación');
        
        // Reglas simples para determinar la ubicación esperada
        if (entry.bagDetails) {
          // Si el área general comienza con "Bodega", está en bodega
          if (entry.bagDetails.area_general && entry.bagDetails.area_general.startsWith("Bodega")) {
            // Mantener la ubicación completa que ya tenemos
          }
          // Si el pasillo es "Campo Norte", está en Campo Norte
          else if (entry.bagDetails.pasillo === "Campo Norte") {
            ubicacionEsperada = "Campo Norte";
          }
          // Si no tiene área general pero tiene código que comienza con CN, está en Campo Norte
          else if (entry.bagDetails.codigo && entry.bagDetails.codigo.startsWith("CN")) {
            ubicacionEsperada = "Campo Norte";
          }
        }
        
        // Si después de todo no tenemos una ubicación esperada, usar un valor por defecto
        if (!ubicacionEsperada || ubicacionEsperada === "") {
          ubicacionEsperada = "Sin ubicación";
        }
        
        console.log("Ubicación esperada determinada:", ubicacionEsperada);
        
        return {
          "ID Bolsa": entry.bagDetails?.codigo || entry.bag_id,
          "Ubicación Escaneada": ubicacionEscaneada,
          "Ubicación Esperada": ubicacionEsperada,
          "Fecha Escaneo": new Date(entry.scanned_at).toLocaleString(),
          "Discrepancia": entry.discrepancy ? (entry.discrepancy_reason || "SÍ") : "NO",
          "Detalles": entry.bagDetails ? 
                    `Estado: ${entry.bagDetails.estado || 'No disponible'}${entry.bagDetails.cliente ? '; Cliente: ' + entry.bagDetails.cliente : ''}` 
                    : 'Sin detalles'
        };
      });
      
      // Verificar bolsas faltantes
      const missingBags = await checkMissingBags();
      
      // Crear libro de Excel
      const wb = XLSX.utils.book_new();
      
      // Crear hoja principal con los datos de escaneo
      const ws = XLSX.utils.json_to_sheet(reportData);
      
      // Añadir resumen al principio
      XLSX.utils.sheet_add_aoa(ws, [
        [`Reporte de Ciclo #${currentCycle.id} (${currentCycle.name || 'Sin nombre'})`],
        [`Fecha: ${new Date().toLocaleString()}`],
        [`Total de bolsas escaneadas: ${entries.length}`],
        [`Discrepancias encontradas: ${entries.filter(e => e.discrepancy).length}`],
        [`Bolsas faltantes: ${missingBags.length}`]
      ], { origin: "A1" });
      
      // Ajustar el rango de celdas para incluir el resumen
      const range = XLSX.utils.decode_range(ws['!ref']);
      range.s.r = 0;
      ws['!ref'] = XLSX.utils.encode_range(range);
      
      // Añadir la hoja al libro
      XLSX.utils.book_append_sheet(wb, ws, "Reporte de Escaneo");
      
      // Si hay bolsas faltantes, crear una hoja adicional
      if (missingBags.length > 0) {
        const missingBagsData = missingBags.map(bag => ({
          "ID Bolsa": bag.id,
          "Código": bag.codigo || "N/A",
          "Ubicación Esperada": bag.ubicacion_nombre || `ID: ${bag.ubicacion_id}`,
          "Estado": "NO ESCANEADA"
        }));
        
        const wsMissing = XLSX.utils.json_to_sheet(missingBagsData);
        
        // Añadir título a la hoja de bolsas faltantes
        XLSX.utils.sheet_add_aoa(wsMissing, [
          ["Bolsas Faltantes - No escaneadas durante el ciclo"],
          [`Total: ${missingBags.length} bolsas`],
          []
        ], { origin: "A1" });
        
        // Ajustar el rango de celdas
        const rangeMissing = XLSX.utils.decode_range(wsMissing['!ref']);
        rangeMissing.s.r = 0;
        wsMissing['!ref'] = XLSX.utils.encode_range(rangeMissing);
        
        // Añadir la hoja al libro
        XLSX.utils.book_append_sheet(wb, wsMissing, "Bolsas Faltantes");
      }
      
      // Generar el archivo
      const fileName = `Reporte_Ciclo_${currentCycle.id}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      setFeedback({
        message: `Reporte generado exitosamente: ${fileName}`,
        type: "success"
      });
    } catch (error) {
      console.error("Error generando reporte:", error);
      setFeedback({
        message: `Error al generar reporte: ${error.message}`,
        type: "error"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Procesar un escaneo de bolsa
  const handleScan = async (qrData) => {
    if (!currentCycle || !selectedLocation) {
      setFeedback({ 
        message: "Debe iniciar un ciclo y seleccionar una ubicación primero", 
        type: 'warning' 
      });
      return;
    }
    
    try {
      setScanStatus('scanning');
      
      // Extraer ID de bolsa del QR
      const bagId = qrData;
      
      // Verificar si la bolsa ya fue escaneada en este ciclo
      const localEntries = JSON.parse(localStorage.getItem(`cycleEntries_${currentCycle.id}`) || '[]');
      const alreadyScanned = localEntries.some(entry => entry.bag_id === bagId);
      
      if (alreadyScanned) {
        // Escaneo duplicado
        setScanStatus('error');
        setFeedback({ 
          message: "Esta bolsa ya fue escaneada en este ciclo", 
          type: 'warning' 
        });
        return;
      }
      
      // Intentar obtener detalles de la bolsa desde el backend
      let bagDetails = null;
      try {
        const token = localStorage.getItem('token');
        const bagResponse = await fetch(`${BASE_URL}/bolsas/${bagId}?token=${token}`);
        
        if (bagResponse.ok) {
          bagDetails = await bagResponse.json();
          console.log("Detalles de la bolsa:", bagDetails);
        } else {
          console.warn(`Error al obtener detalles de la bolsa: ${bagResponse.status}`);
        }
      } catch (error) {
        console.error("No se pudieron obtener detalles de la bolsa:", error);
        // Continuar con el escaneo aunque no se puedan obtener detalles
      }
      
      // Si la bolsa tiene detalles pero no tiene ubicación_id, intentar construirla a partir de los campos individuales
      let expectedLocationName = "Sin ubicación"; // Valor predeterminado
      let expectedLocationId = null;
      let isInCampoNorte = false;
      let isInBodega = false;
      
      if (bagDetails) {
        console.log("Analizando detalles completos de la bolsa:", JSON.stringify(bagDetails, null, 2));
        
        // Determinar la ubicación esperada
        expectedLocationId = bagDetails.ubicacion_id || null;
        
        // Verificar todos los campos posibles donde podría estar la información de ubicación
        const allFields = Object.entries(bagDetails);
        console.log("Todos los campos de la bolsa:", allFields);
        
        // Buscar en todos los campos si hay alguno que indique que está en Campo Norte
        const campoNorteFields = allFields.filter(([key, value]) => 
          value && typeof value === 'string' && 
          (value === "Campo Norte" || value.includes("Campo Norte"))
        );
        
        if (campoNorteFields.length > 0) {
          console.log("Campos que indican Campo Norte:", campoNorteFields);
          isInCampoNorte = true;
          expectedLocationName = "Campo Norte";
        }
        
        // Buscar en todos los campos si hay alguno que indique que está en Bodega
        const bodegaFields = allFields.filter(([key, value]) => 
          value && typeof value === 'string' && 
          value.startsWith("Bodega")
        );
        
        if (bodegaFields.length > 0 && !isInCampoNorte) {
          console.log("Campos que indican Bodega:", bodegaFields);
          isInBodega = true;
          
          // Usar el campo más completo para la ubicación
          const bodegaField = bodegaFields.sort((a, b) => b[1].length - a[1].length)[0];
          expectedLocationName = bodegaField[1];
        }
        
        // Si no se encontró en los campos generales, verificar los campos específicos
        if (expectedLocationName === "Sin ubicación") {
          // Regla simple: Si area_general comienza con "Bodega", está en bodega
          if (bagDetails.area_general && bagDetails.area_general.startsWith("Bodega")) {
            isInBodega = true;
            
            // Construir la ruta completa para bodegas
            let ubicacionCompleta = bagDetails.area_general;
            
            if (bagDetails.pasillo) {
              ubicacionCompleta += ` > ${bagDetails.pasillo}`;
              
              if (bagDetails.estante_nivel) {
                ubicacionCompleta += ` > ${bagDetails.estante_nivel}`;
                
                if (bagDetails.nivel) {
                  ubicacionCompleta += ` > ${bagDetails.nivel}`;
                }
              }
            }
            
            expectedLocationName = ubicacionCompleta;
          } 
          // Si el pasillo es "Campo Norte", está en Campo Norte
          else if (bagDetails.pasillo === "Campo Norte") {
            expectedLocationName = "Campo Norte";
            isInCampoNorte = true;
          }
          // Si no tiene área general pero tiene código que comienza con CN, está en Campo Norte
          else if (bagDetails.codigo && bagDetails.codigo.startsWith("CN")) {
            expectedLocationName = "Campo Norte";
            isInCampoNorte = true;
          }
        }
        
        // Si después de todo no tenemos una ubicación esperada, usar un valor por defecto
        if (!expectedLocationName || expectedLocationName === "") {
          expectedLocationName = "Sin ubicación";
        }
        
        console.log("Ubicación esperada determinada:", expectedLocationName);
      }
      
      // Verificar si hay discrepancia
      let discrepancy = false;
      let discrepancyReason = "";
      
      // Caso 1: La bolsa tiene una ubicación esperada que no coincide con la escaneada
      if (expectedLocationId !== null && expectedLocationId !== selectedLocation.id) {
        discrepancy = true;
        discrepancyReason = "Ubicación incorrecta";
      }
      // Caso 2: La bolsa está marcada como en Campo Norte pero se escanea en una bodega
      else if (isInCampoNorte && selectedLocation.nombre && selectedLocation.nombre.startsWith("Bodega")) {
        discrepancy = true;
        discrepancyReason = "Bolsa no marcada en bodega";
      }
      // Caso 3: La bolsa está marcada en una bodega pero se escanea en Campo Norte
      else if (isInBodega && selectedLocation.nombre && selectedLocation.nombre === "Campo Norte") {
        discrepancy = true;
        discrepancyReason = "Bolsa marcada en bodega";
      }
      // Caso 4: La bolsa no tiene ubicación asignada pero se escanea en alguna ubicación
      else if (expectedLocationName === "Sin ubicación" && selectedLocation && selectedLocation.nombre) {
        discrepancy = true;
        discrepancyReason = "Bolsa sin ubicación asignada";
      }
      
      // Crear entrada de escaneo
      const newEntry = {
        id: Date.now(), // ID temporal
        bag_id: bagId,
        expected_location_id: expectedLocationId,
        expected_location_name: expectedLocationName, // Guardar también el nombre de la ubicación esperada
        scanned_location_id: selectedLocation.id,
        scanned_location_name: selectedLocation.nombre || `ID: ${selectedLocation.id}`, // Guardar el nombre de la ubicación escaneada
        scanned_at: new Date().toISOString(),
        discrepancy: discrepancy,
        discrepancy_reason: discrepancyReason, // Guardar la razón de la discrepancia
        bagDetails
      };
      
      console.log("Nueva entrada de escaneo:", newEntry);
      
      // Guardar en localStorage
      localEntries.unshift(newEntry); // Añadir al principio
      localStorage.setItem(`cycleEntries_${currentCycle.id}`, JSON.stringify(localEntries));
      
      // Actualizar estado
      setScanEntries(localEntries);
      setTotalScanned(localEntries.length);
      setDiscrepancies(localEntries.filter(entry => entry.discrepancy).length);
      
      setScanStatus('success');
      
      // Mensaje personalizado según el tipo de discrepancia
      let feedbackMessage = "";
      if (discrepancy) {
        if (discrepancyReason === "Bolsa no marcada en bodega") {
          feedbackMessage = "⚠️ Discrepancia: Esta bolsa está marcada en Campo Norte, no debería estar en bodega";
        } else if (discrepancyReason === "Bolsa marcada en bodega") {
          feedbackMessage = "⚠️ Discrepancia: Esta bolsa está marcada en bodega, no debería estar en Campo Norte";
        } else {
          feedbackMessage = "⚠️ Discrepancia detectada: la ubicación no coincide";
        }
      } else {
        feedbackMessage = "✅ Bolsa escaneada correctamente (modo local)";
      }
      
      setFeedback({ 
        message: feedbackMessage, 
        type: discrepancy ? 'warning' : 'success' 
      });
      
      // Limpiar después de un tiempo
      setTimeout(() => {
        setScanStatus('idle');
        if (feedback.type === 'success' || feedback.type === 'warning') {
          clearFeedback();
        }
      }, 3000);
      
    } catch (error) {
      console.error("Error escaneando bolsa:", error);
      setScanStatus('error');
      setFeedback({ 
        message: `Error al escanear: ${error.message}`, 
        type: 'error' 
      });
    }
  };
  
  // Seleccionar ubicación
  const handleSelectLocation = (location) => {
    setSelectedLocation(location);
  };

  // --- Función para exportar datos a Excel ---
  const handleExportar = async () => {
    try {
      setIsSubmitting(true);
      setExportProgress(10);
      
      // Crear datos de ejemplo si no hay almacenes
      if (!almacenes || almacenes.length === 0) {
        setFeedback({
          message: "No hay datos de almacenes para exportar. Generando datos de ejemplo...",
          type: "warning"
        });
        
        // Datos de ejemplo para la exportación
        const datosEjemplo = [
          {
            Tipo: "ALMACEN",
            Ubicacion: "Bodega 1",
            Codigo: "",
            Cliente: "",
            Contenido: "",
            Estado: "",
            FechaDevolucion: "",
            UltimoMovimiento: ""
          },
          {
            Tipo: "NIVEL",
            Ubicacion: "Bodega 1 > Pasillo 1",
            Codigo: "",
            Cliente: "",
            Contenido: "",
            Estado: "",
            FechaDevolucion: "",
            UltimoMovimiento: ""
          },
          {
            Tipo: "BOLSA",
            Ubicacion: "Bodega 1 > Pasillo 1",
            Codigo: "9",
            Cliente: "Club de Golf",
            Contenido: "Palos de golf",
            Estado: "Disponible",
            FechaDevolucion: "N/A",
            UltimoMovimiento: "2023-01-01: Ingreso a bodega"
          }
        ];
        
        setExportProgress(60);
        await exportToExcel(datosEjemplo, 'Inventario_Ejemplo');
        
        setExportProgress(100);
        setFeedback({
          message: "Exportación de datos de ejemplo completada",
          type: "success"
        });
        
        setTimeout(() => {
          setExportProgress(0);
          setIsSubmitting(false);
        }, 2000);
        
        return;
      }
      
      // Obtener datos de inventario
      setExportProgress(30);
      const inventoryData = await prepareInventoryData(almacenes, BASE_URL);
      
      // Exportar a Excel - Usar la función importada
      setExportProgress(60);
      await exportToExcel(inventoryData, 'Inventario_Auditoria');
      
      setExportProgress(100);
      setFeedback({
        message: "Exportación completada con éxito",
        type: "success"
      });
      
      // Resetear después de un tiempo
      setTimeout(() => {
        setExportProgress(0);
        setIsSubmitting(false);
      }, 2000);
      
    } catch (error) {
      console.error("Error al exportar:", error);
      setFeedback({
        message: `Error al exportar: ${error.message || 'Error desconocido'}`,
        type: "error"
      });
      setExportProgress(0);
      setIsSubmitting(false);
    }
  };

  const handleExportCycleEntries = async () => {
    try {
      setIsSubmitting(true);
      
      // Obtener todas las bolsas desde el backend
      const token = localStorage.getItem('token');
      const responseBolsas = await fetch(`${BASE_URL}/bolsas?token=${token}`);
      
      if (!responseBolsas.ok) {
        throw new Error(`Error obteniendo bolsas: ${responseBolsas.status}`);
      }
      
      const allBags = await responseBolsas.json();
      console.log("Total de bolsas en el sistema:", allBags.length);
      
      // Obtener entradas del ciclo
      const entries = JSON.parse(localStorage.getItem(`cycleEntries_${currentCycle.id}`) || '[]');
      
      // Crear un mapa de ubicaciones para facilitar la búsqueda
      const ubicacionesMap = {};
      
      // Añadir ubicaciones principales
      almacenes.forEach(almacen => {
        ubicacionesMap[almacen.id] = almacen.nombre;
        
        // Añadir subniveles si existen
        if (almacen.subniveles) {
          almacen.subniveles.forEach(subnivel => {
            ubicacionesMap[subnivel.id] = `${almacen.nombre} > ${subnivel.nombre}`;
          });
        }
      });
      
      // Crear un conjunto de IDs de bolsas ya escaneadas para búsqueda rápida
      const scannedBagIds = new Set(entries.map(entry => entry.bag_id.toString()));
      
      // Preparar datos para el reporte - Incluir TODAS las bolsas
      const reportData = [];
      
      // Primero añadir las bolsas escaneadas
      entries.forEach(entry => {
        // Determinar ubicación escaneada
        let ubicacionEscaneada = entry.scanned_location_name || 
                              ubicacionesMap[entry.scanned_location_id] || 
                              `ID: ${entry.scanned_location_id}`;
        
        // Determinar ubicación esperada
        let ubicacionEsperada = entry.expected_location_name || 
                              (entry.expected_location_id ? 
                                ubicacionesMap[entry.expected_location_id] || 
                                `ID: ${entry.expected_location_id}` 
                               : 'Sin ubicación');
        
        // Extraer el código de la bolsa para ordenamiento
        const codigo = entry.bagDetails?.codigo || entry.bag_id;
        
        // Extraer contenido de la bolsa si está disponible
        let contenido = "";
        let cliente = "";
        let estado = "";
        
        // Extraer objetos (palos de golf) si están disponibles
        let objetos = [];
        
        if (entry.bagDetails) {
          estado = entry.bagDetails.estado || "";
          cliente = entry.bagDetails.cliente || "";
          
          // Extraer contenido y procesarlo para mostrar nombre y cantidad
          if (entry.bagDetails.contenido) {
            contenido = entry.bagDetails.contenido;
            
            // Intentar extraer objetos del contenido si tiene formato específico
            try {
              // Si el contenido es un string con formato "objeto1 (cantidad), objeto2 (cantidad)"
              const objetosRegex = /([^,()]+)\s*\((\d+)\)/g;
              let match;
              
              while ((match = objetosRegex.exec(contenido)) !== null) {
                objetos.push({
                  nombre: match[1].trim(),
                  cantidad: parseInt(match[2], 10)
                });
              }
              
              // Si no se encontraron objetos con el formato anterior, intentar otro formato
              if (objetos.length === 0) {
                // Dividir por comas o puntos y comas
                const items = contenido.split(/[,;]/);
                items.forEach(item => {
                  const itemTrimmed = item.trim();
                  if (itemTrimmed) {
                    // Buscar números al final del string
                    const cantidadMatch = itemTrimmed.match(/(\d+)$/);
                    if (cantidadMatch) {
                      const cantidad = parseInt(cantidadMatch[1], 10);
                      const nombre = itemTrimmed.replace(/\d+$/, '').trim();
                      objetos.push({ nombre, cantidad });
                    } else {
                      // Si no hay número, asumir cantidad 1
                      objetos.push({ nombre: itemTrimmed, cantidad: 1 });
                    }
                  }
                });
              }
            } catch (error) {
              console.error("Error procesando contenido:", error);
              // Si hay error, usar el contenido original
              objetos = [{ nombre: contenido, cantidad: 1 }];
            }
          }
        }
        
        // Crear objeto base para el reporte
        const reportItem = {
          "Bolsa": codigo,
          "Ubicación Escaneada": ubicacionEscaneada,
          "Ubicación Esperada": ubicacionEsperada,
          "Fecha Escaneo": new Date(entry.scanned_at).toLocaleString(),
          "Discrepancia": entry.discrepancy ? "❌ SÍ" : "✅ NO",
          "Estado": estado,
          "Cliente": cliente,
          // Campos adicionales para ordenamiento
          _ubicacionEsperada: ubicacionEsperada,
          _codigo: codigo,
          _tipo: "escaneada"
        };
        
        // Añadir contenido como columna única si no hay objetos específicos
        if (objetos.length === 0) {
          reportItem["Contenido"] = contenido;
        } else {
          // Añadir cada objeto como columna separada
          objetos.forEach((obj, index) => {
            reportItem[`Objeto ${index + 1}`] = obj.nombre;
            reportItem[`Cantidad ${index + 1}`] = obj.cantidad;
          });
        }
        
        reportData.push(reportItem);
      });
      
      // Calcular el número real de bolsas faltantes
      const bolsasFaltantes = allBags.filter(bag => !scannedBagIds.has(bag.id.toString()));
      const numBolsasFaltantes = bolsasFaltantes.length;
      
      // Luego añadir todas las bolsas no escaneadas
      allBags.forEach(bag => {
        // Si la bolsa ya fue escaneada, omitirla
        if (scannedBagIds.has(bag.id.toString())) {
          return;
        }
        
        // Determinar la ubicación esperada
        let ubicacionEsperada = "Sin ubicación";
        
        // Si tiene ubicación explícita, usarla
        if (bag.ubicacion) {
          ubicacionEsperada = bag.ubicacion;
        }
        // Si tiene área general que comienza con "Bodega", está en bodega
        else if (bag.area_general && bag.area_general.startsWith("Bodega")) {
          ubicacionEsperada = bag.area_general;
          
          // Construir la ruta completa para bodegas
          if (bag.pasillo) {
            ubicacionEsperada += ` > ${bag.pasillo}`;
            
            if (bag.estante_nivel) {
              ubicacionEsperada += ` > ${bag.estante_nivel}`;
              
              if (bag.nivel) {
                ubicacionEsperada += ` > ${bag.nivel}`;
              }
            }
          }
        }
        // Si el pasillo es "Campo Norte", está en Campo Norte
        else if (bag.pasillo === "Campo Norte") {
          ubicacionEsperada = "Campo Norte";
        }
        // Si el código comienza con CN, está en Campo Norte
        else if (bag.codigo && bag.codigo.startsWith("CN")) {
          ubicacionEsperada = "Campo Norte";
        }
        
        // Extraer contenido de la bolsa si está disponible
        const contenido = bag.contenido || "";
        const cliente = bag.cliente || "";
        const estado = bag.estado || "";
        
        // Extraer objetos (palos de golf) si están disponibles
        let objetos = [];
        
        // Intentar extraer objetos del contenido si tiene formato específico
        if (contenido) {
          try {
            // Si el contenido es un string con formato "objeto1 (cantidad), objeto2 (cantidad)"
            const objetosRegex = /([^,()]+)\s*\((\d+)\)/g;
            let match;
            
            while ((match = objetosRegex.exec(contenido)) !== null) {
              objetos.push({
                nombre: match[1].trim(),
                cantidad: parseInt(match[2], 10)
              });
            }
            
            // Si no se encontraron objetos con el formato anterior, intentar otro formato
            if (objetos.length === 0) {
              // Dividir por comas o puntos y comas
              const items = contenido.split(/[,;]/);
              items.forEach(item => {
                const itemTrimmed = item.trim();
                if (itemTrimmed) {
                  // Buscar números al final del string
                  const cantidadMatch = itemTrimmed.match(/(\d+)$/);
                  if (cantidadMatch) {
                    const cantidad = parseInt(cantidadMatch[1], 10);
                    const nombre = itemTrimmed.replace(/\d+$/, '').trim();
                    objetos.push({ nombre, cantidad });
                  } else {
                    // Si no hay número, asumir cantidad 1
                    objetos.push({ nombre: itemTrimmed, cantidad: 1 });
                  }
                }
              });
            }
          } catch (error) {
            console.error("Error procesando contenido:", error);
            // Si hay error, usar el contenido original
            objetos = [{ nombre: contenido, cantidad: 1 }];
          }
        }
        
        // Crear objeto base para el reporte
        const reportItem = {
          "Bolsa": bag.codigo || bag.id,
          "Ubicación Escaneada": "❌ Sin escanear",
          "Ubicación Esperada": ubicacionEsperada,
          "Fecha Escaneo": new Date().toLocaleString(),
          "Discrepancia": "❌ SÍ",
          "Estado": estado,
          "Cliente": cliente,
          // Campos adicionales para ordenamiento
          _ubicacionEsperada: ubicacionEsperada,
          _codigo: bag.codigo || bag.id,
          _tipo: "faltante"
        };
        
        // Añadir contenido como columna única si no hay objetos específicos
        if (objetos.length === 0) {
          reportItem["Contenido"] = contenido;
        } else {
          // Añadir cada objeto como columna separada
          objetos.forEach((obj, index) => {
            reportItem[`Objeto ${index + 1}`] = obj.nombre;
            reportItem[`Cantidad ${index + 1}`] = obj.cantidad;
          });
        }
        
        reportData.push(reportItem);
      });
      
      // Función para extraer números
      const extraerNumero = (str) => {
        if (!str) return 0;
        const match = String(str).match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      };
      
      // Ordenar los datos: primero por ubicación esperada, luego por código
      reportData.sort((a, b) => {
        // Extraer partes de la ubicación para ordenamiento jerárquico
        const partsA = a._ubicacionEsperada.split('>').map(p => p.trim());
        const partsB = b._ubicacionEsperada.split('>').map(p => p.trim());
        
        // Comparar cada nivel de la ruta
        for (let i = 0; i < Math.min(partsA.length, partsB.length); i++) {
          // Si las partes son iguales, continuar con la siguiente
          if (partsA[i] === partsB[i]) continue;
          
          // Extraer números para comparación numérica
          const numA = extraerNumero(partsA[i]);
          const numB = extraerNumero(partsB[i]);
          
          // Si ambas partes contienen números, ordenar numéricamente
          if (numA && numB) {
            return numA - numB;
          }
          
          // Si no, ordenar alfabéticamente
          return partsA[i].localeCompare(partsB[i]);
        }
        
        // Si una ruta es más larga que la otra, la más corta va primero
        if (partsA.length !== partsB.length) {
          return partsA.length - partsB.length;
        }
        
        // Si las ubicaciones son exactamente iguales, ordenar por código numéricamente
        const numA = extraerNumero(a._codigo);
        const numB = extraerNumero(b._codigo);
        
        if (numA && numB) {
          return numA - numB;
        }
        
        // Si no se pueden extraer números, ordenar alfabéticamente
        return String(a._codigo).localeCompare(String(b._codigo));
      });
      
      // Eliminar los campos de ordenamiento antes de exportar
      const cleanData = reportData.map(item => {
        const { _ubicacionEsperada, _codigo, _tipo, ...rest } = item;
        return rest;
      });
      
      // Crear libro de Excel
      const wb = XLSX.utils.book_new();
      
      // Crear hoja principal con los datos de escaneo
      const ws = XLSX.utils.json_to_sheet(cleanData);
      
      // Añadir resumen al principio
      XLSX.utils.sheet_add_aoa(ws, [
        [`Reporte de Ciclo #${currentCycle.id} (${currentCycle.name || 'Sin nombre'})`],
        [`Fecha: ${new Date().toLocaleString()}`],
        [`Total de bolsas escaneadas: ${entries.length}`],
        [`Discrepancias encontradas: ${entries.filter(e => e.discrepancy).length}`],
        [`Bolsas faltantes: ${numBolsasFaltantes}`],
        []
      ], { origin: "A1" });
      
      // Ajustar el rango de celdas para incluir el resumen
      const range = XLSX.utils.decode_range(ws['!ref']);
      range.s.r = 0;
      ws['!ref'] = XLSX.utils.encode_range(range);
      
      // Ajustar ancho de columnas
      const columnWidths = [
        { wch: 15 },  // Bolsa
        { wch: 25 },  // Ubicación Escaneada
        { wch: 25 },  // Ubicación Esperada
        { wch: 20 },  // Fecha Escaneo
        { wch: 15 },  // Discrepancia
        { wch: 15 },  // Estado
        { wch: 20 },  // Cliente
        { wch: 40 }   // Contenido
      ];
      ws['!cols'] = columnWidths;
      
      // Añadir la hoja al libro
      XLSX.utils.book_append_sheet(wb, ws, "Reporte Completo");
      
      // Generar el archivo
      const fileName = `Reporte_Ciclo_${currentCycle.id}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      setFeedback({
        message: `Reporte generado exitosamente: ${fileName}`,
        type: "success"
      });
    } catch (error) {
      console.error("Error generando reporte:", error);
      setFeedback({
        message: `Error al generar reporte: ${error.message}`,
        type: "error"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchAlmacenes = async () => {
    try {
      setLoadingAlmacenes(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      // Enviar token tanto en la URL como en el encabezado para asegurar compatibilidad
      const response = await fetch(`${BASE_URL}/auditoria?token=${token}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${await response.text()}`);
      }
      
      const data = await response.json();
      setAlmacenes(data);
    } catch (error) {
      console.error("Error cargando almacenes:", error);
      setError(`Error al cargar almacenes: ${error.message}`);
      setFeedback({
        message: `Error al cargar almacenes: ${error.message}`,
        type: "error"
      });
    } finally {
      setLoadingAlmacenes(false);
    }
  };
  
  // --- Función para obtener el usuario actual ---
  const fetchCurrentUser = async () => {
    try {
      setLoadingUser(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.warn("No hay token de autenticación");
        setFeedback({
          message: "No hay sesión activa. Algunas funciones pueden estar limitadas.",
          type: "warning"
        });
        setLoadingUser(false);
        return;
      }
      
      const response = await fetch(`${BASE_URL}/usuarios/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData);
      } else {
        // No redirigir al login, solo mostrar advertencia
        console.warn("Error obteniendo datos del usuario:", response.status);
        setFeedback({
          message: "No se pudo obtener información del usuario. Algunas funciones pueden estar limitadas.",
          type: "warning"
        });
      }
    } catch (error) {
      console.error("Error en fetchCurrentUser:", error);
      setFeedback({
        message: "Error de conexión. Algunas funciones pueden estar limitadas.",
        type: "error"
      });
    } finally {
      setLoadingUser(false);
    }
  };
  
  // Función para cargar entradas de un ciclo
  const fetchCycleEntries = async (cycleId) => {
    try {
      setIsLoadingEntries(true);
      
      // Cargar entradas desde localStorage
      const localEntries = JSON.parse(localStorage.getItem(`cycleEntries_${cycleId}`) || '[]');
      setScanEntries(localEntries);
      
      // Calcular estadísticas
      const discrepancyCount = localEntries.filter(entry => entry.discrepancy).length;
      setDiscrepancies(discrepancyCount);
      setTotalScanned(localEntries.length);
      
    } catch (error) {
      console.error("Error cargando entradas:", error);
      setFeedback({ 
        message: `Error al cargar entradas: ${error.message}`, 
        type: 'error' 
      });
    } finally {
      setIsLoadingEntries(false);
    }
  };

  // Efecto para actualizar el contador de discrepancias cuando cambian las entradas
  useEffect(() => {
    if (scanEntries.length > 0) {
      // Recalcular discrepancias en tiempo real
      let discrepancyCount = 0;
      
      scanEntries.forEach(entry => {
        let isDiscrepancy = entry.discrepancy;
        
        // Verificar si es una bolsa de Campo Norte en Bodega
        if (!isDiscrepancy && entry.bagDetails) {
          const isInCampoNorte = entry.bagDetails.pasillo === "Campo Norte" || 
                               (entry.bagDetails.codigo && entry.bagDetails.codigo.startsWith("CN"));
          
          const isInBodega = entry.bagDetails.area_general && 
                           entry.bagDetails.area_general.startsWith("Bodega");
          
          const scannedInBodega = entry.scanned_location_name && 
                                entry.scanned_location_name.startsWith("Bodega");
          
          const scannedInCampoNorte = entry.scanned_location_name === "Campo Norte";
          
          // Caso 1: Bolsa de Campo Norte escaneada en Bodega
          if (isInCampoNorte && scannedInBodega) {
            isDiscrepancy = true;
          }
          
          // Caso 2: Bolsa de Bodega escaneada en Campo Norte
          if (isInBodega && scannedInCampoNorte) {
            isDiscrepancy = true;
          }
          
          // Caso 3: Bolsa sin ubicación
          if (!isInCampoNorte && !isInBodega && entry.expected_location_name === "Sin ubicación") {
            isDiscrepancy = true;
          }
        }
        
        if (isDiscrepancy) {
          discrepancyCount++;
        }
      });
      
      // Actualizar el contador
      setDiscrepancies(discrepancyCount);
    }
  }, [scanEntries]);

  // Cargar datos iniciales
  useEffect(() => {
    fetchCurrentUser();
    fetchAlmacenes();
    fetchCycles();
  }, []);

  // --- Función para cargar ciclos de conteo ---
  const fetchCycles = async () => {
    try {
      setIsLoadingCycles(true);
      
      // Cargar ciclos desde localStorage
      const localCycles = JSON.parse(localStorage.getItem('localCycles') || '[]');
      setCycles(localCycles);
      
      // Buscar ciclo abierto
      const openCycle = localCycles.find(cycle => cycle.status === 'OPEN');
      if (openCycle) {
        setCurrentCycle(openCycle);
        // Cargar entradas para el ciclo abierto
        fetchCycleEntries(openCycle.id);
      }
    } catch (error) {
      console.error("Error cargando ciclos:", error);
      setFeedback({ 
        message: `Error al cargar ciclos: ${error.message}`, 
        type: 'error' 
      });
    } finally {
      setIsLoadingCycles(false);
    }
  };

  // Función para actualizar las ubicaciones de las bolsas
  const handleUpdateLocations = async () => {
    try {
      setIsSubmitting(true);
      setFeedback({ 
        message: "Actualizando ubicaciones de bolsas...", 
        type: 'info' 
      });
      
      // Obtener entradas del ciclo actual
      const entries = JSON.parse(localStorage.getItem(`cycleEntries_${currentCycle.id}`) || '[]');
      let updatedCount = 0;
      let discrepanciesFixed = 0;
      
      // IMPORTANTE: Solo actualizar las entradas que tienen discrepancias
      // Las entradas sin discrepancias no se modifican en absoluto
      const updatedEntries = entries.map(entry => {
        // Verificar si la entrada tiene discrepancia
        if (entry.discrepancy) {
          console.log(`Actualizando bolsa con discrepancia: ${entry.bag_id}`);
          
          // Para las bolsas con discrepancias, usar la ubicación escaneada como la ubicación esperada
          const updatedEntry = {
            ...entry,
            expected_location_name: entry.scanned_location_name,
            expected_location_id: entry.scanned_location_id,
            discrepancy: false,
            discrepancy_reason: ""
          };
          
          updatedCount++;
          discrepanciesFixed++;
          
          return updatedEntry;
        }
        
        // IMPORTANTE: Si no hay discrepancia, devolver la entrada original sin modificar
        // Esto garantiza que las bolsas sin discrepancias no se alteran
        return entry;
      });
      
      // Guardar las entradas actualizadas
      localStorage.setItem(`cycleEntries_${currentCycle.id}`, JSON.stringify(updatedEntries));
      
      // Actualizar estado
      setScanEntries(updatedEntries);
      setDiscrepancies(updatedEntries.filter(entry => entry.discrepancy).length);
      
      setFeedback({ 
        message: `Ubicaciones actualizadas correctamente. ${updatedCount} bolsas actualizadas. ${discrepanciesFixed} discrepancias corregidas.`, 
        type: 'success' 
      });
    } catch (error) {
      console.error("Error actualizando ubicaciones:", error);
      setFeedback({ 
        message: `Error al actualizar ubicaciones: ${error.message}`, 
        type: 'error' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función para detectar bolsas faltantes en la ubicación actual
  const detectMissingBags = async (locationName) => {
    try {
      setIsSubmitting(true);
      setFeedback({ 
        message: "Buscando bolsas faltantes...", 
        type: 'info' 
      });
      
      // Obtener todas las bolsas desde el backend
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/bolsas?token=${token}`);
      
      if (!response.ok) {
        throw new Error(`Error obteniendo bolsas: ${response.status}`);
      }
      
      const allBags = await response.json();
      console.log("Bolsas obtenidas del servidor:", allBags.length);
      
      // Obtener entradas del ciclo actual (bolsas ya escaneadas)
      const entries = JSON.parse(localStorage.getItem(`cycleEntries_${currentCycle.id}`) || '[]');
      
      // Crear un conjunto de IDs de bolsas ya escaneadas para búsqueda rápida
      const scannedBagIds = new Set(entries.map(entry => entry.bag_id));
      
      // Filtrar todas las bolsas que no han sido escaneadas
      const missing = allBags.filter(bag => !scannedBagIds.has(bag.id.toString()));
      
      // Actualizar el estado
      setMissingBags(missing);
      
      setFeedback({
        message: `Se encontraron ${missing.length} bolsas en el sistema.`,
        type: "success"
      });
      
      return missing;
    } catch (error) {
      console.error("Error detectando bolsas faltantes:", error);
      setFeedback({
        message: `Error al detectar bolsas faltantes: ${error.message}`,
        type: "error"
      });
      return [];
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // --- Render ---
  return (
    <Screen>
      <div className={styles.container}>
        <h1 className={styles.title}>Shelf to Sheet</h1>
        
        {feedback.message && (
          <div className={`${styles.feedback} ${styles[feedback.type]}`}>
            {feedback.message}
          </div>
        )}
        
        <div className={styles.statsContainer}>
          <div className={styles.statCard}>
            <h3>Almacenes</h3>
            <p className={styles.statValue}>{almacenes.length}</p>
          </div>
          
          {currentCycle && (
            <>
              <div className={styles.statCard}>
                <h3>Ciclo Actual</h3>
                <p className={styles.statValue}>#{currentCycle.id}</p>
              </div>
              
              <div className={styles.statCard}>
                <h3>Bolsas Escaneadas</h3>
                <p className={styles.statValue}>{totalScanned}</p>
              </div>
              
              <div className={styles.statCard}>
                <h3>Discrepancias</h3>
                <p className={`${styles.statValue} ${discrepancies > 0 ? styles.warning : ''}`}>
                  {discrepancies}
                </p>
              </div>
            </>
          )}
        </div>
        
        <div className={styles.actionsContainer}>
          <div className={styles.sectionTitle}>
            <h2>Ciclo de Conteo</h2>
          </div>
          
          <div className={styles.cycleActions}>
            {!currentCycle ? (
              <button
                className={`${styles.button} ${styles.primary}`}
                onClick={handleCreateCycle}
                disabled={isSubmitting || !canManageCycles}
              >
                Iniciar Nuevo Ciclo
              </button>
            ) : (
              <>
                <div className={styles.locationSelector}>
                  <label>Ubicación actual:</label>
                  <select 
                    value={selectedLocation?.id || ''}
                    onChange={(e) => {
                      const locationId = e.target.value;
                      const location = almacenes.find(a => a.id === parseInt(locationId)) ||
                                      almacenes.flatMap(a => a.subniveles || []).find(s => s.id === parseInt(locationId));
                      handleSelectLocation(location);
                    }}
                  >
                    <option value="">Seleccionar ubicación</option>
                    {almacenes.map(almacen => (
                      <optgroup key={almacen.id} label={almacen.nombre}>
                        <option value={almacen.id}>{almacen.nombre}</option>
                        {almacen.subniveles && almacen.subniveles.map(subnivel => (
                          <option key={subnivel.id} value={subnivel.id}>
                            {almacen.nombre} &gt; {subnivel.nombre}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                
                <button
                  className={`${styles.button} ${styles.scan}`}
                  onClick={() => setShowScanModal(true)}
                  disabled={!selectedLocation}
                >
                  Escanear Bolsa
                </button>
                
                <button
                  className={`${styles.button} ${styles.secondary}`}
                  onClick={handleCloseCycle}
                  disabled={isSubmitting || !canManageCycles}
                >
                  Cerrar Ciclo y Generar Reporte
                </button>
                
                <button
                  className={`${styles.button} ${styles.update}`}
                  onClick={handleUpdateLocations}
                  disabled={isSubmitting || !canManageCycles}
                >
                  Actualizar Ubicaciones
                </button>
                
                <button
                  className={`${styles.button} ${styles.detectMissing}`}
                  onClick={() => detectMissingBags(selectedLocation.nombre)}
                  disabled={isSubmitting || !selectedLocation}
                >
                  Detectar Bolsas Faltantes
                </button>
                
                {missingBags.length > 0 && (
                  <button
                    className={`${styles.button} ${styles.exportMissing}`}
                    onClick={handleExportCycleEntries}
                    disabled={isSubmitting}
                  >
                    Exportar Escaneadas y Faltantes
                  </button>
                )}
              </>
            )}
          </div>
          
          {currentCycle && scanEntries.length > 0 && (
            <div className={styles.missingBagsContainer}>
              <h3 className={styles.sectionTitle}>Resultados de Escaneo ({scanEntries.length})</h3>
              <div className={styles.tableContainer}>
                <table className={`${styles.table}`}>
                  <thead>
                    <tr>
                      <th className={styles.tableHeader}>Bolsa</th>
                      <th className={styles.tableHeader}>Ubicación Esperada</th>
                      <th className={styles.tableHeader}>Ubicación Escaneada</th>
                      <th className={styles.tableHeader}>Hora</th>
                      <th className={styles.tableHeader}>Estado</th>
                      <th className={styles.tableHeader}>Cliente</th>
                      <th className={styles.tableHeader}>Contenido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scanEntries.map((entry, index) => {
                      // Determinar la ubicación esperada basada en los detalles de la bolsa
                      let ubicacionEsperada = entry.expected_location_name || "Sin ubicación";
                      let isInCampoNorte = false;
                      let isInBodega = false;
                      
                      // Analizar todos los campos de los detalles de la bolsa
                      if (entry.bagDetails) {
                        const allFields = Object.entries(entry.bagDetails);
                        
                        // Buscar en todos los campos si hay alguno que indique que está en Campo Norte
                        const campoNorteFields = allFields.filter(([key, value]) => 
                          value && typeof value === 'string' && 
                          (value === "Campo Norte" || value.includes("Campo Norte"))
                        );
                        
                        if (campoNorteFields.length > 0) {
                          console.log("Campos que indican Campo Norte:", campoNorteFields);
                          isInCampoNorte = true;
                          ubicacionEsperada = "Campo Norte";
                        }
                        
                        // Buscar en todos los campos si hay alguno que indique que está en Bodega
                        const bodegaFields = allFields.filter(([key, value]) => 
                          value && typeof value === 'string' && 
                          value.startsWith("Bodega")
                        );
                        
                        if (bodegaFields.length > 0 && !isInCampoNorte) {
                          console.log("Campos que indican Bodega:", bodegaFields);
                          isInBodega = true;
                          
                          // Usar el campo más completo para la ubicación
                          const bodegaField = bodegaFields.sort((a, b) => b[1].length - a[1].length)[0];
                          ubicacionEsperada = bodegaField[1];
                        }
                        
                        // Si no se encontró en los campos generales, verificar los campos específicos
                        if (ubicacionEsperada === "Sin ubicación") {
                          // Regla simple: Si area_general comienza con "Bodega", está en bodega
                          if (entry.bagDetails.area_general && entry.bagDetails.area_general.startsWith("Bodega")) {
                            isInBodega = true;
                            
                            // Construir la ruta completa para bodegas
                            let ubicacionCompleta = entry.bagDetails.area_general;
                            
                            if (entry.bagDetails.pasillo) {
                              ubicacionCompleta += ` > ${entry.bagDetails.pasillo}`;
                              
                              if (entry.bagDetails.estante_nivel) {
                                ubicacionCompleta += ` > ${entry.bagDetails.estante_nivel}`;
                                
                                if (entry.bagDetails.nivel) {
                                  ubicacionCompleta += ` > ${entry.bagDetails.nivel}`;
                                }
                              }
                            }
                            
                            ubicacionEsperada = ubicacionCompleta;
                          } 
                          // Si el pasillo es "Campo Norte", está en Campo Norte
                          else if (entry.bagDetails.pasillo === "Campo Norte") {
                            ubicacionEsperada = "Campo Norte";
                            isInCampoNorte = true;
                          }
                          // Si no tiene área general pero tiene código que comienza con CN, está en Campo Norte
                          else if (entry.bagDetails.codigo && entry.bagDetails.codigo.startsWith("CN")) {
                            ubicacionEsperada = "Campo Norte";
                            isInCampoNorte = true;
                          }
                        }
                        
                        // Si después de todo no tenemos una ubicación esperada, usar un valor por defecto
                        if (!ubicacionEsperada || ubicacionEsperada === "") {
                          ubicacionEsperada = "Sin ubicación";
                        }
                        
                        console.log("Ubicación esperada determinada:", ubicacionEsperada);
                      }
                      
                      // Verificar si hay discrepancia
                      let discrepancy = entry.discrepancy;
                      
                      // Si la bolsa está en Campo Norte pero se escanea en Bodega, marcar como discrepancia
                      if (!discrepancy && 
                          isInCampoNorte && 
                          entry.scanned_location_name && 
                          entry.scanned_location_name.startsWith("Bodega")) {
                        discrepancy = true;
                      }
                      // Si la bolsa está en Bodega pero se escanea en Campo Norte, marcar como discrepancia
                      else if (!discrepancy && 
                                  isInBodega && 
                                  (entry.scanned_location_name || `ID: ${entry.scanned_location_id}`) === "Campo Norte") {
                        discrepancy = true;
                      }
                      // Caso 3: Bolsa sin ubicación
                      if (!isInCampoNorte && !isInBodega && entry.expected_location_name === "Sin ubicación") {
                        discrepancy = true;
                      }
                      
                      return (
                        <tr key={index} className={discrepancy ? styles.discrepancy : ''}>
                          <td className={styles.tableCell}>{entry.bag_id}</td>
                          <td className={styles.tableCell}>{ubicacionEsperada}</td>
                          <td className={styles.tableCell}>{entry.scanned_location_name || 'Sin ubicación'}</td>
                          <td className={styles.tableCell}>
                            {entry.timestamp || 
                             (entry.scanned_at ? new Date(entry.scanned_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}) : 
                             new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}))}
                          </td>
                          <td className={`${styles.tableCell} ${discrepancy ? styles.missingStatus : styles.correctStatus}`}>
                            {discrepancy ? '⚠️ Discrepancia' : '✅ Correcto'}
                          </td>
                          <td className={styles.tableCell}>{entry.bagDetails?.cliente || 'Sin cliente'}</td>
                          <td className={styles.tableCell}>{entry.bagDetails?.contenido || 'Sin contenido'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {missingBags.length > 0 && (
            <div className={styles.missingBagsContainer}>
              <h3 className={styles.sectionTitle}>Bolsas Faltantes ({missingBags.length})</h3>
              <p className={styles.warningText}>
                Estas bolsas deberían estar en la ubicación actual pero no fueron escaneadas.
              </p>
              <div className={styles.tableContainer}>
                <table className={`${styles.table}`}>
                  <thead>
                    <tr>
                      <th className={styles.tableHeader}>Bolsa</th>
                      <th className={styles.tableHeader}>Ubicación Esperada</th>
                      <th className={styles.tableHeader}>Ubicación Escaneada</th>
                      <th className={styles.tableHeader}>Hora</th>
                      <th className={styles.tableHeader}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {missingBags.map((bag, index) => {
                      // Determinar la ubicación esperada
                      let ubicacionEsperada = bag.ubicacion_nombre || "Sin ubicación";
                      
                      // Si no tiene ubicación explícita, usar las reglas de negocio
                      if (ubicacionEsperada === "Sin ubicación") {
                        // Regla 1: Si area_general comienza con "Bodega", está en bodega
                        if (bag.area_general && bag.area_general.startsWith("Bodega")) {
                          ubicacionEsperada = bag.area_general;
                        } 
                        // Regla 2: Si el pasillo es "Campo Norte", está en Campo Norte
                        else if (bag.pasillo === "Campo Norte") {
                          ubicacionEsperada = "Campo Norte";
                        }
                        // Regla 3: Si el código comienza con CN, está en Campo Norte
                        else if (bag.codigo && bag.codigo.startsWith("CN")) {
                          ubicacionEsperada = "Campo Norte";
                        }
                      }
                      
                      // Obtener la hora actual para mostrar
                      const now = new Date();
                      const hora = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                      
                      return (
                        <tr key={index} className={styles.missingRow}>
                          <td className={styles.tableCell}>{bag.id}</td>
                          <td className={styles.tableCell}>{ubicacionEsperada}</td>
                          <td className={styles.tableCell}>Sin escanear</td>
                          <td className={styles.tableCell}>{hora}</td>
                          <td className={`${styles.tableCell} ${styles.missingStatus}`}>❌ No escaneada</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        
        <div className={styles.divider}></div>
        
        <div className={styles.exportSection}>
          <div className={styles.sectionTitle}>
            <h2>Exportación de Inventario</h2>
          </div>
          
          <button
            className={`${styles.button} ${styles.btnFullWidth} ${styles.export}`}
            onClick={handleExportar}
            disabled={isSubmitting || loadingAlmacenes || almacenes.length === 0 || loading}
            title={almacenes.length === 0 ? "No hay almacenes para exportar" : "Exportar inventario a Excel"}
          >
            {isSubmitting ? `Exportando... ${exportProgress}%` : "Exportar Auditoría"}
          </button>
          
          {/* Barra de progreso para exportación */}
          {exportProgress > 0 && (
            <div className={styles.progressContainer}>
              <div 
                className={styles.progressBar} 
                style={{ width: `${exportProgress}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal para escaneo de QR */}
      {showScanModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Escanear Bolsa</h2>
              <button 
                className={styles.closeButton}
                onClick={() => setShowScanModal(false)}
              >
                &times;
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>Ubicación seleccionada: <strong>{selectedLocation?.nombre || 'Ninguna'}</strong></p>
              
              {/* Aquí iría el componente de escaneo de QR */}
              <div className={styles.qrScanner}>
                <input
                  type="text"
                  placeholder="Código de bolsa (simular escaneo)"
                  className={styles.qrInput}
                  onChange={(e) => setScannedBag(e.target.value)}
                  value={scannedBag || ''}
                />
                <button
                  className={`${styles.button} ${styles.primary}`}
                  onClick={() => {
                    if (scannedBag) {
                      handleScan(scannedBag);
                      setScannedBag('');
                    }
                  }}
                  disabled={!scannedBag || scanStatus === 'scanning'}
                >
                  {scanStatus === 'scanning' ? 'Escaneando...' : 'Simular Escaneo'}
                </button>
              </div>
              
              <div className={styles.scanStatusIndicator}>
                {scanStatus === 'success' && <span className={styles.success}>✅ Escaneo exitoso</span>}
                {scanStatus === 'error' && <span className={styles.error}>❌ Error en escaneo</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </Screen>
  );
}

// Función auxiliar para extraer números de una cadena
function extraerNumero(cadena) {
  const regex = /\d+/g;
  const match = cadena.match(regex);
  return match && match[0] ? parseInt(match[0]) : null;
}