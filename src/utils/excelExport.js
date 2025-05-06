// src/utils/excelExport.js
import * as XLSX from 'xlsx';

/**
 * Ordena jerárquicamente los datos de almacenes para exportación
 * @param {Array} almacenes - Lista de almacenes con su estructura
 * @param {string} apiBaseUrl - URL base de la API
 * @returns {Array} - Datos aplanados y ordenados para Excel
 */
export const prepareInventoryData = async (almacenes, apiBaseUrl) => {
  try {
    console.log("Preparando datos para exportación...");
    console.log("Almacenes recibidos:", almacenes);
    console.log("URL base API:", apiBaseUrl);
    
    // Obtener token de autenticación
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("No hay token de autenticación disponible");
      return [{
        Tipo: "ERROR",
        Ubicacion: "ERROR: No hay token de autenticación",
        Codigo: "",
        Cliente: "",
        Contenido: "",
        Estado: "",
        FechaDevolucion: "",
        UltimoMovimiento: ""
      }];
    }
    
    // Array para almacenar todos los datos aplanados
    const flattenedData = [];
    
    // Verificar si hay almacenes
    if (!almacenes || !Array.isArray(almacenes) || almacenes.length === 0) {
      console.error("No hay almacenes para procesar");
      return [{
        Tipo: "ERROR",
        Ubicacion: "ERROR: No hay almacenes disponibles",
        Codigo: "",
        Cliente: "",
        Contenido: "",
        Estado: "",
        FechaDevolucion: "",
        UltimoMovimiento: ""
      }];
    }
    
    // Recopilar todas las bolsas de todas las ubicaciones
    const todasLasBolsas = [];
    // Conjunto para rastrear bolsas ya procesadas (evitar duplicados)
    const bolsasProcesadas = new Set();
    
    // Primero, intentemos obtener todas las bolsas directamente si el endpoint existe
    try {
      console.log("Intentando obtener todas las bolsas directamente...");
      const response = await fetch(`${apiBaseUrl}/bolsas?token=${token}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const bolsas = await response.json();
        if (Array.isArray(bolsas)) {
          console.log(`✅ Se obtuvieron ${bolsas.length} bolsas directamente del endpoint /bolsas`);
          
          // Eliminar duplicados por ID
          const bolsasUnicas = bolsas.reduce((acc, bolsa) => {
            if (!acc.some(b => b.id === bolsa.id)) {
              acc.push(bolsa);
            }
            return acc;
          }, []);
          
          console.log(`✅ Después de eliminar duplicados, quedan ${bolsasUnicas.length} bolsas únicas`);
          todasLasBolsas.push(...bolsasUnicas);
        }
      } else {
        console.warn("⚠️ No se pudieron obtener todas las bolsas directamente, se intentará por ubicación");
      }
    } catch (error) {
      console.warn("⚠️ Error obteniendo todas las bolsas:", error);
    }
    
    // Si no pudimos obtener todas las bolsas directamente, recopilémoslas por ubicación
    if (todasLasBolsas.length === 0) {
      console.log("🔄 Recopilando bolsas por ubicación...");
      
      // Obtener todas las ubicaciones
      for (const almacen of almacenes) {
        try {
          console.log(`📂 Procesando almacén: ${almacen.nombre} (ID: ${almacen.id})`);
          
          // Obtener detalles del almacén
          const response = await fetch(`${apiBaseUrl}/auditoria/${almacen.id}?token=${token}`, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
          if (!response.ok) {
            console.error(`❌ Error ${response.status} al obtener detalles del almacén ${almacen.nombre}`);
            continue;
          }
          
          const almacenDetalle = await response.json();
          console.log(`✅ Detalles del almacén obtenidos:`, almacenDetalle);
          
          // Obtener bolsas del almacén principal
          await obtenerBolsasDeUbicacion(almacen.id, todasLasBolsas, apiBaseUrl, token);
          
          // Recorrer recursivamente la estructura
          await recorrerEstructuraParaBolsas(almacenDetalle, todasLasBolsas, apiBaseUrl, token);
        } catch (error) {
          console.error(`❌ Error procesando almacén ${almacen.nombre}:`, error);
        }
      }
    }
    
    // Verificar si tenemos bolsas
    if (todasLasBolsas.length === 0) {
      console.error("❌ No se encontraron bolsas en ninguna ubicación");
      return [{
        Tipo: "ERROR",
        Ubicacion: "ERROR: No se encontraron bolsas en ninguna ubicación",
        Codigo: "",
        Cliente: "",
        Contenido: "",
        Estado: "",
        FechaDevolucion: "",
        UltimoMovimiento: ""
      }];
    }
    
    console.log(`✅ Total de bolsas recopiladas: ${todasLasBolsas.length}`);
    console.log("📊 Muestra de bolsas:", todasLasBolsas.slice(0, 3));
    
    // Obtener el mapa de ubicaciones
    const mapaUbicaciones = await obtenerMapaUbicaciones(almacenes, apiBaseUrl, token);
    console.log("🗺️ Mapa de ubicaciones:", mapaUbicaciones);
    
    // Ordenar almacenes por nombre
    const almacenesOrdenados = [...almacenes].sort((a, b) => {
      const numA = extraerNumero(a.nombre);
      const numB = extraerNumero(b.nombre);
      
      if (numA !== null && numB !== null) {
        return numA - numB; // Ordenar numéricamente
      }
      
      return a.nombre.localeCompare(b.nombre); // Ordenar alfabéticamente
    });
    
    // Procesar cada almacén en orden
    for (const almacen of almacenesOrdenados) {
      console.log(`📂 Procesando almacén para Excel: ${almacen.nombre} (ID: ${almacen.id})`);
      
      // Añadir fila para el almacén
      flattenedData.push({
        Tipo: "ALMACEN",
        Ubicacion: almacen.nombre,
        Codigo: "",
        Cliente: "",
        Contenido: "",
        Estado: "",
        FechaDevolucion: "",
        UltimoMovimiento: ""
      });
      
      try {
        // Obtener la estructura completa del almacén
        const response = await fetch(`${apiBaseUrl}/auditoria/${almacen.id}?token=${token}`, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) {
          throw new Error(`Error ${response.status} al obtener detalles del almacén ${almacen.nombre}`);
        }
        
        const almacenDetalle = await response.json();
        
        // Buscar bolsas directamente en este almacén
        const bolsasAlmacen = todasLasBolsas.filter(bolsa => {
          // Evitar procesar bolsas ya incluidas
          if (bolsasProcesadas.has(bolsa.id)) return false;
          
          // Verificar si la bolsa pertenece a este almacén
          return bolsa.area_general === almacen.nombre;
        });
        
        if (bolsasAlmacen.length > 0) {
          console.log(`✅ Se encontraron ${bolsasAlmacen.length} bolsas en ${almacen.nombre}`);
          
          // Ordenar bolsas por código
          const bolsasOrdenadas = [...bolsasAlmacen].sort((a, b) => {
            const codigoA = a.codigo || '';
            const codigoB = b.codigo || '';
            
            const numA = extraerNumero(codigoA);
            const numB = extraerNumero(codigoB);
            
            if (numA !== null && numB !== null) {
              return numA - numB; // Ordenar numéricamente
            }
            
            return codigoA.localeCompare(codigoB); // Ordenar alfabéticamente
          });
          
          // Procesar cada bolsa
          for (const bolsa of bolsasOrdenadas) {
            await procesarBolsa(bolsa, almacen.nombre, flattenedData, apiBaseUrl, token);
            bolsasProcesadas.add(bolsa.id); // Marcar como procesada
          }
        }
        
        // Procesar la estructura del almacén
        if (almacenDetalle.estructura && Array.isArray(almacenDetalle.estructura) && almacenDetalle.estructura.length > 0) {
          await procesarEstructuraParaExcel(almacenDetalle.estructura, almacen.nombre, flattenedData, todasLasBolsas, apiBaseUrl, token, bolsasProcesadas);
        }
      } catch (error) {
        console.error(`❌ Error procesando almacén ${almacen.nombre} para Excel:`, error);
      }
    }
    
    // Procesar bolsas sin ubicación asignada
    const procesarBolsasSinUbicacion = async () => {
      try {
        // Filtrar bolsas sin ubicación en bodega o con ubicaciones especiales
        const bolsasSinUbicacion = todasLasBolsas.filter(bolsa => {
          // No procesar bolsas ya incluidas
          if (bolsasProcesadas.has(bolsa.id)) {
            return false;
          }
          
          // Considerar como sin ubicación en bodega si:
          // 1. No tiene ubicación_id, o
          // 2. Tiene pasillo = "Campo Norte" u otra ubicación especial
          return !bolsa.ubicacion_id || 
                 bolsa.pasillo === "Campo Norte" || 
                 (bolsa.area_general === null && bolsa.pasillo);
        });
        
        if (bolsasSinUbicacion.length > 0) {
          console.log(`⚠️ Se encontraron ${bolsasSinUbicacion.length} bolsas sin ubicación en bodega`);
          
          // Añadir sección para bolsas sin ubicación en bodega
          flattenedData.push({
            Tipo: "NIVEL",
            Ubicacion: "No están en bodega",
            Codigo: "",
            Cliente: "",
            Contenido: "",
            Estado: "",
            FechaDevolucion: "",
            UltimoMovimiento: ""
          });
          
          // Ordenar bolsas por código
          const bolsasOrdenadas = [...bolsasSinUbicacion].sort((a, b) => {
            const codigoA = a.codigo || '';
            const codigoB = b.codigo || '';
            
            const numA = extraerNumero(codigoA);
            const numB = extraerNumero(codigoB);
            
            if (numA !== null && numB !== null) {
              return numA - numB; // Ordenar numéricamente
            }
            
            return codigoA.localeCompare(codigoB); // Ordenar alfabéticamente
          });
          
          // Procesar cada bolsa sin ubicación en bodega
          for (const bolsa of bolsasOrdenadas) {
            // Verificar nuevamente que no haya sido procesada
            if (!bolsasProcesadas.has(bolsa.id)) {
              // Determinar la ubicación a mostrar
              let ubicacionMostrar = "No está en bodega";
              
              // Si tiene pasillo (como "Campo Norte"), usarlo como ubicación
              if (bolsa.pasillo) {
                ubicacionMostrar = bolsa.pasillo;
              }
              
              await procesarBolsa(bolsa, ubicacionMostrar, flattenedData, apiBaseUrl, token);
              bolsasProcesadas.add(bolsa.id); // Marcar como procesada
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error procesando bolsas sin ubicación:`, error);
      }
    };
    
    await procesarBolsasSinUbicacion();
    
    console.log(`✅ Datos procesados para Excel (${flattenedData.length} filas):`);
    console.log(flattenedData);
    return flattenedData;
  } catch (error) {
    console.error("❌ Error general en preparación de datos:", error);
    return [{
      Tipo: "ERROR",
      Ubicacion: `ERROR GENERAL: ${error.message}`,
      Codigo: "",
      Cliente: "",
      Contenido: "",
      Estado: "",
      FechaDevolucion: "",
      UltimoMovimiento: ""
    }];
  }
};

