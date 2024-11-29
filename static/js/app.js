let questions;
let currentQuestionIndex = 0;
let startTime, endTime;
const answers = [];

// Tabla de definiciones en HTML
const definitionsTableHTML = `
    <div class="table-container">
        <table style="width: 80%; border-collapse: collapse; margin-top: 10px; box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1); border-radius: 8px; overflow: hidden;">
            <thead>
                <tr style="background-color: #333; color: #fff;">
                    <th style="padding: 8px; text-align: left; font-size: 0.9em;">Característica</th>
                    <th style="padding: 8px; text-align: left; font-size: 0.9em;">Descripción</th>
                    <th style="padding: 8px; text-align: left; font-size: 0.9em;">Posibles Valores</th>
                </tr>
            </thead>
            <tbody>
                <tr style="background-color: #f9f9f9;">
                    <td style="padding: 6px; border-bottom: 1px solid #ddd; font-weight: bold; line-height: 1.2;">absences</td>
                    <td style="padding: 6px; border-bottom: 1px solid #ddd; line-height: 1.2;">Número de ausencias escolares del estudiante.</td>
                    <td style="padding: 6px; border-bottom: 1px solid #ddd; line-height: 1.2;">0 a 93</td>
                </tr>
                <tr>
                    <td style="padding: 6px; border-bottom: 1px solid #ddd; font-weight: bold; line-height: 1.2;">goout</td>
                    <td style="padding: 6px; border-bottom: 1px solid #ddd; line-height: 1.2;">Frecuencia con la que el estudiante sale con sus amigos.</td>
                    <td style="padding: 6px; border-bottom: 1px solid #ddd; line-height: 1.2;">1: Muy baja frecuencia, 5: Muy alta frecuencia</td>
                </tr>
                <tr style="background-color: #f9f9f9;">
                    <td style="padding: 6px; border-bottom: 1px solid #ddd; font-weight: bold; line-height: 1.2;">studytime</td>
                    <td style="padding: 6px; border-bottom: 1px solid #ddd; line-height: 1.2;">Tiempo semanal dedicado al estudio fuera de las clases.</td>
                    <td style="padding: 6px; border-bottom: 1px solid #ddd; line-height: 1.2;">1: <2 horas, 2: 2-5 horas, 3: 5-10 horas, 4: >10 horas</td>
                </tr>
                <tr>
                    <td style="padding: 6px; border-bottom: 1px solid #ddd; font-weight: bold; line-height: 1.2;">reason_reputation</td>
                    <td style="padding: 6px; border-bottom: 1px solid #ddd; line-height: 1.2;">Razón principal de elección de la escuela (reputación).</td>
                    <td style="padding: 6px; border-bottom: 1px solid #ddd; line-height: 1.2;">0: No es la razón principal, 1: Es la razón principal</td>
                </tr>
                <tr style="background-color: #f9f9f9;">
                    <td style="padding: 6px; border-bottom: 1px solid #ddd; font-weight: bold; line-height: 1.2;">failures</td>
                    <td style="padding: 6px; border-bottom: 1px solid #ddd; line-height: 1.2;">Número de cursos que el estudiante ha reprobado previamente.</td>
                    <td style="padding: 6px; border-bottom: 1px solid #ddd; line-height: 1.2;">0 a 4</td>
                </tr>
                <tr>
                    <td style="padding: 6px; font-weight: bold; line-height: 1.2;">Fedu</td>
                    <td style="padding: 6px; line-height: 1.2;">Nivel educativo del padre del estudiante.</td>
                    <td style="padding: 6px; line-height: 1.2;">0: Sin educación, 1: Primaria, 2: Secundaria, 3: Universidad, 4: Postgrado o avanzado</td>
                </tr>
            </tbody>
        </table>
    </div>
`;

