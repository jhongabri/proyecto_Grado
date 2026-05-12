const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.generateChildSummary = async (childData, evaluationData) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
      Eres un experto en pedagogía infantil de un Centro de Desarrollo Infantil (CDI) en Colombia.
      Tu tarea es escribir un resumen cálido, profesional y motivador para los padres de un niño basado en su última evaluación.

      DATOS DEL NIÑO:
      - Nombre: ${childData.nombres}
      - Edad aproximada: ${childData.edad} años

      RESULTADOS DE LA EVALUACIÓN (Escala de 1 a 5):
      - Dimensión Comunicativa: ${evaluationData.comunicativa}
      - Dimensión Cognitiva: ${evaluationData.cognitiva}
      - Dimensión Socioafectiva: ${evaluationData.socioafectiva}
      - Dimensión Corporal: ${evaluationData.corporal}
      - Dimensión Artística: ${evaluationData.artistica}
      - Dimensión Autonomía: ${evaluationData.autonomia}
      
      OBSERVACIÓN GENERAL DEL DOCENTE:
      "${evaluationData.observacion_general || 'Sin observaciones específicas'}"

      INSTRUCCIONES PARA EL RESUMEN:
      1. Usa un lenguaje amable y positivo.
      2. Empieza saludando a los padres y mencionando algo positivo del niño.
      3. Analiza brevemente las dimensiones más altas como fortalezas.
      4. Si hay dimensiones bajas (3 o menos), menciónalas como "áreas de oportunidad para explorar juntos" de forma constructiva.
      5. Termina con un consejo práctico y sencillo para que los padres hagan en casa esta semana.
      6. El resumen debe ser conciso (máximo 3 párrafos cortos).
      7. Usa un tono que inspire confianza y amor por el desarrollo del niño.

      Escribe el resumen en español:
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Detailed AI Error:", error);
    // Extraer mensaje específico si viene de la API de Google
    const errorMessage = error.response?.data?.error?.message || error.message;
    throw new Error(`Error de IA: ${errorMessage}`);
  }
};

exports.generateTeacherSuggestions = async (childData, evaluationData) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
      Eres un asesor pedagógico experto para docentes de primera infancia (niños de 0 a 5 años). 
      Tu objetivo es analizar los resultados de la evaluación de un niño y proponer estrategias de fortalecimiento.

      Datos del niño:
      - Nombre: ${childData.nombres} ${childData.apellidos}
      - Edad: ${childData.edad_calculada} años

      Resultados de la evaluación (Escala 1.0 a 4.0):
      - Comunicativa: ${evaluationData.comunicativa}
      - Cognitiva: ${evaluationData.cognitiva}
      - Socio-afectiva: ${evaluationData.socioafectiva}
      - Corporal: ${evaluationData.corporal}
      - Artística: ${evaluationData.artistica}
      - Autonomía: ${evaluationData.autonomia}

      TAREA:
      1. Identifica las 2 dimensiones con puntaje más bajo.
      2. Propón 3 actividades pedagógicas creativas, lúdicas y de bajo costo que el docente pueda realizar EN EL AULA para fortalecer esas áreas.
      3. Las actividades deben ser apropiadas para su edad (${childData.edad_calculada} años).
      4. Estilo: Profesional, inspirador y directo al punto.
      5. Formato: Empieza directamente con el análisis y las actividades. Máximo 250 palabras. Usa viñetas.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating teacher suggestions:", error);
    throw error;
  }
};

exports.analyzeReport = async (reportData) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
      Eres un consultor administrativo experto para un Centro de Desarrollo Infantil (CDI). 
      Tu tarea es analizar un reporte enviado por un docente y dar un resumen ejecutivo junto con recomendaciones de acción.

      Detalles del Reporte:
      - Título: ${reportData.titulo}
      - Tipo: ${reportData.tipo}
      - Descripción: ${reportData.descripcion}
      - Docente: ${reportData.docente_nombre}

      POR FAVOR ENTREGA:
      1. RESUMEN: Un resumen de 1 oración sobre la esencia del problema.
      2. GRAVEDAD: Clasifica el problema como (Baja, Media, Alta o Crítica) y justifica por qué.
      3. ACCIONES RECOMENDADAS: 3 pasos concretos que el administrador debe tomar para resolver o dar seguimiento a este reporte.
      
      Estilo: Ejecutivo, directo y profesional. Usa viñetas. Máximo 150 palabras.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error analyzing report:", error);
    throw error;
  }
};
