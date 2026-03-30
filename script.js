
let timeLeft = 25 * 60;
let timerInterval = null;
let isRunning = false;
let currentSession = 'focus';
let pomodorosCompleted = 0;

let tasks = [];
let currentTaskIndex = null; 

let stats = {
    todayPomodoros: 0,
    todayMinutes: 0,
    weekPomodoros: 0,
    weekMinutes: 0,
    streak: 0,
    lastStudyDate: null
};
    loadFromLocalStorage();
    checkAndUpdateStreak();
    updateTimerDisplay();
    renderTasks();
    updateStats();

function startTimer() {
    if (!isRunning) {
        isRunning = true;
        timerInterval = setInterval(updateTimer, 1000);
        document.getElementById('startBtn').textContent = '▶ Running...';
        document.getElementById('startBtn').disabled = true;
    }
}

function pauseTimer() {
    isRunning = false;
    clearInterval(timerInterval);
    document.getElementById('startBtn').textContent = '▶ Start';
    document.getElementById('startBtn').disabled = false;
}

function resetTimer() {
    pauseTimer();
    
    if (currentSession === 'focus') {
        timeLeft = 25 * 60;
    } else if (currentSession === 'shortBreak') {
        timeLeft = 5 * 60;
    } else {
        timeLeft = 15 * 60;
    }
    updateTimerDisplay();
}

function skipSession() {
    pauseTimer();
    switchSession();
}

function updateTimer() {
    if (timeLeft > 0) {
        timeLeft--;
        updateTimerDisplay();
    } else {
        pauseTimer();
        playSound();
        if (currentSession === 'focus') {
            pomodorosCompleted++;
            stats.todayPomodoros++;
            stats.weekPomodoros++;
            stats.todayMinutes += 25;
            stats.weekMinutes += 25;
            
            let today = new Date().toDateString();
            if (stats.lastStudyDate !== today) {
                if (stats.streak === 0) {
                    stats.streak = 1; 
                }
                stats.lastStudyDate = today;
            }
            if (currentTaskIndex !== null) {
                tasks[currentTaskIndex].completed++;
                updateCurrentTaskDisplay();
            }
            updateStats();
            saveToLocalStorage();
        }
        switchSession();
    }
}

function switchSession() {
    if (currentSession === 'focus') {
        if (pomodorosCompleted % 4 === 0 && pomodorosCompleted > 0) {
            currentSession = 'longBreak';
            timeLeft = 15 * 60;
        } else {
            currentSession = 'shortBreak';
            timeLeft = 5 * 60;
        }
    } else {
        currentSession = 'focus';
        timeLeft = 25 * 60;
    }
    
    updateSessionDisplay();
    updateTimerDisplay();
}

function updateTimerDisplay() {
    let minutes = Math.floor(timeLeft / 60);
    let seconds = timeLeft % 60;
    let displayTime = 
        String(minutes).padStart(2, '0') + ':' + 
        String(seconds).padStart(2, '0');

    document.getElementById('timerDisplay').textContent = displayTime;
}

function updateSessionDisplay() {
    let sessionText = '';
    
    if (currentSession === 'focus') {
        sessionText = 'FOCUS SESSION';
    } else if (currentSession === 'shortBreak') {
        sessionText = 'SHORT BREAK';
    } else {
        sessionText = 'LONG BREAK';
    }
    
    document.getElementById('sessionType').textContent = sessionText;
}

function playSound() {
    let audioContext = new (window.AudioContext || window.webkitAudioContext)();
    let oscillator = audioContext.createOscillator();
    let gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}


function toggleAddTaskForm() {
    let form = document.getElementById('addTaskForm');
    form.classList.toggle('active');
}

function addTask() {

    let name = document.getElementById('taskName').value;
    let subject = document.getElementById('taskSubject').value.trim();
    let description = document.getElementById('taskDescription').value;
    let pomodoros = parseInt(document.getElementById('taskPomodoros').value);
    
    if (name.trim() === '') {
        alert('Please enter a task name');
        return;
    }
    
    if (subject === '') {
        alert('Please enter a subject');
        return;
    }

    let task = {
        id: Date.now(), 
        name: name,
        subject: subject,
        description: description,
        totalPomodoros: pomodoros,
        completed: 0,
        isCompleted: false
    };
    
    tasks.push(task);
    
    document.getElementById('taskName').value = '';
    document.getElementById('taskSubject').value = '';
    document.getElementById('taskDescription').value = '';
    document.getElementById('taskPomodoros').value = '2';
    

    toggleAddTaskForm();
    
    renderTasks();
    updateStats();
    saveToLocalStorage();
}