function updateProgressBar() {
    // Total de preguntas en la lista 'questions'
    const totalQuestions = questions.length;

    const questionsAnswered = currentQuestionIndex;  // Contador de preguntas respondidas
    const currentProgress = (questionsAnswered / totalQuestions) * 100;
    document.getElementById('progress-bar').style.width = currentProgress + '%';
    // Solo incrementar el progreso después de que se responda la primera pregunta
}

// Función para cargar preguntas
function loadQuestion() {
    if (currentQuestionIndex < questions.length) {
        const questionData = questions[currentQuestionIndex];
        showQuestionNumber(questionData.id);
        displayQuestion(questionData);
    } else {
        submitAnswers();
    }
}

// Lista de reglas específicas a resaltar
const highlightedRules = {
    3: ["si failures ≤ 0.50 y reason_reputation > 0.50 y absences ≤ 13.50 entonces Aprobado"],
    5: ["si failures > 0.50 y absences > 1.50 y goout > 2.50 entonces Reprobado"],
    9: ["si failures > 0.50 y absences > 1.50 y goout > 2.50 entonces Reprobado"],
    11: ["si failures > 0.50 y absences > 1.50 y goout > 2.50 entonces Reprobado"],
    15: ["si failures ≤ 0.50 y reason_reputation ≤ 0.50 y Fedu ≤ 1.50 entonces Reprobado"],
    17: ["si failures ≤ 0.50 y reason_reputation ≤ 0.50 y Fedu > 1.50 entonces Aprobado"]
};

