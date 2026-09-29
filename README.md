# Especificación del Proyecto: Dashboard de Modelos de IA

## 1. Petición Inicial (Departamento de Diseño)

> **De:** Departamento de Diseño  
> **Asunto:** Dashboard de modelos de IA  
>
> Necesitamos un dashboard interno para poder comparar los distintos modelos de lenguaje que estamos evaluando para el equipo. Ahora mismo cada uno mira los precios y las métricas en sitios distintos y perdemos mucho tiempo. 
>
> La idea es tener de un vistazo los modelos *open source* más relevantes del momento, con la info que más nos importa a la hora de decidir cuál usar: 
> - Cuánto cuesta usarlos (tanto lo que enviamos como lo que nos devuelven).
> - Qué tan rápido empiezan a responder (TTFT).
> - Qué tipo de contenido aceptan y devuelven (texto, imágenes...).
> - Cuánto los está consumiendo el equipo ahora mismo (diario y semanal).
>
> De momento, con datos de prueba nos vale para validar que el diseño y la idea funcionan (conectaremos los datos reales más adelante). Queremos una tabla sencilla: nada de librerías ni frameworks, solo HTML, CSS y JS plano.
> 
> ¡Gracias!

---

## 2. Instrucciones Generales

* **Repositorio:** Clonar el repositorio asignado.
* **Datos de prueba:** Utilizar exclusivamente los datos alojados en `mock-data.json` (cargados vía `fetch`).
* **Restricción global:** No se fusionará nada a la rama principal (`main`/`master` original del repositorio).
* **Alcance:** Es indispensable cumplir todos los requerimientos técnicos y funcionales antes de dar una tarea por finalizada.
* **Desarrollo:** Las especificaciones de integraran y desarrollaran una por una de manera incremental.
---

## 3. Flujo de Git: Feature Branching

Todo el trabajo debe estructurarse bajo el prefijo `nombre.apellido` de cada desarrollador:

1. **Rama Base (Master personal):**
   * Crear la rama: `nombre.apellido.master`
2. **Rama de Integración (Develop personal):**
   * Crear la rama: `nombre.apellido.develop` (nace de tu rama master).
3. **Ramas de Funcionalidad (Features):**
   * Convención: `feature.nombre.apellido/<nombre-feature>`  
   * *Ejemplo:* `feature.mikel.diez/mi-feature-lol`

> **Regla de entrega:** Las *features* deben implementarse de forma **secuencial** (una por una). No se iniciará la siguiente hasta que la anterior esté finalizada e integrada en tu rama `develop`.

---

## 4. Fases de Desarrollo (Evolutivos)

### Feature 1: Ordenación y Filtros

> **Asunto:** Feature 1 – Ordenación y filtros
>
> Toca avanzar con la siguiente parte del dashboard: necesitamos meter ordenación y filtros a la tabla que ya tenemos.
>
> - **Ordenación:** Que se pueda ordenar por cualquier columna haciendo clic en su cabecera, alternando entre ascendente y descendente.
> - **Filtros:** Poder filtrar las filas por el nombre del modelo y por la modalidad (tanto de entrada como de salida).
>
> *Condición técnica:* Sin librerías externas (JavaScript puro) y sin tests.

---

### Feature 2: Visualizaciones y Gráficas

> **Asunto:** Feature 2 – Gráficas
>
> Queremos meter ahora la parte visual justo encima de la tabla para comparar los modelos de un vistazo.
>
> - **Gráfico de barras:** Comparar precios de token de entrada y salida entre los 10 modelos.
> - **Sparklines o barras:** Mostrar el consumo de tokens (entrada y salida) a nivel diario y semanal.
>
> *Condición técnica:* Implementación nativa con **Canvas** o **SVG** (sin Chart.js ni librerías similares) y sin tests.

---

### Feature 3: Vista de Detalle

> **Asunto:** Feature 3 – Vista extendida
>
> Añadir una vista de detalle por modelo: al hacer clic en cualquier fila de la tabla, debe abrirse un panel lateral o modal con:
>
> - Todas las métricas del modelo en formato extendido.
> - Gráficas individuales específicas de dicho modelo.
>
> *Condición técnica:* Todo nativo, sin dependencias externas y sin tests.

---

# Notas del proyecto (openspec-token-dashboard-demo)

Dashboard de comparación de modelos de lenguaje: precios, latencia (TTFT),
modalidad y volumen de tokens (día/semana), con costes derivados.

Hecho con **HTML, CSS y JavaScript puros** — sin librerías, sin build, sin dependencias.

## Cómo abrirlo

`fetch()` no funciona con `file://`, asíque sirve el directorio por HTTP:

```bash
python3 -m http.server
# abre http://localhost:8000/
```

## Estructura de ramas (nomenclatura de la organización)

```
alain.vallecillos.master     scaffold del curso + estas notas
  |
  +-- alain.vallecillos.develop   + .gitignore, openspec/ (planificación), .opencode/
        |
        +-- feature.alain.vallecillos/token-dashboard-demo
                                 + el proyecto: index.html, style.css, app.js, mock-data.json
```

## Gestión del cambio

Planificación con [OpenSpec](https://openspec.org): los cambios viven en
`openspec/changes/` (ver `add-token-dashboard`).
