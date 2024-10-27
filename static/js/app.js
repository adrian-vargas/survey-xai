// app.js

let questions;
let categories = ['accuracy_questions', 'ambiguous_questions', 'error_detection_questions', 'visualization_preferences'];
let descriptiveQuestionsCategory = 'descriptive_questions';
let currentCategoryIndex = 0;
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
    let totalQuestions = 0;

    for (let i = 0; i < categories.length; i++) {
        totalQuestions += questions[categories[i]].length;
    }

    totalQuestions += questions[descriptiveQuestionsCategory].length;

    let currentQuestionNumber = 0;

    for (let i = 0; i < currentCategoryIndex; i++) {
        currentQuestionNumber += questions[categories[i]].length;
    }

    if (currentCategoryIndex < categories.length) {
        currentQuestionNumber += currentQuestionIndex + 1;
    } else if (currentCategoryIndex === categories.length) {
        currentQuestionNumber += currentQuestionIndex + 1;
    }

    const currentProgress = (currentQuestionNumber / totalQuestions) * 100;
    document.getElementById('progress-bar').style.width = currentProgress + '%';
}

function loadQuestion() {
    if (currentCategoryIndex < categories.length) {
        let currentCategory = categories[currentCategoryIndex];

        if (questions[currentCategory]) {
            if (currentQuestionIndex < questions[currentCategory].length) {
                const questionData = questions[currentCategory][currentQuestionIndex];
                displayQuestion(questionData);
            } else {
                moveToNextCategory();
            }
        } else {
            console.error('Category not found in questions:', currentCategory);
            moveToNextCategory();
        }
    } else if (currentCategoryIndex === categories.length) {
        loadDescriptiveQuestion();
    } else {
        submitAnswers();
    }
}

function displayQuestion(questionData) {
    const container = document.getElementById('question-container');
    container.innerHTML = ''; // Limpiar la pregunta anterior
    container.style.maxWidth = '95%';

    // Mostrar instrucciones
    if (questionData.instructions) {
        const instructionsElement = document.createElement('h2');
        instructionsElement.textContent = questionData.instructions;
        instructionsElement.style.textAlign = 'center';
        container.appendChild(instructionsElement);
        document.querySelector('h1').style.display = 'none'; // Ocultar el título principal
    }

    // Mostrar el modelo
    if (questionData.model) {
        const modelElement = document.createElement('p');
        modelElement.textContent = `Modelo ${questionData.model}`;
        modelElement.style.textAlign = 'center';
        modelElement.classList.add('model-text');
        container.appendChild(modelElement);
    }

    // Mostrar observación
    if (questionData.observation) {
        const observationElement = document.createElement('p');
        observationElement.textContent = `Observación: ${questionData.observation}`;
        observationElement.style.textAlign = 'center';
        container.appendChild(observationElement);
    }

    // Verificar si la categoría actual requiere mostrar la tabla de definiciones
    if (categories[currentCategoryIndex] !== 'visualization_preferences' && 
        categories[currentCategoryIndex] !== 'descriptive_questions') {
        
        const definitionsContainer = document.createElement('div');
        definitionsContainer.innerHTML = definitionsTableHTML;
        container.appendChild(definitionsContainer);
    }

    // Mostrar y formatear la regla
    if (questionData.rule) {
        const ruleElement = document.createElement('div');
        ruleElement.classList.add('rule-container');
        ruleElement.innerHTML = unescapeHTML(formatRule(questionData.rule));
        container.appendChild(ruleElement);
    }

    // Mostrar visualización si está disponible
    if (questionData.visualization) {
        const visualizationPath = getVisualizationPath(questionData);
        if (visualizationPath) {
            const visualizationElement = document.createElement('img');
            visualizationElement.src = visualizationPath;
            visualizationElement.alt = 'Visualización del modelo';
            visualizationElement.classList.add('visualizacion-modelo');
            container.appendChild(visualizationElement);
        }
    }

    // Configuración de las opciones de respuesta
    const options = questionData.prediction || questionData.answer || questionData.options;
    if (options && Array.isArray(options)) {
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'center';
        buttonContainer.style.gap = '20px';
        buttonContainer.style.flexWrap = 'wrap';

        options.forEach(option => {
            const optionElement = document.createElement('button');
            optionElement.textContent = option;
            optionElement.onclick = () => handleAnswer(option, optionElement);
            optionElement.style.flex = '1 1 calc(33% - 20px)';
            buttonContainer.appendChild(optionElement);
        });

        container.appendChild(buttonContainer);
    } else {
        console.error('Options not found or invalid format in questionData:', questionData);
    }

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

    const currentCategory = categories[currentCategoryIndex];
    const currentQuestionData = questions[currentCategory][currentQuestionIndex];

    if (currentQuestionData) {
        // Guardar la respuesta principal
        answers.push({
            model: currentQuestionData.model || "",
            observation: currentQuestionData.observation || "",
            rule: currentQuestionData.rule || "",
            visualization: currentQuestionData.visualization || "",
            prediction_model: currentQuestionData.prediction_model || "",
            prediction: currentQuestionData.prediction || [],
            answer: answer,
            time: responseTime
        });

        updateProgressBar();

        // Verificar si existe una pregunta de seguimiento
        const followUpContainer = document.getElementById('follow-up-container');
        followUpContainer.innerHTML = ''; // Limpiar cualquier contenido previo
        if (currentQuestionData.follow_up) {
            // Mostrar la pregunta de seguimiento
            followUpContainer.innerHTML = `<p>${currentQuestionData.follow_up.question}</p>`;
            followUpContainer.style.display = 'block';
            
            // Crear botones para las opciones de la pregunta de seguimiento
            currentQuestionData.follow_up.options.forEach(option => {
                const followUpButton = document.createElement('button');
                followUpButton.textContent = option;
                followUpButton.classList.add('follow-up-option');
                followUpButton.onclick = () => handleFollowUpAnswer(option);
                followUpContainer.appendChild(followUpButton);
            });

            // Ocultar el botón "Siguiente" hasta que se responda la pregunta de seguimiento
            document.getElementById('next-question-btn').style.display = 'none';
        } else {
            // Si no hay pregunta de seguimiento, mostrar el botón "Siguiente" inmediatamente
            document.getElementById('next-question-btn').style.display = 'block';
        }

        // Realizar scroll hacia abajo
        scrollDown();
    } else {
        console.error("Error: currentQuestionData es undefined.");
    }
}

