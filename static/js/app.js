let questions;
let categories = ['accuracy_questions', 'error_detection_questions'];
let descriptiveQuestionsCategory = 'descriptive_questions';
let currentCategoryIndex = 0;
let subCategories = ['both_models_make_the_same_decision', 'ambiguous_questions', 'model_specific_questions'];
let currentSubCategoryIndex = 0;
let currentQuestionIndex = 0;
let startTime, endTime;
const answers = [];

document.getElementById('start-questionnaire-btn').onclick = function() {
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

function updateProgressBar() {
    let totalQuestions = 0;

    // Sumar todas las preguntas de las categorías principales
    for (let i = 0; i < categories.length; i++) {
        for (let j = 0; j < subCategories.length; j++) {
            totalQuestions += questions[categories[i]][subCategories[j]].length;
        }
    }

    // Sumar las preguntas descriptivas
    totalQuestions += questions[descriptiveQuestionsCategory].length;

    // Calcular la posición actual
    let currentQuestionNumber = 0;

    // Preguntas respondidas en categorías anteriores
    for (let i = 0; i < currentCategoryIndex; i++) {
        for (let j = 0; j < subCategories.length; j++) {
            currentQuestionNumber += questions[categories[i]][subCategories[j]].length;
        }
    }

    // Preguntas respondidas en la subcategoría actual
    if (currentCategoryIndex < categories.length) {
        for (let j = 0; j < currentSubCategoryIndex; j++) {
            currentQuestionNumber += questions[categories[currentCategoryIndex]][subCategories[j]].length;
        }
        // Sumar la pregunta actual
        currentQuestionNumber += currentQuestionIndex + 1; // Sumar 1 para considerar la respuesta actual
    } else if (currentCategoryIndex === categories.length) {
        // Preguntas descriptivas
        currentQuestionNumber += currentQuestionIndex + 1; // Sumar 1 para considerar la respuesta actual
    }

    // Calcular el progreso como porcentaje
    const currentProgress = (currentQuestionNumber / (totalQuestions+1)) * 100;
    document.getElementById('progress-bar').style.width = currentProgress + '%';
}

function loadQuestion() {
    // Quita la llamada a updateProgressBar() de aquí.
    if (currentCategoryIndex < categories.length) {
        let currentCategory = categories[currentCategoryIndex];
        let currentSubCategory = subCategories[currentSubCategoryIndex];

        if (currentQuestionIndex < questions[currentCategory][currentSubCategory].length) {
            const questionData = questions[currentCategory][currentSubCategory][currentQuestionIndex];
            displayQuestion(questionData);
        } else {
            moveToNextSubCategory();
        }
    } else if (currentCategoryIndex === categories.length) {
        loadDescriptiveQuestion();
    } else {
        submitAnswers();
    }
}

function displayQuestion(questionData) {
    const container = document.getElementById('question-container');
    container.innerHTML = '';  // Limpiar la pregunta anterior

    const observationElement = document.createElement('p');
    observationElement.textContent = `Observación: ${questionData.observation}`;
    container.appendChild(observationElement);

    const predictionElement = document.createElement('p');
    predictionElement.textContent = `Predicción del modelo: ${questionData.prediction}`;
    container.appendChild(predictionElement);

    questionData.options.forEach(option => {
        const optionElement = document.createElement('button');
        optionElement.textContent = option;
        optionElement.onclick = () => handleAnswer(option, optionElement);
        container.appendChild(optionElement);
    });

    startTime = new Date().getTime();
    document.getElementById('next-question-btn').style.display = 'none';  // Ocultar el botón "Siguiente" hasta que se seleccione una respuesta
}

function handleAnswer(answer, optionElement) {
    endTime = new Date().getTime();
    const responseTime = endTime - startTime;

    document.querySelectorAll('button').forEach(button => button.classList.remove('selected'));
    optionElement.classList.add('selected');

    answers.push({
        observation: questions[categories[currentCategoryIndex]][subCategories[currentSubCategoryIndex]][currentQuestionIndex].observation,
        prediction: questions[categories[currentCategoryIndex]][subCategories[currentSubCategoryIndex]][currentQuestionIndex].prediction,
        answer: answer,
        time: responseTime
    });

    document.getElementById('next-question-btn').style.display = 'block';  // Mostrar el botón "Siguiente" después de seleccionar una respuesta

    updateProgressBar(); // Mover la barra de progreso después de seleccionar una respuesta
}

function nextQuestion() {
    currentQuestionIndex++;
    loadQuestion();
    document.getElementById('next-question-btn').style.display = 'none';  // Ocultar el botón después de hacer clic
}

function moveToNextSubCategory() {
    currentSubCategoryIndex++;
    currentQuestionIndex = 0;

    if (currentSubCategoryIndex < subCategories.length) {
        loadQuestion();
    } else {
        moveToNextCategory();
    }
}

function moveToNextCategory() {
    currentCategoryIndex++;
    currentSubCategoryIndex = 0;
    currentQuestionIndex = 0;

    loadQuestion();
}

function loadDescriptiveQuestion() {
    updateProgressBar(); // Actualiza la barra de progreso cada vez que se carga una pregunta descriptiva
    if (currentQuestionIndex < questions[descriptiveQuestionsCategory].length) {
        const questionData = questions[descriptiveQuestionsCategory][currentQuestionIndex];
        const container = document.getElementById('question-container');
        container.innerHTML = '';  // Limpiar la pregunta anterior

        const rulesElement = document.createElement('div');
        rulesElement.innerHTML = '<strong>Reglas generadas por el modelo:</strong><br>' + questionData.rules.join('<br>');
        container.appendChild(rulesElement);

        const questionElement = document.createElement('p');
        questionElement.textContent = questionData.question;
        container.appendChild(questionElement);

        const answerInput = document.createElement('textarea');
        answerInput.setAttribute('placeholder', questionData.answer_placeholder);
        answerInput.setAttribute('rows', '5');
        answerInput.setAttribute('cols', '50');
        container.appendChild(answerInput);

        startTime = new Date().getTime();

        document.getElementById('next-question-btn').style.display = 'none';

        answerInput.addEventListener('input', function() {
            if (answerInput.value.trim() !== '') {
                document.getElementById('next-question-btn').style.display = 'block';
            } else {
                document.getElementById('next-question-btn').style.display = 'none';
            }
        });

        document.getElementById('next-question-btn').onclick = function() {
            endTime = new Date().getTime();
            const responseTime = endTime - startTime;

            answers.push({
                rules: questionData.rules,
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
    updateProgressBar(); // Asegurarse de que la barra de progreso esté al 100% al finalizar
    fetch('/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(answers),  // Asegúrate de que `answers` es un array de objetos
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            alert('Cuestionario completado');
            console.log(data);
            document.getElementById('question-container').innerHTML = '<div class="thank-you-message"><p>Gracias por completar el cuestionario.</p></div>';
            document.getElementById('next-question-btn').style.display = 'none';
        } else {
            console.error('Error:', data.message);
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}



document.getElementById('next-question-btn').onclick = nextQuestion;

const correctAccessKey = 'clave123';  // Define aquí la clave correcta

document.getElementById('access-btn').onclick = function() {
    const enteredKey = document.getElementById('access-key').value;

    if (enteredKey === correctAccessKey) {
        document.getElementById('access-container').style.display = 'none';
        document.getElementById('instructions').style.display = 'block';
    } else {
        alert('Clave de acceso incorrecta. Inténtalo de nuevo.');
    }
};

document.getElementById('start-questionnaire-btn').onclick = function() {
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