function displayQuestion(questionData) {
    const container = document.getElementById('question-container');
    container.innerHTML = ''; // Limpiar la pregunta anterior

    // Actualizar y mostrar el número de la pregunta actual
    showQuestionNumber(questionData.id);

    // Limpiar el contenedor de seguimiento para cada nueva pregunta
    const followUpContainer = document.getElementById('follow-up-container');
    followUpContainer.innerHTML = ''; // Limpia cualquier contenido previo en el contenedor de seguimiento
    followUpContainer.style.display = 'none'; // Oculta el contenedor inicialmente

    // Mostrar instrucciones
    if (questionData.instructions) {
        const instructionsElement = document.createElement('h2');
        instructionsElement.textContent = questionData.instructions;
        container.appendChild(instructionsElement);
    }

    // Mostrar el modelo
    if (questionData.model) {
        const modelElement = document.createElement('p');
        modelElement.textContent = `Modelo ${questionData.model}`;
        container.appendChild(modelElement);
    }

    // Mostrar observación
    if (questionData.observation) {
        const observationText = Object.entries(questionData.observation)
            .map(([key, value]) => `${key} = ${value}`)
            .join(", ");
        const observationElement = document.createElement('p');
        observationElement.textContent = `Observación: ${observationText}`;
        container.appendChild(observationElement);
    }

    // Mostrar tabla de definiciones si es relevante
    if (questionData.category !== 'Preferencias de Visualización' && questionData.category !== 'Pregunta Descriptiva') {
        const definitionsContainer = document.createElement('div');
        definitionsContainer.innerHTML = definitionsTableHTML;
        container.appendChild(definitionsContainer);
    }

    // Mostrar reglas como una lista de elementos solo si el modelo no es IDS o no es de subcategoría Grado Global o Grado Local
    if (questionData.rules && !(questionData.model === 'IDS' && (questionData.sub_category === 'Grado Global' || questionData.sub_category === 'Grado Local'))) {
        const rulesContainer = document.createElement('div');
        rulesContainer.classList.add('rule-container');

        const rulesTitle = document.createElement('strong');
        rulesTitle.textContent = "Reglas:";
        rulesContainer.appendChild(rulesTitle);

        const rulesList = document.createElement('ul');
        questionData.rules.forEach(rule => {
            const ruleItem = document.createElement('li');

            // Verificar si la regla está en las reglas destacadas para esta pregunta
            const currentQuestionHighlights = highlightedRules[questionData.id];
            if (currentQuestionHighlights && currentQuestionHighlights.includes(rule)) {
                ruleItem.style.backgroundColor = 'yellow'; // Resaltar fondo amarillo
                ruleItem.style.fontWeight = 'bold'; // Hacer el texto en negritas para mayor visibilidad
            }

            ruleItem.innerHTML = formatRule(rule);
            rulesList.appendChild(ruleItem);
        });
        rulesContainer.appendChild(rulesList);
        container.appendChild(rulesContainer);
    }

    // Mostrar grafo global o local
    if (questionData.global_graph) {
        const globalGraphElement = document.createElement('p');
        globalGraphElement.textContent = `${questionData.global_graph}`;
        container.appendChild(globalGraphElement);

        // Agregar imagen del grafo global para el modelo DT-InterpretML
        if (questionData.model === 'DT-InterpretML') {
            const graphImage = document.createElement('img');
            graphImage.src = '/static/graphs/interpretml/dt.png'; // Ruta para el grafo de DT-InterpretML
            graphImage.alt = 'Grafo Global del modelo DT-InterpretML';
            graphImage.style.maxWidth = '80%';
            container.appendChild(graphImage);
        }
        
        // Agregar imagen del grafo global para el modelo IDS
        else if (questionData.model === 'IDS') {
            const graphImage = document.createElement('img');
            graphImage.src = '/static/graphs/ids/ids.png'; // Ruta para el grafo de IDS
            graphImage.alt = 'Grafo Global del modelo IDS';
            graphImage.style.maxWidth = '80%';
            container.appendChild(graphImage);
        }

    } else if (questionData.local_graph) {
        const localGraphElement = document.createElement('p');
        localGraphElement.textContent = `${questionData.local_graph}`;
        container.appendChild(localGraphElement);

        // Agregar imagen del grafo local según el modelo y categoría de pregunta
        let localGraphImageSrc = '';
        if (questionData.model === 'DT-InterpretML') {
            if (questionData.category === 'Exactitud') {
                localGraphImageSrc = '/static/graphs/interpretml/local/exactitud.png';
            } else if (questionData.category === 'Ambigüedad') {
                localGraphImageSrc = '/static/graphs/interpretml/local/ambiguedad.png';
            } else if (questionData.category === 'Error') {
                localGraphImageSrc = '/static/graphs/interpretml/local/error.png';
            }
        } else if (questionData.model === 'IDS') {
            if (questionData.category === 'Exactitud') {
                localGraphImageSrc = '/static/graphs/ids/local/exactitud.png';
            } else if (questionData.category === 'Ambigüedad') {
                localGraphImageSrc = '/static/graphs/ids/local/ambiguedad.png';
            } else if (questionData.category === 'Error') {
                localGraphImageSrc = '/static/graphs/ids/local/error.png';
            }
        }

        if (localGraphImageSrc) {
            const graphImage = document.createElement('img');
            graphImage.src = localGraphImageSrc;
            graphImage.alt = `Grafo Local del Modelo ${questionData.model} - ${questionData.category}`;
            graphImage.style.maxWidth = '80%';
            container.appendChild(graphImage);
        }
    }

    // Mostrar predicción del modelo solo si la categoría es de "Error"
    if (questionData.prediction_model && questionData.category === 'Error') {
        const predictionElement = document.createElement('p');
        const modelPrediction = questionData.prediction_model[questionData.model];
        predictionElement.innerHTML = `Predicción del modelo (<strong>${questionData.model}</strong>): <span style="color: red; font-weight: bold;">${modelPrediction}</span>`;
        container.appendChild(predictionElement);
    }

    // Si es una pregunta descriptiva, mostrar un campo de texto
    if (questionData.category === "Pregunta Descriptiva") {
        const answerInput = document.createElement('textarea');
        answerInput.setAttribute('placeholder', 'Explica tu respuesta aquí...');
        answerInput.setAttribute('rows', '5');
        answerInput.setAttribute('cols', '50');
        answerInput.style.width = '95%';
        container.appendChild(answerInput);

        // Mostrar el botón "Siguiente" solo cuando haya texto
        document.getElementById('next-question-btn').style.display = 'none';
        answerInput.addEventListener('input', function () {
            if (answerInput.value.trim() !== '') {
                document.getElementById('next-question-btn').style.display = 'block';
            } else {
                document.getElementById('next-question-btn').style.display = 'none';
            }
        });

        // Guardar la respuesta de texto cuando el usuario haga clic en "Siguiente"
        document.getElementById('next-question-btn').onclick = function () {
            endTime = new Date().getTime();
            const responseTime = endTime - startTime;

            answers.push({
                question: questionData.instructions,
                answer: answerInput.value,
                time: responseTime
            });

            currentQuestionIndex++;
            loadQuestion();
        };

        startTime = new Date().getTime();
        return;
    }

    // Configuración de las opciones de respuesta para preguntas no descriptivas
    let options = questionData.answer || ["Aprobado", "Reprobado"]; // Por defecto "Aprobado" y "Reprobado" si `answer` no está definido
    
    const optionsContainer = document.createElement('div');
    optionsContainer.style.display = 'flex';
    optionsContainer.style.justifyContent = 'center';
    optionsContainer.style.gap = '20px';
    optionsContainer.style.flexWrap = 'wrap';

    options.forEach(option => {
        const optionElement = document.createElement('button');
        optionElement.textContent = option;
        optionElement.onclick = () => handleAnswer(option, optionElement);
        optionsContainer.appendChild(optionElement);
    });
    container.appendChild(optionsContainer);

    startTime = new Date().getTime();
    document.getElementById('next-question-btn').style.display = 'none';
}

