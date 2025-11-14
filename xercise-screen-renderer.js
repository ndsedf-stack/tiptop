export class ExerciseScreenRenderer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.currentExercise = null;
    this.timer = { elapsed: 0, interval: null };
  }

  render(exerciseData) {
    this.currentExercise = exerciseData;
    this.container.innerHTML = `
      <div class="exercise-screen">
        ${this.renderHeader()}
        ${this.renderMetrics()}
        ${this.renderThreeCircles()}
        ${this.renderSeriesList()}
        ${this.renderBottomStats()}
      </div>
    `;
    this.attachEventListeners();
    this.createParticles();
  }

  /* === HEADER === */
  renderHeader() {
    const { name, category } = this.currentExercise;
    return `
      <div class="exercise-header">
        <div class="exercise-header-icon">&#x1F3C6;</div>
        <div class="exercise-header-info">
          <h1 class="exercise-name">${name}</h1>
          <p class="exercise-category">${category}</p>
        </div>
      </div>
    `;
  }

  /* === METRICS === */
  renderMetrics() {
    const { params } = this.currentExercise;
    const metrics = [
      { icon: '&#x2696;&#xFE0F;', label: 'POIDS', value: `${params.weightDefault}kg`, color: 'orange' },
      { icon: '&#x1F522;', label: 'SERIES', value: `${params.setsTotal}x${params.repsPerSet}`, color: 'cyan' },
      { icon: '&#x26A1;', label: 'TEMPO', value: params.tempo, color: 'green' },
      { icon: '&#x23F1;', label: 'REPOS', value: `${params.restSeconds}s`, color: 'violet' }
    ];
    return `
      <div class="metrics-grid">
        ${metrics.map(m => `
          <div class="metric-card glow-${m.color}">
            <div class="metric-icon">${m.icon}</div>
            <div class="metric-value">${m.value}</div>
            <div class="metric-label">${m.label}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  /* === RINGS (3 cercles) === */
  renderThreeCircles() {
    const { params, gifUrl } = this.currentExercise;
    return `
      <div class="rings-section">
        <div class="rings-container">
          <div class="circle-outer">
            <div class="checkmark">&#x2713;</div>
          </div>
          <div class="circle-center">
            <div class="exercise-gif">
              <img src="${gifUrl}" alt="${this.currentExercise.name}">
            </div>
            <div class="weight-value">${params.weightDefault}</div>
            <div class="weight-unit">kg</div>
          </div>
          <div class="circle-right">
            <div class="reps-value">${params.repsPerSet}</div>
            <div class="reps-label">reps</div>
          </div>
        </div>
      </div>
    `;
  }

  /* === SERIES LIST === */
  renderSeriesList() {
    const { sets } = this.currentExercise;
    return `
      <div class="series-list">
        ${sets.map(set => this.renderSetRow(set)).join('')}
      </div>
    `;
  }

  renderSetRow(set) {
    const stateClass = `state-${set.state}`;
    let centerContent = '';
    if (set.techniques?.dropSet) {
      centerContent = `<span class="technique-badge badge-cyan">DROP SET</span>`;
    } else if (set.techniques?.restPause) {
      centerContent = `<span class="technique-badge badge-violet">REST PAUSE</span>`;
    } else {
      centerContent = `<span class="set-value">${set.weight} kg</span>`;
    }
    return `
      <div class="set-row ${stateClass}" data-set-id="${set.id}">
        <div class="set-circle-left">
          <div class="set-weight">${set.weight}</div>
          <div class="set-unit">kg</div>
        </div>
        <div class="set-info">${centerContent}</div>
        <div class="set-reps-text">${set.reps} reps</div>
        <div class="set-checkbox"></div>
      </div>
    `;
  }

  /* === BOTTOM STATS === */
  renderBottomStats() {
    const { stats, sets } = this.currentExercise;
    const minutes = Math.floor(this.timer.elapsed / 60);
    const seconds = this.timer.elapsed % 60;
    return `
      <div class="bottom-stats">
        <div class="stat-chrono">
          <div class="stat-label">CHRONO</div>
          <div class="stat-timer">${minutes}:${seconds.toString().padStart(2, '0')}</div>
        </div>
        <div class="stat-progress">
          <div class="stat-label">Progression</div>
          <div class="stat-value">${stats.completedSets} / ${sets.length} séries</div>
        </div>
        <div class="stat-volume">
          <div class="stat-volume-value">${stats.currentVolume}/${stats.volumeTarget} KG</div>
        </div>
      </div>
    `;
  }

  /* === INTERACTIONS === */
  attachEventListeners() {
    this.container.querySelectorAll('.set-row').forEach(row => {
      row.addEventListener('click', (e) => {
        const setId = parseInt(e.currentTarget.dataset.setId);
        this.handleSetClick(setId, e.currentTarget);
      });
    });
  }

  handleSetClick(setId, target) {
    const set = this.currentExercise.sets.find(s => s.id === setId);
    if (!set) return;

    if (set.state === 'pending') set.state = 'active';
    else if (set.state === 'active') set.state = 'complete';
    else set.state = 'pending';

    this.updateStats();
    this.spawnParticles(target);

    const allComplete = this.currentExercise.sets.every(s => s.state === 'complete');
    if (allComplete) this.startTimer();

    this.render(this.currentExercise);
  }

  /* === TIMER === */
  startTimer() {
    if (this.timer.interval) clearInterval(this.timer.interval);
    this.timer.interval = setInterval(() => {
      this.timer.elapsed++;
      this.updateTimerDisplay();
    }, 1000);
  }

  updateTimerDisplay() {
    const timerEl = this.container.querySelector('.stat-timer');
    if (!timerEl) return;
    const minutes = Math.floor(this.timer.elapsed / 60);
    const seconds = this.timer.elapsed % 60;
    timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /* === PARTICULES === */
  createParticles() {
    const container = this.container.querySelector('.rings-container');
    if (!container) return;
    for (let i = 0; i < 8; i++) {
      const p = document.createElement('div');
      p.classList.add('particle');
      container.appendChild(p);
    }
  }

  spawnParticles(target) {
    for (let i = 0; i < 6; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = `${Math.random() * 100}%`;
      p.style.top = `${Math.random() * 100}%`;
      target.appendChild(p);
      setTimeout(() => p.remove(), 2000);
    }
  }

  /* === STATS === */
  updateStats() {
    const { sets } = this.currentExercise;
    const completedSets = sets.filter(s => s.state === 'complete').length;
    const currentVolume = sets.filter(s => s.state === 'complete')
      .reduce((sum, s) => sum + (s.weight * s.reps), 0);
    this.currentExercise.stats.completedSets = completedSets;
    this.currentExercise.stats.currentVolume = currentVolume;

    const volumeEl = this.container.querySelector('.stat-volume-value');
    if (volumeEl) {
      volumeEl.classList.add('pulse');
      setTimeout(() => volumeEl.classList.remove('pulse'), 400);
    }
  }

  destroy() {
    if (this.timer.interval) clearInterval(this.timer.interval);
    if (this.container) this.container.innerHTML = '';
  }
}
