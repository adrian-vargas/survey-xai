// app.js

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
    
    // Número de preguntas respondidas hasta el momento
    const currentQuestionNumber = currentQuestionIndex + 1; // Sumar 1 porque el índice comienza en 0
    
    // Calcular el progreso en porcentaje
    const currentProgress = (currentQuestionNumber / totalQuestions) * 100;
    document.getElementById('progress-bar').style.width = currentProgress + '%';
}


// Función para cargar preguntas
function loadQuestion() {
    if (currentQuestionIndex < questions.length) {
        const questionData = questions[currentQuestionIndex];
        displayQuestion(questionData);
        updateProgressBar();
    } else {
        submitAnswers();
    }
}

function displayQuestion(questionData) {
    const container = document.getElementById('question-container');
    container.innerHTML = ''; // Limpiar la pregunta anterior

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

    // Mostrar reglas como una lista de elementos
    if (questionData.rules) {
        const rulesContainer = document.createElement('div');
        rulesContainer.classList.add('rule-container');
    
        const rulesTitle = document.createElement('strong');
        rulesTitle.textContent = "Reglas:";
        rulesContainer.appendChild(rulesTitle);
    
        const rulesList = document.createElement('ul');
        questionData.rules.forEach(rule => {
            const ruleItem = document.createElement('li');
            ruleItem.innerHTML = formatRule(rule);
            rulesList.appendChild(ruleItem);
        });
        rulesContainer.appendChild(rulesList);
        container.appendChild(rulesContainer);
    }

    // Mostrar grafo global o local
    if (questionData.global_graph) {
        const globalGraphElement = document.createElement('p');
        globalGraphElement.textContent = `Grafo Global: ${questionData.global_graph}`;
        container.appendChild(globalGraphElement);
    } else if (questionData.local_graph) {
        const localGraphElement = document.createElement('p');
        localGraphElement.textContent = `Grafo Local: ${questionData.local_graph}`;
        container.appendChild(localGraphElement);
    }

    // Mostrar predicción del modelo solo si la categoría no es de exactitud ni ambigüedad
    if (questionData.prediction_model && questionData.category !== 'Exactitud' && questionData.category !== 'Ambigüedad') {
        const predictionElement = document.createElement('p');
        predictionElement.textContent = `Predicción del modelo: ${questionData.prediction_model}`;
        container.appendChild(predictionElement);
    }

    // Verificar si es una pregunta descriptiva y mostrar un campo de texto
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
        return; // Salir de la función para evitar agregar opciones de botón en preguntas descriptivas
    }

    // Configuración de las opciones de respuesta para preguntas no descriptivas
    const options = questionData.category === "Error"
        ? ["Correcto", "Incorrecto", "No estoy seguro"]
        : questionData.answer || ["Aprobado", "Reprobado", "No estoy seguro"];
    
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
    endTime = new Date().getTime();
    const responseTime = endTime - startTime;

    // Desmarcar todos los botones y marcar el botón seleccionado
    document.querySelectorAll('button').forEach(button => button.classList.remove('selected'));
    optionElement.classList.add('selected');

    const currentQuestionData = questions[currentQuestionIndex];

    if (currentQuestionData) {
        answers.push({
            model: currentQuestionData.model || "",
            observation: currentQuestionData.observation || {},
            rules: currentQuestionData.rules || [],
            visualization: currentQuestionData.visualization || "",
            prediction_model: currentQuestionData.prediction_model || "",
            prediction: currentQuestionData.prediction || [],
            answer: answer,
            time: responseTime
        });

        updateProgressBar();

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

        // Realizar scroll hacia abajo después de que se procesa la respuesta
        scrollDown();
    } else {
        console.error("Error: currentQuestionData es undefined.");
    }
}

// Función para hacer scroll hacia abajo
function scrollDown() {
    window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth' // Desplazamiento suave hacia abajo
    });
}

// Función para hacer scroll hacia arriba
function scrollUp() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth' // Desplazamiento suave hacia arriba
    });
}

// Función para manejar la respuesta a la pregunta de seguimiento
function handleFollowUpAnswer(answer) {
    answers.push({
        follow_up_answer: answer,
        time: new Date().getTime() - endTime // Tiempo desde que se mostró la pregunta de seguimiento
    });

    // Muestra el botón "Siguiente" una vez que se ha respondido la pregunta de seguimiento
    document.getElementById('next-question-btn').style.display = 'block';

    // Realizar scroll hacia abajo después de responder la pregunta de seguimiento
    scrollDown();
}