function getVisualizationPath(questionData) {
    if (questionData.visualization) {
        if (questionData.visualization.includes('scikit-learn')) {
            return '/static/graphs/scikit-learn/dt.png';
        } else if (questionData.visualization.includes('InterpretML')) {
            return '/static/graphs/interpretml/dt.png';
        } else if (questionData.visualization.includes('IDS')) {
            return '/static/graphs/ids/ids.png';
        }
    }
    return null;
}

function handleAnswer(answer, optionElement) {
    // Desmarcar todos los botones y marcar el botón seleccionado
    document.querySelectorAll('button').forEach(button => button.classList.remove('selected'));
    optionElement.classList.add('selected');

    const currentQuestionData = questions[currentQuestionIndex];

    if (currentQuestionData) {
        console.log("Seleccionando respuesta para la pregunta ID:", currentQuestionData.id);

        // Buscar si ya existe una respuesta para esta pregunta en `answers`
        const existingAnswerIndex = answers.findIndex(a => a.question_id === currentQuestionData.id);

        if (existingAnswerIndex !== -1) {
            // Si ya existe, actualizamos la respuesta principal sin modificar el tiempo de respuesta
            answers[existingAnswerIndex].answer = answer;
            console.log("Respuesta actualizada:", answer);
        } else {
            // Si no existe, creamos una nueva entrada en `answers`
            answers.push({
                question_id: currentQuestionData.id || currentQuestionIndex + 1,  // Guarda el ID de la pregunta
                question: currentQuestionData.instructions || "",  // Añade el campo 'instructions' como 'question'
                model: currentQuestionData.model || "",
                observation: currentQuestionData.observation || {},
                rules: currentQuestionData.rules || [],
                visualization: currentQuestionData.visualization || "",
                prediction_model: currentQuestionData.prediction_model || "",
                prediction: currentQuestionData.prediction || [],
                answer: answer,  // Respuesta principal
                follow_up_question: currentQuestionData.follow_up ? currentQuestionData.follow_up.question : null,  // Guardar la pregunta de seguimiento, si existe
                follow_up_answer: null  // Inicializar el campo de respuesta de seguimiento como `null`
            });
            console.log("Respuesta guardada:", answer);
        }

        // Manejo de preguntas de seguimiento
        const followUpContainer = document.getElementById('follow-up-container');
        if (currentQuestionData.follow_up && followUpContainer.innerHTML === '') {
            followUpContainer.innerHTML = `<p>${currentQuestionData.follow_up.question}</p>`;
            followUpContainer.style.display = 'block';

            currentQuestionData.follow_up.options.forEach(option => {
                const followUpButton = document.createElement('button');
                followUpButton.textContent = option;
                followUpButton.classList.add('follow-up-option');
                followUpButton.onclick = () => handleFollowUpAnswer(option);
                followUpContainer.appendChild(followUpButton);
            });

            // Ocultar el botón "Siguiente" hasta que se responda la pregunta de seguimiento
            document.getElementById('next-question-btn').style.display = 'none';
        } else if (!currentQuestionData.follow_up) {
            document.getElementById('next-question-btn').style.display = 'block';
        }
        scrollDown();
    } else {
        console.error("Error: currentQuestionData es undefined.");
    }
}