function renderTasks() {
    let tasksList = document.getElementById('tasksList');
    tasksList.innerHTML = ''; 
    
    tasks.forEach((task, index) => {
        let subjectClass = 'subject-math';
        
        let taskHTML = `
            <div class="task-item ${task.isCompleted ? 'completed' : ''}">
                <input type="checkbox" class="task-checkbox" 
                       ${task.isCompleted ? 'checked' : ''} 
                       onchange="toggleTaskComplete(${index})">
                <div class="task-details" onclick="selectTask(${index})">
                    <div class="task-title">
                        <span class="subject-tag ${subjectClass}">${task.subject}</span>
                        ${task.name}
                    </div>
                    <div class="task-subject">${task.description}</div>
                </div>
                <div class="task-pomodoros">${task.completed}/${task.totalPomodoros} 🍅</div>
                <button class="delete-btn" onclick="deletetask(${index})">✖️</button>
            </div>
            
        `;
        tasksList.innerHTML += taskHTML;
    });
}

function toggleTaskComplete(index) {
    tasks[index].isCompleted = !tasks[index].isCompleted;
    
    renderTasks();
    updateStats();
    saveToLocalStorage();
}

function selectTask(index) {
    currentTaskIndex = index;
    updateCurrentTaskDisplay();
}

function updateCurrentTaskDisplay() {
    if (currentTaskIndex === null) {
        document.getElementById('currentTaskDisplay').textContent = 
            'Select a task from the list →';
        document.getElementById('currentTaskProgress').style.width = '0%';
        document.getElementById('currentTaskPomodoros').textContent = '0/0 🍅';
        return;
    }
    
    let task = tasks[currentTaskIndex];
    
    let subjectClass = 'subject-math';
    
    document.getElementById('currentTaskDisplay').innerHTML = `
        <span class="subject-tag ${subjectClass}">${task.subject}</span>
        ${task.name}
    `;

    let progress = (task.completed / task.totalPomodoros) * 100;
    document.getElementById('currentTaskProgress').style.width = progress + '%';

    document.getElementById('currentTaskPomodoros').textContent = 
        `${task.completed}/${task.totalPomodoros} 🍅`;
}

function updateStats() {
    document.getElementById('todayPomodoros').textContent = 
        stats.todayPomodoros + ' 🍅';
    
    let hours = Math.floor(stats.todayMinutes / 60);
    let minutes = stats.todayMinutes % 60;
    document.getElementById('todayTime').textContent = 
        hours + 'h ' + minutes + 'm';
    
    let completedTasks = tasks.filter(t => t.isCompleted).length;
    document.getElementById('todayTasks').textContent = 
        completedTasks + '/' + tasks.length;
    
    document.getElementById('weekPomodoros').textContent = stats.weekPomodoros;
    
    let weekHours = Math.floor(stats.weekMinutes / 60);
    document.getElementById('weekHours').textContent = weekHours + 'h';
    
    let completionRate = tasks.length > 0 ? 
        Math.round((completedTasks / tasks.length) * 100) : 0;
    document.getElementById('completionRate').textContent = completionRate + '%';
    
    document.getElementById('streakCount').textContent = stats.streak;
    document.getElementById('streak').textContent = 
        '🔥 ' + stats.streak + ' Day Streak';
}

function checkAndUpdateStreak() {
    let today = new Date().toDateString();
    
    if (stats.lastStudyDate === null) {
        stats.streak = 0;
        stats.lastStudyDate = today;
        saveToLocalStorage();
        return;
    }
    
    let lastDate = new Date(stats.lastStudyDate);
    let currentDate = new Date();
    
    lastDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);
    
    let diffTime = currentDate - lastDate;
    let diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return;
    } else if (diffDays === 1) {
        stats.streak++;
        stats.lastStudyDate = today;
        saveToLocalStorage();
    } else if (diffDays > 1) {
        stats.streak = 0;
        stats.lastStudyDate = today;
        saveToLocalStorage();
    }
}

function saveToLocalStorage() {

    localStorage.setItem('studyflow_tasks', JSON.stringify(tasks));
    
    localStorage.setItem('studyflow_stats', JSON.stringify(stats));
}

function loadFromLocalStorage() {
    let savedTasks = localStorage.getItem('studyflow_tasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
    }
    
    let savedStats = localStorage.getItem('studyflow_stats');
    if (savedStats) {
        stats = JSON.parse(savedStats);
    }
}

function formatTime(minutes) {
    let hours = Math.floor(minutes / 60);
    let mins = minutes % 60;
    return hours + 'h ' + mins + 'm';
}

function getCurrentDate() {
    return new Date().toDateString();
}

function deletetask(index)
{
    if(confirm(`are you sure you want to delete this??`)) {
        if(currentTaskIndex===index)
        {
            currentTaskIndex = null;
            updateCurrentTaskDisplay();
        }
        else if(currentTaskIndex>index)
        {
            currentTaskIndex --;
        }
        tasks.splice( index , 1 )
        renderTasks();
        updateStats();
        saveToLocalStorage();
    }
}