function nextQuestion() {
    currentQuestionIndex++;

    if (currentQuestionIndex >= questions.length) {
        submitAnswers();
        return;
    }

    loadQuestion();
    document.getElementById('next-question-btn').style.display = 'none';

    // Realizar scroll hacia arriba al pasar a la siguiente pregunta
    scrollUp();
}

function moveToNextCategory() {
    currentCategoryIndex++;
    currentQuestionIndex = 0;
    loadQuestion();
}

function loadDescriptiveQuestion() {
    updateProgressBar();
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
    updateProgressBar();
    fetch('/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(answers),
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                alert('Cuestionario completado');
                console.log(data);
                document.getElementById('question-container').innerHTML = '<div class="thank-you-message"><p>Gracias por completar el cuestionario.</p></div>';
                document.getElementById('next-question-btn').style.display = 'none';
                document.querySelector('h1').style.display = 'none';
            } else {
                console.error('Error:', data.message);
            }
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

document.getElementById('next-question-btn').onclick = nextQuestion;

const correctAccessKey = 'clave123';

document.getElementById('access-btn').onclick = function () {
    const enteredKey = document.getElementById('access-key').value;

    if (enteredKey === correctAccessKey) {
        document.getElementById('access-container').style.display = 'none';
        document.getElementById('instructions').style.display = 'block';
    } else {
        alert('Clave de acceso incorrecta. Inténtalo de nuevo.');
    }
};

document.getElementById('start-questionnaire-btn').onclick = function () {
    document.getElementById('instructions').style.display = 'none';
    document.getElementById('question-container').style.display = 'block';

    fetch('/static/questions.json')
        .then(response => response.json())
        .then(data => {
            questions = data;
            loadQuestion();
        })
        .catch(error => console.error('Error loading questions:', error));
};


// Inicializar el botón de acceso
document.getElementById('access-btn').onclick = function () {
    const enteredKey = document.getElementById('access-key').value;
    const correctAccessKey = 'clave123';

    if (enteredKey === correctAccessKey) {
        document.getElementById('access-container').style.display = 'none';
        document.getElementById('model-prediction-explanation').style.display = 'block';

        // Verifica que `questions` esté definido y tenga una pregunta con reglas
        if (questions && questions[0] && questions[0].rules) {
            // Itera sobre cada regla en `rules`
            questions[0].rules.forEach(rule => {
                const listItem = document.createElement('div');
                listItem.innerHTML = formatRule(rule);
                document.getElementById('model-prediction-explanation').appendChild(listItem);
            });
        } else {
            console.warn("No se encontró una regla en el JSON");
        }
    } else {
        alert('Clave de acceso incorrecta. Inténtalo de nuevo.');
    }
};

// Función para hacer scroll hacia arriba
function scrollUp() {
    setTimeout(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth' // Desplazamiento suave
        });
    }, 100); // Retraso de 100ms para asegurar que el contenido cambie antes de hacer scroll
}

// Mostrar la explicación de InterpretML y DT de scikit-learn al hacer clic en "Entendido" en la explicación de modelos
document.getElementById('close-model-prediction-explanation-btn').onclick = function () {
    document.getElementById('model-prediction-explanation').style.display = 'none';
    document.getElementById('interpretml-explanation').style.display = 'block';
    scrollUp(); // Scroll hacia arriba
};

// Mostrar la explicación de IDS al hacer clic en "Entendido" en la explicación de InterpretML
document.getElementById('close-interpretml-explanation-btn').onclick = function () {
    document.getElementById('interpretml-explanation').style.display = 'none';
    document.getElementById('ids-explanation').style.display = 'block';
    scrollUp(); // Scroll hacia arriba
};

// Mostrar las instrucciones del cuestionario al hacer clic en "Entendido" en la explicación de IDS
document.getElementById('close-explanation-btn').onclick = function () {
    document.getElementById('ids-explanation').style.display = 'none';
    document.getElementById('instructions').style.display = 'block';
    scrollUp(); // Scroll hacia arriba
};

// Iniciar el cuestionario al hacer clic en "Comenzar Cuestionario"
document.getElementById('start-questionnaire-btn').onclick = function () {
    document.getElementById('instructions').style.display = 'none';
    document.getElementById('question-container').style.display = 'block';

    fetch('/static/questions.json')
        .then(response => response.json())
        .then(data => {
            questions = data.questions; // Asegúrate de que `data.questions` sea un array de preguntas
            currentQuestionIndex = 0;
            loadQuestion();
            scrollUp();
        })
        .catch(error => console.error('Error loading questions:', error));
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


