// aura/quiz/quiz.js

const state = {
  currentQuestion: 0,
  answers: {},
};

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function renderQuestion(index) {
  const q = QUESTIONS[index];
  document.getElementById('question-label').textContent = `QUESTION ${index + 1} OF ${QUESTIONS.length}`;
  document.getElementById('question-text').textContent = q.text;
  document.getElementById('progress-fill').style.width = `${((index) / QUESTIONS.length) * 100}%`;

  const optionsEl = document.getElementById('options');
  optionsEl.innerHTML = '';
  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'option';
    btn.textContent = opt.text;
    btn.addEventListener('click', () => selectAnswer(index, i));
    optionsEl.appendChild(btn);
  });
}

function selectAnswer(questionIndex, optionIndex) {
  const q = QUESTIONS[questionIndex];
  state.answers[q.id] = optionIndex;

  // Brief visual feedback then advance
  const options = document.querySelectorAll('.option');
  options[optionIndex].classList.add('selected');

  setTimeout(() => {
    state.currentQuestion++;
    if (state.currentQuestion < QUESTIONS.length) {
      renderQuestion(state.currentQuestion);
    } else {
      showScreen('screen-email');
    }
  }, 300);
}

// Start
document.getElementById('btn-start').addEventListener('click', () => {
  showScreen('screen-quiz');
  renderQuestion(0);
});

// Email submit
document.getElementById('btn-submit-email').addEventListener('click', async () => {
  const email = document.getElementById('email-input').value.trim();
  if (!email || !email.includes('@')) {
    document.getElementById('email-input').style.borderColor = 'var(--red)';
    return;
  }

  showScreen('screen-loading');

  const { resultType, scores } = calculateResult(state.answers);
  await submitAndRender(email, state.answers, scores, resultType);
});