function scrollDown() {
    setTimeout(() => {
        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
        });
    }, 100); // Retraso de 100ms para asegurar que el contenido cambie antes de hacer scroll
}

function scrollUp() {
    setTimeout(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }, 100); 
}

// Función para manejar la respuesta a la pregunta de seguimiento
function handleFollowUpAnswer(followUpAnswer) {
    endTime = new Date().getTime();
    const followUpResponseTime = endTime - startTime;

    const currentQuestionData = questions[currentQuestionIndex];
    const existingAnswer = answers.find(a => a.question_id === currentQuestionData.id);

    if (existingAnswer) {
        // Actualizar la entrada en `answers` para incluir la respuesta de seguimiento y el tiempo de respuesta
        existingAnswer.follow_up_answer = followUpAnswer;
        existingAnswer.follow_up_time = followUpResponseTime;
        console.log("Respuesta de seguimiento guardada:", followUpAnswer);
    } else {
        console.error("Error: No se encontró la respuesta principal para asociar la respuesta de seguimiento.");
    }

    // Marcar visualmente la opción seleccionada en el seguimiento
    document.querySelectorAll('.follow-up-option').forEach(button => button.classList.remove('selected-follow-up'));
    document.querySelectorAll('.follow-up-option').forEach(button => {
        if (button.textContent === followUpAnswer) {
            button.classList.add('selected-follow-up');
        }
    });

    // Mostrar el botón "Siguiente" una vez que se ha respondido la pregunta de seguimiento
    document.getElementById('next-question-btn').style.display = 'block';
    scrollDown();
}

function nextQuestion() {
    endTime = new Date().getTime();  // Captura el tiempo cuando el usuario hace clic en "Siguiente"
    const responseTime = endTime - startTime;  // Calcula el tiempo total de respuesta

    // Almacena la respuesta con el tiempo total de respuesta
    const currentQuestionData = questions[currentQuestionIndex];
    const existingAnswerIndex = answers.findIndex(a => a.question_id === currentQuestionData.id);

    if (existingAnswerIndex !== -1) {
        answers[existingAnswerIndex].time = responseTime;
    } else {
        answers.push({
            question_id: currentQuestionData.id,
            question: currentQuestionData.instructions || "",
            model: currentQuestionData.model || "",
            answer: "",  
            time: responseTime
        });
    }

    // Avanza a la siguiente pregunta
    currentQuestionIndex++;

    if (currentQuestionIndex >= questions.length) {
        submitAnswers();
        return;
    }
    loadQuestion();
    document.getElementById('next-question-btn').style.display = 'none';
    updateProgressBar();
    scrollUp();
}

