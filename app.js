const app = {
    // State
    state: {
        currentViewDay: 1, // The day currently being viewed/studied
        learnedIds: [], // Indices of words learned
        todayWords: [], // Indices of words for the selected day
        studyIndex: 0,
        testQueue: [], // Indices of words remaining to test
        currentTestWord: null
    },

    // Constants
    WORDS_PER_DAY: 20,

    init() {
        this.loadState();
        this.renderDashboard();
        this.setupEventListeners();
    },

    loadState() {
        const learned = JSON.parse(localStorage.getItem('gravity_learned_ids')) || [];
        this.state.learnedIds = learned;
    },

    saveState() {
        localStorage.setItem('gravity_learned_ids', JSON.stringify(this.state.learnedIds));
    },

    setupEventListeners() {
        // Dashboard interactions handled by dynamic rendering

        // Study Controls
        document.getElementById('prev-word').addEventListener('click', () => this.prevStudyCard());
        document.getElementById('next-word').addEventListener('click', () => this.nextStudyCard());
        document.getElementById('start-test-btn').addEventListener('click', () => this.startTest());

        // Test Controls
        document.getElementById('show-answer-btn').addEventListener('click', () => this.showAnswer());

        // Back buttons
        document.querySelectorAll('.back-btn').forEach(btn => {
            btn.addEventListener('click', () => this.goHome());
        });
    },

    showView(viewId) {
        document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
        document.getElementById(viewId).classList.add('active');
        window.scrollTo(0, 0);
    },

    goHome() {
        this.renderDashboard();
        this.showView('dashboard');
    },

    // --- Dashboard ---

    renderDashboard() {
        document.getElementById('total-learned').textContent = this.state.learnedIds.length;

        const totalDays = Math.ceil(wordsData.length / this.WORDS_PER_DAY);
        const gridContainer = document.getElementById('days-grid');
        gridContainer.innerHTML = '';

        for (let i = 1; i <= totalDays; i++) {
            const btn = document.createElement('button');
            btn.className = 'day-card';

            // Check completion status
            const startIndex = (i - 1) * this.WORDS_PER_DAY;
            const endIndex = Math.min(startIndex + this.WORDS_PER_DAY, wordsData.length);
            const dayWordIndices = [];
            for (let j = startIndex; j < endIndex; j++) dayWordIndices.push(j);

            const isCompleted = dayWordIndices.every(idx => this.state.learnedIds.includes(idx));

            if (isCompleted) {
                btn.classList.add('completed');
                btn.innerHTML = `<span class="day-num">第 ${i} 天</span><span class="status-icon">✓</span>`;
            } else {
                btn.innerHTML = `<span class="day-num">第 ${i} 天</span>`;
            }

            btn.onclick = () => this.startStudy(i);
            gridContainer.appendChild(btn);
        }
    },

    // --- Study Mode ---

    startStudy(day) {
        this.state.currentViewDay = day;

        // Calculate words for this day
        const startIndex = (day - 1) * this.WORDS_PER_DAY;
        const endIndex = startIndex + this.WORDS_PER_DAY; // No need to clamp here, loop handles it

        this.state.todayWords = [];
        for (let i = startIndex; i < endIndex && i < wordsData.length; i++) {
            this.state.todayWords.push(i);
        }

        this.state.studyIndex = 0;

        // Update View Header
        document.getElementById('study-day-label').textContent = `第 ${day} 天`;

        this.renderStudyCard();
        this.showView('study-view');
        this.updateStudyControls();
    },

    renderStudyCard() {
        const wordIndex = this.state.todayWords[this.state.studyIndex];
        const wordData = wordsData[wordIndex];
        const cardContainer = document.getElementById('study-card');

        cardContainer.innerHTML = this.generateCardContent(wordData);
        document.getElementById('study-index').textContent = this.state.studyIndex + 1;
        document.getElementById('study-total').textContent = this.state.todayWords.length;
    },

    generateCardContent(data) {
        // Helpers
        const renderList = (items, renderer) => {
            if (!items || items.length === 0) return '<div class="empty-section">无</div>';
            return `<ul class="detail-list">${items.map(renderer).join('')}</ul>`;
        };

        // Phonetics
        const uk = data.phonetics?.uk ? `<span class="pron"><span class="region">UK</span> ${data.phonetics.uk}</span>` : '';
        const us = data.phonetics?.us ? `<span class="pron"><span class="region">US</span> ${data.phonetics.us}</span>` : '';

        return `
            <div class="card-header">
                <h2 class="word-title">${data.word}</h2>
                <div class="phonetics-container">
                    ${uk}
                    ${us}
                </div>
            </div>

            <div class="card-body">
                <div class="section meaning-section">
                    <div class="section-label">释义</div>
                    <div class="meaning-text">${data.meaning}</div>
                </div>

                <div class="section">
                    <div class="section-label">常用短语</div>
                    ${renderList(data.phrases, p => `
                        <li>
                            <div class="en-text">${p.en}</div>
                            <div class="cn-text">${p.cn}</div>
                        </li>
                    `)}
                </div>

                <div class="section">
                    <div class="section-label">例句</div>
                    ${renderList(data.sentences, s => `
                        <li>
                            <div class="en-text">${s.en}</div>
                            <div class="cn-text">${s.cn}</div>
                        </li>
                    `)}
                </div>

                <div class="section">
                    <div class="section-label">同义词</div>
                     ${renderList(data.synonyms, s => `
                        <li><span class="word-ref">${s.word}</span> <span class="cn-ref">${s.cn}</span></li>
                    `)}
                </div>

                <div class="section">
                    <div class="section-label">易混淆词</div>
                    ${renderList(data.confusing, c => `
                        <li><span class="word-ref">${c.word}</span> <span class="cn-ref">${c.cn}</span></li>
                    `)}
                </div>
            </div>
        `;
    },

    prevStudyCard() {
        if (this.state.studyIndex > 0) {
            this.state.studyIndex--;
            this.renderStudyCard();
            this.updateStudyControls();
        }
    },

    nextStudyCard() {
        if (this.state.studyIndex < this.state.todayWords.length - 1) {
            this.state.studyIndex++;
            this.renderStudyCard();
            this.updateStudyControls();
        } else {
            // Reached end of study
            document.getElementById('start-test-btn').classList.remove('hidden');
            document.getElementById('next-word').classList.add('hidden');
        }
    },

    updateStudyControls() {
        const prevBtn = document.getElementById('prev-word');
        const nextBtn = document.getElementById('next-word');
        const testBtn = document.getElementById('start-test-btn');

        prevBtn.disabled = this.state.studyIndex === 0;

        if (this.state.studyIndex < this.state.todayWords.length - 1) {
            nextBtn.classList.remove('hidden');
            testBtn.classList.add('hidden');
        } else {
            nextBtn.classList.add('hidden');
            testBtn.classList.remove('hidden');
        }
    },

    // --- Test Mode ---

    startTest() {
        // Initialize test queue with all words for today
        this.state.testQueue = [...this.state.todayWords];
        // Shuffle queue
        this.state.testQueue.sort(() => Math.random() - 0.5);

        this.nextTestWord();
        this.showView('test-view');
    },

    nextTestWord() {
        if (this.state.testQueue.length === 0) {
            this.showView('completion-view');
            // Recalculate learned count for dashboard
            // But we don't save until completeDay? Actually we save as we go or at end.
            return;
        }

        this.state.currentTestWord = this.state.testQueue[0]; // Peek
        const wordData = wordsData[this.state.currentTestWord];

        // Reset UI
        document.querySelector('.card-back').classList.add('hidden');
        document.getElementById('show-answer-btn').classList.remove('hidden');
        document.getElementById('answer-actions').classList.add('hidden');

        // Render Front
        document.getElementById('test-word').textContent = wordData.word;
        document.getElementById('test-phonetics').innerHTML =
            (wordData.phonetics?.us ? `<span class="region">US</span> ${wordData.phonetics.us} ` : '') +
            (wordData.phonetics?.uk ? `<span class="region">UK</span> ${wordData.phonetics.uk}` : '');

        document.getElementById('test-remaining').textContent = this.state.testQueue.length;

        // Render Back using the detailed generator
        document.getElementById('test-back-content').innerHTML = this.generateCardContent(wordData);
    },

    showAnswer() {
        document.querySelector('.card-back').classList.remove('hidden');
        document.getElementById('show-answer-btn').classList.add('hidden');
        document.getElementById('answer-actions').classList.remove('hidden');
    },

    handleTestResult(remembered) {
        if (remembered) {
            // Remove from queue
            const learnedWordId = this.state.testQueue.shift();
            // Add to learned list if not already there
            if (!this.state.learnedIds.includes(learnedWordId)) {
                this.state.learnedIds.push(learnedWordId);
                this.saveState();
            }
        } else {
            // Move to end of queue to test again
            const word = this.state.testQueue.shift();
            this.state.testQueue.push(word);
        }

        this.nextTestWord();
    },

    completeDay() {
        this.renderDashboard(); // Update checks
        this.goHome();
    }
};

// Start app
window.addEventListener('DOMContentLoaded', () => {
    app.init();
});