// Función para manejar la respuesta a la pregunta de seguimiento
function handleFollowUpAnswer(answer) {
    // Guardar la respuesta a la pregunta de seguimiento
    answers.push({
        follow_up_answer: answer,
        time: new Date().getTime() - endTime // Tiempo desde que se mostró la pregunta de seguimiento
    });

    // Ocultar el contenedor de seguimiento y mostrar el botón "Siguiente"
    document.getElementById('follow-up-container').style.display = 'none';
    document.getElementById('next-question-btn').style.display = 'block';
}



// Función para hacer scroll hacia abajo
function scrollDown() {
    window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth' // Desplazamiento suave
    });
}


function nextQuestion() {
    currentQuestionIndex++;
    loadQuestion();
    document.getElementById('next-question-btn').style.display = 'none';
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

// Función para des-escapar el contenido HTML
function unescapeHTML(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.documentElement.textContent;
}

function formatRule(input) {
    // Función auxiliar para aplicar el formato al texto
    function applyFormatting(ruleText) {
        return ruleText
            .replace(/\b(Aprobado|Reprobado)\b/g, '<span class="conclusion">$1</span>')
            .replace(/(\d+(\.\d+)?)/g, '<span class="value">$1</span>') // Resalta números
            .replace(/\b(si|y|entonces)\b/g, '<span class="keyword">$1</span>') // Resalta las palabras clave
            .replace(/\b(absences|goout|studytime|reason_reputation|failures|Fedu)\b/g, '<span class="attribute">$1</span>') // Resalta características
            .replace(/([≤≥=<>])/g, '<span class="value">$1</span>'); // Resalta los signos de comparación
    }

    // Verificar si el input es un elemento HTML o texto plano
    if (typeof input === "string") {
        // Si es texto plano, aplicar el formato y devolverlo
        return applyFormatting(input);
    } else if (input instanceof HTMLElement) {
        // Si es un elemento HTML, aplicar el formato al contenido de texto
        input.innerHTML = applyFormatting(input.textContent);
    }
}












// Inicializar el botón de acceso
document.getElementById('access-btn').onclick = function () {
    const enteredKey = document.getElementById('access-key').value;
    const correctAccessKey = 'clave123';

    if (enteredKey === correctAccessKey) {
        document.getElementById('access-container').style.display = 'none';
        document.getElementById('ids-explanation').style.display = 'block'; // Mostrar la explicación del modelo IDS
        listItem.innerHTML = formatRule(rule);

    } else {
        alert('Clave de acceso incorrecta. Inténtalo de nuevo.');
    }
};

// Mostrar las instrucciones al hacer clic en "Entendido" en la explicación de IDS
document.getElementById('close-explanation-btn').onclick = function () {
    document.getElementById('ids-explanation').style.display = 'none';
    document.getElementById('instructions').style.display = 'block'; // Mostrar las instrucciones del cuestionario
};

// Iniciar el cuestionario al hacer clic en "Comenzar Cuestionario"
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