function loadDescriptiveQuestion() {
    if (currentQuestionIndex < questions[descriptiveQuestionsCategory].length) {
        const questionData = questions[descriptiveQuestionsCategory][currentQuestionIndex];
        const container = document.getElementById('question-container');
        container.innerHTML = '';

        container.style.maxWidth = '95%';

        const questionElement = document.createElement('h2');
        questionElement.textContent = questionData.instructions;
        questionElement.style.textAlign = 'center';
        container.appendChild(questionElement);
        document.querySelector('h1').style.display = 'none';

        const answerInput = document.createElement('textarea');
        answerInput.setAttribute('placeholder', questionData.answer_placeholder || 'Explica tu respuesta aquí...');
        answerInput.setAttribute('rows', '5');
        answerInput.setAttribute('cols', '50');
        container.appendChild(answerInput);

        startTime = new Date().getTime();
        document.getElementById('next-question-btn').style.display = 'none';
        answerInput.addEventListener('input', function () {
            if (answerInput.value.trim() !== '') {
                document.getElementById('next-question-btn').style.display = 'block';
            } else {
                document.getElementById('next-question-btn').style.display = 'none';
            }
        });
        document.getElementById('next-question-btn').onclick = function () {
            endTime = new Date().getTime();
            const responseTime = endTime - startTime;

            answers.push({
                question: questionElement.textContent,
                answer: answerInput.value,
                time: responseTime
            });
            currentQuestionIndex++;
            loadDescriptiveQuestion();
        };
    } else {
        submitAnswers();
    }
}

function submitAnswers() {
    document.getElementById('next-question-btn').style.display = 'none';
    if (answers.length === 0) {
        console.error("No hay respuestas para enviar.");
        return;
    }

    // Reestructuramos cada respuesta en el arreglo `answers` antes de enviarla
    const formattedAnswers = answers.map(answer => ({
        user_id: sessionStorage.getItem('user_id'),  // Validar que el `user_id` esté almacenado en la sesión
        question_id: answer.question_id,  // ID de la pregunta
        question: answer.question,  // Texto de la pregunta
        model: answer.model,  // Modelo utilizado
        answer: answer.answer,  // Respuesta principal del usuario
        follow_up_question: answer.follow_up_question || null,  // Pregunta de seguimiento
        follow_up_answer: answer.follow_up_answer || null,  // Respuesta a la pregunta de seguimiento
        response_time_seconds: answer.time,  // Tiempo de respuesta para la pregunta principal
        follow_up_time_seconds: answer.follow_up_time || null  // Tiempo de respuesta para la pregunta de seguimiento
    }));

    // Enviar las respuestas formateadas al servidor
    fetch('/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedAnswers),
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            document.getElementById('question-container').innerHTML = '<div class="thank-you-message"><p>¡Gracias por completar el cuestionario!</p></div>';

            // Ocultar el número de pregunta si está en la pantalla de agradecimiento
            const questionNumberIndicator = document.getElementById('question-number');
            questionNumberIndicator.style.display = 'none';

            document.querySelector('h1').style.display = 'none';
            updateProgressBar();

        } else {
            console.error('Error:', data.message);
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

document.getElementById('next-question-btn').onclick = nextQuestion;

// Función de inicio de sesión
function login() {
    const enteredKey = document.getElementById('access-key').value;

    // Enviar la clave ingresada al servidor
    fetch('/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: enteredKey })  // Enviar la clave como parte del cuerpo de la solicitud
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Clave de acceso incorrecta.');
        }
        return response.json();  // Convertir la respuesta a JSON
    })
    .then(data => {
        // Manejo de la respuesta según el estado recibido del backend
        if (data.status === "admin") {
            // Acceso como administrador
            document.getElementById('access-container').style.display = 'none';
            document.getElementById('admin-content').style.display = 'block';
            document.querySelector('h1').classList.add('hidden');
            sessionStorage.setItem('admin_logged_in', 'true');
        } else if (data.status === "user") {
            // Acceso como usuario
            document.getElementById('access-container').style.display = 'none';
            document.getElementById('intro-container').style.display = 'block'; 
            document.getElementById('model-prediction-explanation').style.display = 'none';
            document.getElementById('instructions').style.display = 'none';
            document.getElementById('questionnaire-title').classList.add('hidden');
            sessionStorage.setItem('user_logged_in', 'true');
        } else {
            throw new Error('Clave de acceso incorrecta.');
        }
    })
    .catch(error => {
        alert(error.message);  
    });
}