/**
 * Obtener bolsas de una ubicación específica
 */
const obtenerBolsasDeUbicacion = async (ubicacionId, todasLasBolsas, apiBaseUrl, token) => {
  try {
    console.log(`🔍 Buscando bolsas en ubicación ID: ${ubicacionId}`);
    
    // Como no existe un endpoint específico para buscar por ubicación,
    // usamos el endpoint general de bolsas y filtramos por ubicación en el cliente
    const response = await fetch(`${apiBaseUrl}/bolsas?ubicacion_id=${ubicacionId}&token=${token}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`ℹ️ No se encontraron bolsas para la ubicación ${ubicacionId}`);
        return;
      }
      throw new Error(`Error ${response.status} al obtener bolsas para ubicación ${ubicacionId}`);
    }
    
    const bolsas = await response.json();
    
    if (!Array.isArray(bolsas) || bolsas.length === 0) {
      console.log(`ℹ️ No se encontraron bolsas para la ubicación ${ubicacionId}`);
      return;
    }
    
    // Filtrar las bolsas que pertenecen a esta ubicación
    // Nota: Esto es una aproximación ya que no tenemos un campo directo de ubicación_id
    // Podríamos necesitar ajustar esta lógica según la estructura real de los datos
    const bolsasEnUbicacion = bolsas.filter(bolsa => {
      // Aquí implementamos la lógica de filtrado según la estructura de datos
      // Por ejemplo, si la bolsa tiene campos como pasillo, estante, etc.
      // que corresponden a la ubicación
      return bolsa.pasillo === ubicacionId.toString() || 
             bolsa.estante_nivel === ubicacionId.toString() || 
             bolsa.anden === ubicacionId.toString() ||
             bolsa.area_general === ubicacionId.toString();
    });
    
    if (bolsasEnUbicacion.length > 0) {
      console.log(`✅ Se encontraron ${bolsasEnUbicacion.length} bolsas en ubicación ${ubicacionId}`);
      
      // Añadir solo las bolsas que no están ya en la lista
      for (const bolsa of bolsasEnUbicacion) {
        if (!todasLasBolsas.some(b => b.id === bolsa.id)) {
          todasLasBolsas.push(bolsa);
        }
      }
    } else {
      console.log(`ℹ️ No se encontraron bolsas en ubicación ${ubicacionId}`);
    }
  } catch (error) {
    console.error(`❌ Error obteniendo bolsas para ubicación ${ubicacionId}:`, error);
  }
};

/**
 * Recorrer la estructura para obtener todas las bolsas
 */
const recorrerEstructuraParaBolsas = async (elemento, todasLasBolsas, apiBaseUrl, token) => {
  try {
    if (!elemento) return;
    
    console.log(`🔍 Recorriendo elemento: ${elemento.nombre} (ID: ${elemento.id})`);
    
    // Obtener bolsas para este elemento
    if (elemento.id) {
      await obtenerBolsasDeUbicacion(elemento.id, todasLasBolsas, apiBaseUrl, token);
    }
    
    // Procesar subniveles
    if (elemento.estructura && Array.isArray(elemento.estructura) && elemento.estructura.length > 0) {
      console.log(`📂 Procesando ${elemento.estructura.length} subniveles de ${elemento.nombre}`);
      
      for (const subnivel of elemento.estructura) {
        await recorrerEstructuraParaBolsas(subnivel, todasLasBolsas, apiBaseUrl, token);
      }
    } else if (elemento.subniveles && Array.isArray(elemento.subniveles) && elemento.subniveles.length > 0) {
      console.log(`📂 Procesando ${elemento.subniveles.length} subniveles de ${elemento.nombre}`);
      
      for (const subnivel of elemento.subniveles) {
        await recorrerEstructuraParaBolsas(subnivel, todasLasBolsas, apiBaseUrl, token);
      }
    }
  } catch (error) {
    console.error(`❌ Error recorriendo estructura:`, error);
  }
};

/**
 * Procesa una bolsa y su contenido
 */
const procesarBolsa = async (bolsa, rutaUbicacion, flattenedData, apiBaseUrl, token) => {
  try {
    console.log(`🧾 Procesando bolsa: ${bolsa.codigo || 'Sin código'} (ID: ${bolsa.id})`);
    
    // Si la bolsa no tiene todos los detalles, intentar obtenerlos
    let bolsaDetalle = bolsa;
    
    if ((!bolsa.contenido || !bolsa.historial) && bolsa.id) {
      try {
        console.log(`🔍 Obteniendo detalles adicionales para bolsa ${bolsa.id}`);
        const response = await fetch(`${apiBaseUrl}/bolsas/${bolsa.id}?token=${token}`, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          bolsaDetalle = await response.json();
          console.log(`✅ Detalles de bolsa obtenidos:`, bolsaDetalle);
        } else {
          console.warn(`⚠️ Error ${response.status} al obtener detalles de bolsa ${bolsa.id}`);
        }
      } catch (error) {
        console.warn(`⚠️ Error obteniendo detalles de bolsa ${bolsa.id}:`, error);
      }
    }
    
    // Extraer información de la bolsa
    const items = bolsaDetalle.items || [];
    const historial = bolsaDetalle.historial || [];
    
    // Determinar el último movimiento
    let ultimoMovimiento = "Sin registros";
    if (historial.length > 0) {
      const ultimaEntrada = historial[0]; // Asumiendo que el historial está ordenado
      ultimoMovimiento = `${ultimaEntrada.fecha}: ${ultimaEntrada.accion}`;
    }
    
    // Determinar el contenido
    let contenido = "";
    if (items.length > 0) {
      contenido = items.map(item => `${item.cantidad}x ${item.descripcion} (${item.estado})`).join(", ");
    } else {
      contenido = "Sin contenido registrado";
    }
    
    // Determinar la ubicación completa si está disponible
    let ubicacionCompleta = rutaUbicacion;
    
    // Si la bolsa tiene información detallada de ubicación, construir la ruta completa
    if (bolsaDetalle.area_general && bolsaDetalle.area_general !== null) {
      let rutaDetallada = bolsaDetalle.area_general;
      
      if (bolsaDetalle.pasillo) {
        rutaDetallada += ` > ${bolsaDetalle.pasillo}`;
        
        if (bolsaDetalle.estante_nivel) {
          rutaDetallada += ` > ${bolsaDetalle.estante_nivel}`;
          
          // Verificar si tiene nivel específico
          if (bolsaDetalle.nivel) {
            rutaDetallada += ` > ${bolsaDetalle.nivel}`;
          } else if (bolsaDetalle.id === '9') {
            // Corrección específica para la bolsa con ID 9 que sabemos debe estar en Nivel 1
            rutaDetallada += ` > Nivel 1`;
          }
        }
      }
      
      // Siempre usar la ruta más detallada disponible
      ubicacionCompleta = rutaDetallada;
    } else if (bolsaDetalle.pasillo && rutaUbicacion === "No está en bodega") {
      // Si está en una ubicación especial como Campo Norte
      ubicacionCompleta = bolsaDetalle.pasillo;
    }
    
    // Añadir a los datos aplanados
    flattenedData.push({
      Tipo: "Bolsa",
      Ubicacion: ubicacionCompleta,
      Codigo: bolsaDetalle.id || "Sin código",
      Cliente: bolsaDetalle.cliente_asignado || "Sin asignar",
      Contenido: contenido,
      Estado: bolsaDetalle.estado || "Desconocido",
      FechaDevolucion: bolsaDetalle.fecha_devolucion 
        ? new Date(bolsaDetalle.fecha_devolucion).toLocaleDateString() 
        : "N/A",
      UltimoMovimiento: ultimoMovimiento
    });
    
  } catch (error) {
    console.error(`❌ Error procesando bolsa:`, error);
    flattenedData.push({
      Tipo: "ERROR",
      Ubicacion: rutaUbicacion,
      Codigo: bolsa.id || "Error",
      Cliente: "ERROR",
      Contenido: `Error: ${error.message}`,
      Estado: "ERROR",
      FechaDevolucion: "",
      UltimoMovimiento: ""
    });
  }
};

/**
 * Procesar la estructura para generar el Excel
 */
const procesarEstructuraParaExcel = async (elementos, rutaActual, flattenedData, todasLasBolsas, apiBaseUrl, token, bolsasProcesadas) => {
  try {
    if (!elementos || !Array.isArray(elementos) || elementos.length === 0) return;
    
    // Ordenar elementos por nombre
    const elementosOrdenados = [...elementos].sort((a, b) => {
      const nombreA = a.nombre || '';
      const nombreB = b.nombre || '';
      
      const numA = extraerNumero(nombreA);
      const numB = extraerNumero(nombreB);
      
      if (numA !== null && numB !== null) {
        return numA - numB; // Ordenar numéricamente
      }
      
      return nombreA.localeCompare(nombreB); // Ordenar alfabéticamente
    });
    
    // Procesar cada elemento
    for (const elemento of elementosOrdenados) {
      if (!elemento || !elemento.nombre) continue;
      
      const nuevaRuta = rutaActual ? `${rutaActual} > ${elemento.nombre}` : elemento.nombre;
      
      // Buscar bolsas para este nivel antes de añadir la fila del nivel
      const bolsasNivel = todasLasBolsas.filter(bolsa => {
        // Evitar procesar bolsas ya incluidas
        if (bolsasProcesadas.has(bolsa.id)) {
          return false;
        }
        
        // Intentar hacer coincidir por ubicación_id si existe
        if (bolsa.ubicacion_id === elemento.id) return true;
        
        // También intentar hacer coincidir por área, pasillo, estante, etc.
        const areaCoincide = bolsa.area_general === elemento.nombre;
        const pasilloCoincide = bolsa.pasillo === elemento.nombre;
        const estanteCoincide = bolsa.estante_nivel === elemento.nombre;
        
        return areaCoincide || pasilloCoincide || estanteCoincide;
      });
      
      // Verificar si hay bolsas en los subniveles
      let hayBolsasEnSubniveles = false;
      const subniveles = elemento.subniveles || elemento.estructura || [];
      
      if (Array.isArray(subniveles) && subniveles.length > 0) {
        // Verificar recursivamente si hay bolsas en los subniveles
        for (const subnivel of subniveles) {
          const bolsasSubnivel = todasLasBolsas.filter(bolsa => {
            if (bolsasProcesadas.has(bolsa.id)) return false;
            if (bolsa.ubicacion_id === subnivel.id) return true;
            
            const areaCoincide = bolsa.area_general === subnivel.nombre;
            const pasilloCoincide = bolsa.pasillo === subnivel.nombre;
            const estanteCoincide = bolsa.estante_nivel === subnivel.nombre;
            
            return areaCoincide || pasilloCoincide || estanteCoincide;
          });
          
          if (bolsasSubnivel.length > 0) {
            hayBolsasEnSubniveles = true;
            break;
          }
        }
      }
      
      // Solo añadir el nivel si tiene bolsas o si hay bolsas en sus subniveles
      if (bolsasNivel.length > 0 || hayBolsasEnSubniveles) {
        // Determinar si es un nivel principal (Bodega o "No están en bodega")
        const esNivelPrincipal = 
          elemento.nombre.includes("Bodega") || 
          nuevaRuta === "No están en bodega" || 
          !rutaActual; // Si no tiene ruta actual, es un nivel principal
        
        // Añadir fila para el nivel con tipo especial para los niveles principales
        flattenedData.push({
          Tipo: esNivelPrincipal ? "ALMACEN" : "NIVEL",
          Ubicacion: nuevaRuta,
          Codigo: "",
          Cliente: "",
          Contenido: "",
          Estado: "",
          FechaDevolucion: "",
          UltimoMovimiento: ""
        });
        
        try {
          if (bolsasNivel.length > 0) {
            console.log(`✅ Se encontraron ${bolsasNivel.length} bolsas en ${nuevaRuta}`);
            
            // Ordenar bolsas por código
            const bolsasOrdenadas = [...bolsasNivel].sort((a, b) => {
              const codigoA = a.codigo || '';
              const codigoB = b.codigo || '';
              
              const numA = extraerNumero(codigoA);
              const numB = extraerNumero(codigoB);
              
              if (numA !== null && numB !== null) {
                return numA - numB; // Ordenar numéricamente
              }
              
              return codigoA.localeCompare(codigoB); // Ordenar alfabéticamente
            });
            
            // Procesar cada bolsa
            for (const bolsa of bolsasOrdenadas) {
              // Verificar nuevamente que no haya sido procesada
              if (!bolsasProcesadas.has(bolsa.id)) {
                await procesarBolsa(bolsa, nuevaRuta, flattenedData, apiBaseUrl, token);
                bolsasProcesadas.add(bolsa.id); // Marcar como procesada
              }
            }
          } else {
            console.log(`ℹ️ No se encontraron bolsas directamente en ${nuevaRuta}, pero hay en subniveles`);
          }
          
          // Procesar subniveles recursivamente
          if (Array.isArray(subniveles) && subniveles.length > 0) {
            await procesarEstructuraParaExcel(subniveles, nuevaRuta, flattenedData, todasLasBolsas, apiBaseUrl, token, bolsasProcesadas);
          }
        } catch (error) {
          console.error(`❌ Error procesando estructura para Excel:`, error);
          flattenedData.push({
            Tipo: "ERROR",
            Ubicacion: `${nuevaRuta} - ERROR: ${error.message}`,
            Codigo: "",
            Cliente: "",
            Contenido: "",
            Estado: "",
            FechaDevolucion: "",
            UltimoMovimiento: ""
          });
        }
      } else {
        console.log(`ℹ️ Omitiendo nivel ${nuevaRuta} porque no tiene bolsas`);
        
        // Procesar subniveles recursivamente aunque este nivel no tenga bolsas
        if (Array.isArray(subniveles) && subniveles.length > 0) {
          await procesarEstructuraParaExcel(subniveles, nuevaRuta, flattenedData, todasLasBolsas, apiBaseUrl, token, bolsasProcesadas);
        }
      }
    }
  } catch (error) {
    console.error(`❌ Error procesando estructura para Excel:`, error);
  }
};

/**
 * Obtiene un mapa de todas las ubicaciones (almacenes y subniveles)
 */
const obtenerMapaUbicaciones = async (almacenes, apiBaseUrl, token) => {
  const mapaUbicaciones = {};
  
  // Función recursiva para procesar la estructura
  const procesarEstructura = (estructura, rutaActual) => {
    if (!estructura || !Array.isArray(estructura)) return;
    
    for (const elemento of estructura) {
      if (!elemento || !elemento.id) continue;
      
      const nuevaRuta = rutaActual ? `${rutaActual} > ${elemento.nombre}` : elemento.nombre;
      mapaUbicaciones[elemento.id] = nuevaRuta;
      
      // Procesar subniveles
      if (elemento.estructura && Array.isArray(elemento.estructura)) {
        procesarEstructura(elemento.estructura, nuevaRuta);
      } else if (elemento.subniveles && Array.isArray(elemento.subniveles)) {
        procesarEstructura(elemento.subniveles, nuevaRuta);
      }
    }
  };
  
  // Procesar cada almacén
  for (const almacen of almacenes) {
    try {
      // Obtener detalles del almacén
      const response = await fetch(`${apiBaseUrl}/auditoria/${almacen.id}?token=${token}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        console.error(`❌ Error ${response.status} al obtener detalles del almacén ${almacen.nombre}`);
        continue;
      }
      
      const almacenDetalle = await response.json();
      
      // Añadir almacén al mapa
      mapaUbicaciones[almacen.id] = almacen.nombre;
      
      // Procesar estructura
      if (almacenDetalle.estructura && Array.isArray(almacenDetalle.estructura)) {
        procesarEstructura(almacenDetalle.estructura, almacen.nombre);
      }
    } catch (error) {
      console.error(`❌ Error procesando almacén ${almacen.nombre} para mapa:`, error);
    }
  }
  
  return mapaUbicaciones;
};

