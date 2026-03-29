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

// Preview shortcut: ?preview=apex|axon|aeon|aura
(function () {
  const preview = new URLSearchParams(window.location.search).get('preview');
  if (!['apex', 'axon', 'aeon', 'aura'].includes(preview)) return;
  const mockScores = { body: 7, mind: 3, soul: 2 };
  const mockGameplan = [
    { title: 'Preview move one', detail: 'This is placeholder detail for move one. It shows how the gameplan block will look with real AI copy in production.' },
    { title: 'Preview move two', detail: 'This is placeholder detail for move two. Each block gets a title and 2-4 sentences of specific, actionable direction.' },
    { title: 'Preview move three', detail: 'This is placeholder detail for move three. The real version is personalised to the context tags from the quiz answers.' },
  ];
  renderResult(
    'preview-session',
    preview,
    mockScores,
    'PREVIEW MODE. NOT REAL DATA.',
    'This is a layout preview only.',
    mockGameplan,
    'Stage 1 gives you the gameplan. Stage 2 is where you execute it with direct support.'
  );
})();

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