// Ejecutar login al hacer clic en el botón "Acceder" o presionar "Enter"
document.getElementById('access-btn').onclick = login;
document.getElementById('access-key').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        login();
    }
});

// Al hacer clic en "Continuar" en el intro-container
document.getElementById('start-introduction-btn').onclick = function () {
    document.getElementById('intro-container').style.display = 'none';
    document.getElementById('model-prediction-explanation').style.display = 'block';
    scrollUp(); 
};

// Mostrar la explicación de InterpretML y DT de scikit-learn al hacer clic en "Entendido" en la explicación de modelos
document.getElementById('close-model-prediction-explanation-btn').onclick = function () {
    document.getElementById('model-prediction-explanation').style.display = 'none';
    document.getElementById('interpretml-explanation').style.display = 'block';
    scrollUp(); 
};

// Mostrar la explicación de IDS al hacer clic en "Entendido" en la explicación de InterpretML
document.getElementById('close-interpretml-explanation-btn').onclick = function () {
    document.getElementById('interpretml-explanation').style.display = 'none';
    document.getElementById('ids-explanation').style.display = 'block';
    scrollUp(); 
};

// Mostrar las instrucciones del cuestionario al hacer clic en "Entendido" en la explicación de IDS
document.getElementById('close-explanation-btn').onclick = function () {
    document.getElementById('ids-explanation').style.display = 'none';
    document.getElementById('instructions').style.display = 'block';
    scrollUp(); 
};

// Iniciar el cuestionario al hacer clic en "Comenzar Cuestionario"
document.getElementById('start-questionnaire-btn').onclick = function () {
    document.getElementById('instructions').style.display = 'none';
    document.getElementById('question-container').style.display = 'block';

    fetch('/static/questions.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error en la carga de preguntas: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data && Array.isArray(data.questions)) {
                questions = data.questions;
                currentQuestionIndex = 0;
                loadQuestion();
                scrollUp();
            } else {
                console.error('Formato incorrecto en el archivo questions.json');
                alert('Hubo un problema al cargar las preguntas. Por favor, inténtelo de nuevo más tarde.');
            }
        })
        .catch(error => {
            console.error('Error loading questions:', error);
            alert('Hubo un error al cargar las preguntas. Por favor, inténtelo de nuevo más tarde.');
        });
};

// Insertar la tabla de definiciones en el contenedor específico
document.getElementById('definitions-table-container').innerHTML = definitionsTableHTML;

function formatRule(rule) {
    if (!rule) {
        console.error("Regla indefinida o vacía");
        return '';
    }

    // Aplicar formato HTML para los elementos destacados
    rule = rule.replace(/\b(Aprobado|Reprobado)\b/g, '<span class="conclusion">$1</span>')
        .replace(/(\d+(\.\d+)?)/g, '<span class="value">$1</span>')
        .replace(/\b(si|y|entonces)\b/g, '<span class="keyword">$1</span>')
        .replace(/\b(absences|goout|studytime|reason_reputation|failures|Fedu)\b/g, '<span class="attribute">$1</span>')
        .replace(/([≤≥=<>])/g, '<span class="operator">$1</span>');

    return unescapeHTML(rule);
}

// Función para des-escapar el contenido HTML
function unescapeHTML(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.documentElement.textContent;
}

// Mostrar número de pregunta usando `id`
function showQuestionNumber(questionId) {
    const questionNumberIndicator = document.getElementById('question-number');

    // Verifica si estamos en la pantalla final de agradecimiento
    if (questionId > questions.length) {
        questionNumberIndicator.style.display = 'none'; // Oculta el indicador de número de pregunta
    } else {
        questionNumberIndicator.style.display = 'block'; // Muestra el indicador en las preguntas normales
        questionNumberIndicator.textContent = `Pregunta ${questionId} de ${questions.length}`;
    }
}