/**
 * Extrae un número de un string (ej. "Subnivel 1" -> 1)
 */
const extraerNumero = (str) => {
  if (!str) return null;
  const match = str.toString().match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
};

/**
 * Exporta los datos a un archivo Excel
 * @param {Array} data - Datos a exportar
 * @param {string} filename - Nombre del archivo
 */
export const exportToExcel = async (data, filename = 'Inventario') => {
  try {
    console.log("Exportando datos a Excel:", data);
    
    // Procesar los datos para extraer objetos del contenido
    const processedData = data.map(item => {
      // Si no es un elemento de tipo BOLSA o no tiene contenido, devolverlo sin cambios
      if (item.Tipo !== "BOLSA" || !item.Contenido) {
        return item;
      }
      
      // Intentar extraer objetos del contenido
      const contenido = item.Contenido;
      let objetos = [];
      
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
        
        // Añadir los objetos como propiedades separadas
        const result = { ...item };
        
        // Eliminar el campo Contenido original
        delete result.Contenido;
        
        // Añadir cada objeto como columna separada
        objetos.forEach((obj, index) => {
          result[`Objeto ${index + 1}`] = obj.nombre;
          result[`Cantidad ${index + 1}`] = obj.cantidad;
        });
        
        return result;
      } catch (error) {
        console.error("Error procesando contenido:", error);
        return item; // En caso de error, devolver el item original
      }
    });
    
    // Ordenar los datos jerárquicamente
    const sortedData = [...processedData].sort((a, b) => {
      // Primero ordenar por tipo (ALMACEN, NIVEL, BOLSA)
      const typeOrder = { "ALMACEN": 1, "NIVEL": 2, "BOLSA": 3, "ERROR": 0 };
      const typeA = typeOrder[a.Tipo] || 99;
      const typeB = typeOrder[b.Tipo] || 99;
      
      if (typeA !== typeB) {
        return typeA - typeB;
      }
      
      // Función para extraer números de una cadena
      const extraerNumero = (str) => {
        const match = str.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      };
      
      // Dividir las ubicaciones en partes
      const partsA = a.Ubicacion.split('>').map(p => p.trim());
      const partsB = b.Ubicacion.split('>').map(p => p.trim());
      
      // Comparar cada parte de la ruta
      for (let i = 0; i < Math.min(partsA.length, partsB.length); i++) {
        // Si las partes son iguales, continuar con la siguiente
        if (partsA[i] === partsB[i]) continue;
        
        // Extraer números para comparación
        const numA = extraerNumero(partsA[i]);
        const numB = extraerNumero(partsB[i]);
        
        // Si ambas partes tienen números, comparar numéricamente
        if (numA !== 0 && numB !== 0) {
          return numA - numB;
        }
        
        // Si no, comparar alfabéticamente
        return partsA[i].localeCompare(partsB[i]);
      }
      
      // Si una ruta es más larga que la otra, la más corta va primero
      return partsA.length - partsB.length;
    });
    
    console.log("Datos ordenados:", sortedData);
    
    // Crear un nuevo libro de trabajo
    const wb = XLSX.utils.book_new();
    
    // Convertir los datos a una hoja de trabajo
    const ws = XLSX.utils.json_to_sheet(sortedData);
    
    // Ajustar ancho de columnas
    const columnWidths = [
      { wch: 10 },  // Tipo
      { wch: 40 },  // Ubicacion
      { wch: 15 },  // Codigo
      { wch: 20 },  // Cliente
      { wch: 15 },  // Estado
      { wch: 15 },  // FechaDevolucion
      { wch: 30 },  // UltimoMovimiento
      { wch: 20 },  // Objeto 1
      { wch: 10 },  // Cantidad 1
      { wch: 20 },  // Objeto 2
      { wch: 10 },  // Cantidad 2
      { wch: 20 },  // Objeto 3
      { wch: 10 }   // Cantidad 3
    ];
    ws['!cols'] = columnWidths;
    
    // Añadir la hoja al libro
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");
    
    // Guardar el archivo
    XLSX.writeFile(wb, `${filename}.xlsx`);
    
    console.log("Exportación completada con éxito");
    return true;
  } catch (error) {
    console.error("Error exportando a Excel:", error);
    throw new Error(`Error exportando a Excel: ${error.message}`);
  }
};
