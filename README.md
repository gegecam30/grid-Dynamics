# ⚡ Grid Dynamics — Simulador de Microrredes Eléctricas

<p align="center">
  <em>Herramienta de simulación web con estética Cyberpunk/Pixel-Art para la planificación y optimización de microrredes energéticas.</em>
</p>

---

## 📖 Descripción General

**Grid Dynamics** es una plataforma GreenTech diseñada para democratizar el acceso a herramientas de análisis energético. Permite a ingenieros, consultores y juntas vecinales modelar, simular y optimizar redes eléctricas sostenibles antes de realizar inversiones físicas.

A través de una interfaz visual interactiva basada en nodos (Drag & Drop), los usuarios pueden diseñar la topología de un barrio, configurar parámetros eléctricos precisos y ejecutar simulaciones de flujo de potencia para tomar decisiones basadas en datos empíricos.

### ✨ Características Principales

* **Editor Visual (Canvas):** Diseño de topologías de red arrastrando componentes (Viviendas, Paneles Solares, Baterías, Transformadores).
* **Simulación Dinámica:** Evaluación del comportamiento energético en intervalos de tiempo (requiere conexión al backend).
* **Dashboard Analítico:** Visualización de KPIs (Eficiencia, Ahorro, Reducción de CO₂) mediante gráficos interactivos (Chart.js).
* **Alertas Inteligentes:** Detección de ineficiencias (pérdidas de energía, sobredimensionamiento) con recomendaciones automáticas.
* **Gestión de Proyectos:** Guardado, exportación e importación (JSON) de configuraciones de red.

---

## 🎨 Estética y Diseño (UI/UX)

La plataforma utiliza una interfaz inmersiva inspirada en conceptos **Cyberpunk** y **Glassmorphism**, alejándose de los paneles genéricos.

* **Paleta de Colores:** Tema oscuro profundo (`#050a0d`) con acentos neón en Cyan (`#00e5ff`) y detalles funcionales en colores semafóricos.
* **Tipografía:** Combinación técnica usando `Rajdhani` y `Share Tech Mono`.
* **Iconografía:** Uso de [Lucide Icons](https://lucide.dev/) para mantener un aspecto minimalista y profesional.

---

## 🚀 Guía de Uso (Frontend)

Este repositorio contiene la estructura del cliente web (HTML, CSS, JS puro).

### Requisitos Previos

Dado que el proyecto utiliza módulos estándar de la web moderna (ES6+), **debe ejecutarse en un entorno de servidor local**. Abrir los archivos HTML directamente (`file://`) puede causar errores de CORS, especialmente en la carga de módulos o fetches simulados.

### Instalación y Ejecución

1.  **Clonar el repositorio:**
    ```bash
    git clone [https://github.com/gegecam30/grid-dynamics.git](https://github.com/gegecam30/grid-dynamics.git)
    cd grid-dynamics
    ```

2.  **Iniciar un servidor local:**
    Puedes usar herramientas rápidas como Live Server (extensión de VS Code), Python, o Node.js.
    * *Opción 1 (Python 3):*
        ```bash
        python -m http.server 3000
        ```
    * *Opción 2 (Node / npx):*
        ```bash
        npx serve .
        ```

3.  **Acceso:** Abre tu navegador y dirígete a `http://localhost:3000/pages/login.html` (o el puerto configurado).

### ¿Cómo interactuar con la aplicación?

1.  **Login:** Ingresa credenciales mockeadas o selecciona un perfil predefinido para acceder al Dashboard.
2.  **Crear Proyecto:** En el Dashboard, haz clic en "Nuevo Proyecto".
3.  **Editor de Topología (`editor.html`):**
    * Arrastra componentes desde el panel izquierdo hacia el lienzo central.
    * Selecciona un componente en el lienzo para editar sus propiedades (Capacidad, Costo, Consumo) en el panel derecho.
    * Usa la herramienta "Conectar nodos" en la barra de herramientas superior del lienzo para enlazar componentes.
    * Guarda o Exporta la topología.
4.  **Simular (`simulate.html`):** Selecciona el proyecto, define la duración, el tipo de demanda y presiona "Simular" para procesar el flujo.
5.  **Resultados (`results.html`):** Analiza las gráficas de generación vs. consumo y revisa las recomendaciones generadas.

---

## 🛠️ Tecnologías Utilizadas

* **HTML5 / CSS3:** Maquetación semántica, variables nativas (`:root`), Grid y Flexbox.
* **Vanilla JavaScript (ES6+):** Lógica del editor en Canvas 2D, manejo de estado y consumo de APIs (mockeadas).
* **Chart.js:** Renderizado de gráficos de datos.
* **Lucide Icons:** Biblioteca de iconografía vectorial ligera.

---

> **Nota para el equipo de desarrollo:** Actualmente, la aplicación web funciona con un sistema de `mocking` (`js/mock.js`) que simula las respuestas del backend. Para integración real, modificar las constantes en `js/config.js` para que apunten a los endpoints de la API REST de producción.
