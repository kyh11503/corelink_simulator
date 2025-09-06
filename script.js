// 강화 시스템 시뮬레이터
class EnhancementSimulator {
    constructor() {
        // 강화 확률 테이블 (레벨별 성공률)
        this.successRates = {
            0: 100, 1: 100, 2: 100, 3: 95, 4: 95, 5: 95, 6: 95,
            7: 90, 8: 90, 9: 90, 10: 90, 11: 85, 12: 85, 13: 85, 14: 85,
            15: 80, 16: 80, 17: 80, 18: 80, 19: 75, 20: 75, 21: 75, 22: 75, 23: 75,
            24: 70, 25: 70, 26: 70, 27: 70, 28: 70, 29: 65, 30: 65, 31: 65, 32: 65, 33: 65,
            34: 60, 35: 60, 36: 60, 37: 60, 38: 60, 39: 55, 40: 55, 41: 55, 42: 55
        };

        // 게임 상태 초기화
        this.gameState = {
            // 현재 강화 상태
            coreLinkLevel: 0,
            failureCount: 0,
            stats: {
                attack: 0,
                defense: 0,
                health: 0,
                speed: 0,
                critical: 0,
                accuracy: 0,
                evasion: 0
            },
            
            // 총 소모량 추적 (초기화 시에도 유지)
            totalConsumedResources: {
                materials: 0,
                credits: 0,
                diamonds: 0,
                tickets: 0
            },
            
            // 현재 세션 소모량 추적 (초기화 시 환급 계산용)
            currentSessionResources: {
                materials: 0,
                credits: 0
            }
        };

        // 능력치 이름 매핑
        this.statNames = {
            attack: '공격력',
            defense: '방어력',
            health: '체력',
            speed: '속도',
            critical: '치명타',
            accuracy: '명중률',
            evasion: '회피율'
        };

        this.initializeUI();
        this.bindEvents();
        this.updateUI();
    }

    // UI 초기화
    initializeUI() {
        this.elements = {
            coreLinkLevel: document.getElementById('core-link-level'),
            levelProgress: document.getElementById('level-progress'),
            currentSuccessRate: document.getElementById('current-success-rate'),
            failureCount: document.getElementById('failure-count'),
            enhanceBtn: document.getElementById('enhance-btn'),
            resetDiamondBtn: document.getElementById('reset-diamond-btn'),
            resetTicketBtn: document.getElementById('reset-ticket-btn'),
            fullResetBtn: document.getElementById('full-reset-btn'),
            logContainer: document.getElementById('log-container'),
            // 소모된 재화 요소들
            consumedMaterials: document.getElementById('consumed-materials'),
            consumedCredits: document.getElementById('consumed-credits'),
            consumedDiamonds: document.getElementById('consumed-diamonds'),
            consumedTickets: document.getElementById('consumed-tickets'),
            refundPreview: document.getElementById('refund-preview')
        };
    }

    // 이벤트 바인딩
    bindEvents() {
        this.elements.enhanceBtn.addEventListener('click', () => this.attemptEnhancement());
        this.elements.resetDiamondBtn.addEventListener('click', () => this.resetWithDiamond());
        this.elements.resetTicketBtn.addEventListener('click', () => this.resetWithTicket());
        this.elements.fullResetBtn.addEventListener('click', () => this.fullReset());
        
        // 탭 전환 이벤트
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
        
        // 기댓값 계산 버튼 이벤트
        document.getElementById('calculate-expectation-btn').addEventListener('click', () => this.calculateExpectation());
    }

    // 강화 시도
    attemptEnhancement() {
        // 실패 횟수 확인
        if (this.gameState.failureCount >= 5) {
            this.addLog('누적 실패 횟수가 5회에 도달했습니다. 더 이상 강화할 수 없습니다.', 'info');
            return;
        }

        // 소모량 추적 (시뮬레이터에서는 실제 재화 차감하지 않음)
        this.gameState.totalConsumedResources.materials += 1;
        this.gameState.totalConsumedResources.credits += 30000;
        this.gameState.currentSessionResources.materials += 1;
        this.gameState.currentSessionResources.credits += 30000;

        // 강화 성공 여부 결정
        const successRate = this.getCurrentSuccessRate();
        const isSuccess = Math.random() * 100 < successRate;

        if (isSuccess) {
            this.handleEnhancementSuccess();
        } else {
            this.handleEnhancementFailure();
        }

        this.updateUI();
    }

    // 강화 성공 처리
    handleEnhancementSuccess() {
        // 코어 링크 레벨 상승
        this.gameState.coreLinkLevel += 1;
        // 누적 실패 횟수는 초기화하지 않음 (전체 강화 시도 중 누적)

        // 랜덤 능력치 선택 및 강화
        const availableStats = this.getAvailableStats();
        if (availableStats.length > 0) {
            const randomStat = availableStats[Math.floor(Math.random() * availableStats.length)];
            this.gameState.stats[randomStat] += 1;
            
            this.addLog(`강화 성공! ${this.statNames[randomStat]}이(가) ${this.gameState.stats[randomStat]}/6로 상승했습니다.`, 'success');
        } else {
            this.addLog('강화 성공! 모든 능력치가 최대 레벨에 도달했습니다.', 'success');
        }

        // 특정 레벨 달성 시 추가 옵션 알림
        this.checkSpecialLevels();
    }

    // 강화 실패 처리
    handleEnhancementFailure() {
        this.gameState.failureCount += 1;
        this.addLog(`강화 실패! 누적 실패 횟수: ${this.gameState.failureCount}/5`, 'failure');

        if (this.gameState.failureCount >= 5) {
            this.addLog('누적 실패 횟수가 5회에 도달했습니다. 초기화가 필요합니다.', 'info');
        }
    }

    // 강화 가능 여부 확인 (시뮬레이터에서는 실패 횟수만 확인)
    canEnhance() {
        return this.gameState.failureCount < 5;
    }

    // 현재 성공률 반환
    getCurrentSuccessRate() {
        return this.successRates[this.gameState.coreLinkLevel] || 55;
    }

    // 강화 가능한 능력치 목록 반환
    getAvailableStats() {
        return Object.keys(this.gameState.stats).filter(stat => 
            this.gameState.stats[stat] < 6
        );
    }

    // 특정 레벨 달성 시 추가 옵션 확인
    checkSpecialLevels() {
        const specialLevels = [10, 20, 30, 40];
        if (specialLevels.includes(this.gameState.coreLinkLevel)) {
            this.addLog(`축하합니다! 코어 링크 레벨 ${this.gameState.coreLinkLevel} 달성! 추가 옵션을 획득했습니다.`, 'success');
        }
    }

    // 다이아로 초기화
    resetWithDiamond() {
        if (confirm('500 다이아를 사용하여 강화 상태를 초기화하시겠습니까?')) {
            // 총 소모량에 추가
            this.gameState.totalConsumedResources.diamonds += 500;
            this.performReset();
            this.addLog('다이아를 사용하여 초기화했습니다.', 'reset');
        }
    }

    // 초기화권으로 초기화
    resetWithTicket() {
        if (confirm('초기화권 1개를 사용하여 강화 상태를 초기화하시겠습니까?')) {
            // 총 소모량에 추가
            this.gameState.totalConsumedResources.tickets += 1;
            this.performReset();
            this.addLog('초기화권을 사용하여 초기화했습니다.', 'reset');
        }
    }

    // 초기화 실행
    performReset() {
        // 현재 세션에서 소모한 강화 재료의 50% 환급 계산
        const refundAmount = Math.floor(this.gameState.currentSessionResources.materials * 0.5);
        
        // 환급된 만큼 총 소모량에서 차감
        this.gameState.totalConsumedResources.materials -= refundAmount;
        
        // 상태 초기화
        this.gameState.coreLinkLevel = 0;
        this.gameState.failureCount = 0;
        
        // 모든 능력치를 0으로 초기화
        Object.keys(this.gameState.stats).forEach(stat => {
            this.gameState.stats[stat] = 0;
        });

        // 현재 세션 소모량 리셋 (새로운 세션 시작)
        this.gameState.currentSessionResources = {
            materials: 0,
            credits: 0
        };

        this.addLog(`초기화 완료! 현재 세션에서 강화 재료 ${refundAmount}개가 환급되었습니다.`, 'reset');
        this.updateUI();
    }

    // 전체 초기화 (모든 정보 리셋)
    fullReset() {
        if (confirm('정말로 모든 정보를 초기화하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 모든 강화 상태와 소모량이 완전히 리셋됩니다.')) {
            // 게임 상태를 완전히 초기화
            this.gameState = {
                // 현재 강화 상태
                coreLinkLevel: 0,
                failureCount: 0,
                stats: {
                    attack: 0,
                    defense: 0,
                    health: 0,
                    speed: 0,
                    critical: 0,
                    accuracy: 0,
                    evasion: 0
                },
                
                // 총 소모량 추적 (완전히 리셋)
                totalConsumedResources: {
                    materials: 0,
                    credits: 0,
                    diamonds: 0,
                    tickets: 0
                },
                
                // 현재 세션 소모량 추적 (완전히 리셋)
                currentSessionResources: {
                    materials: 0,
                    credits: 0
                }
            };

            // 로그 초기화
            this.elements.logContainer.innerHTML = '<p class="log-entry info">새로운 분석이 시작되었습니다.</p>';

            // UI 업데이트
            this.updateUI();

            this.addLog('모든 정보가 초기화되었습니다. 새로운 분석을 시작할 수 있습니다.', 'reset');
        }
    }

    // UI 업데이트
    updateUI() {
        // 총 소모량 표시 업데이트
        this.elements.consumedMaterials.textContent = this.gameState.totalConsumedResources.materials.toLocaleString();
        this.elements.consumedCredits.textContent = this.gameState.totalConsumedResources.credits.toLocaleString();
        this.elements.consumedDiamonds.textContent = this.gameState.totalConsumedResources.diamonds.toLocaleString();
        this.elements.consumedTickets.textContent = this.gameState.totalConsumedResources.tickets.toLocaleString();

        // 환급 예상량 업데이트 (현재 세션 기준)
        const refundAmount = Math.floor(this.gameState.currentSessionResources.materials * 0.5);
        this.elements.refundPreview.textContent = refundAmount.toLocaleString();

        // 코어 링크 레벨 업데이트
        this.elements.coreLinkLevel.textContent = this.gameState.coreLinkLevel;
        
        // 레벨 진행률 업데이트 (43레벨 기준: 0~42레벨)
        const progressPercentage = ((this.gameState.coreLinkLevel + 1) / 43) * 100;
        this.elements.levelProgress.style.width = `${progressPercentage}%`;

        // 성공률 업데이트
        this.elements.currentSuccessRate.textContent = `${this.getCurrentSuccessRate()}%`;

        // 실패 횟수 업데이트
        this.elements.failureCount.textContent = this.gameState.failureCount;

        // 강화 버튼 상태 업데이트
        this.elements.enhanceBtn.disabled = !this.canEnhance();

        // 능력치 표시 업데이트
        this.updateStatsDisplay();
    }

    // 능력치 표시 업데이트
    updateStatsDisplay() {
        Object.keys(this.gameState.stats).forEach(statKey => {
            const statItem = document.querySelector(`[data-stat="${statKey}"]`);
            const levelIndicators = statItem.querySelectorAll('.level-indicator');
            const levelText = statItem.querySelector('.stat-level-text');
            
            const currentLevel = this.gameState.stats[statKey];
            
            // 레벨 인디케이터 업데이트
            levelIndicators.forEach((indicator, index) => {
                indicator.classList.remove('active', 'maxed');
                
                if (index < currentLevel) {
                    if (currentLevel === 6) {
                        indicator.classList.add('maxed');
                    } else {
                        indicator.classList.add('active');
                    }
                }
            });
            
            // 레벨 텍스트 업데이트
            levelText.textContent = `${currentLevel}/6`;
        });
    }

    // 로그 추가
    addLog(message, type = 'info') {
        const logEntry = document.createElement('p');
        logEntry.className = `log-entry ${type}`;
        logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        
        this.elements.logContainer.appendChild(logEntry);
        this.elements.logContainer.scrollTop = this.elements.logContainer.scrollHeight;
    }

    // 게임 상태 저장 (로컬 스토리지)
    saveGameState() {
        localStorage.setItem('enhancementSimulator', JSON.stringify(this.gameState));
    }

    // 게임 상태 불러오기 (로컬 스토리지)
    loadGameState() {
        const savedState = localStorage.getItem('enhancementSimulator');
        if (savedState) {
            this.gameState = { ...this.gameState, ...JSON.parse(savedState) };
            this.updateUI();
            this.addLog('게임 상태를 불러왔습니다.', 'info');
        }
    }

    // 탭 전환
    switchTab(tabName) {
        // 모든 탭 버튼과 콘텐츠 비활성화
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // 선택된 탭 활성화
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    // 기댓값 계산
    async calculateExpectation() {
        const resetMethod = document.getElementById('reset-method-select').value;
        const simulationCount = parseInt(document.getElementById('simulation-count-input').value);
        
        // UI 상태 변경
        const calculateBtn = document.getElementById('calculate-expectation-btn');
        const progressDiv = document.getElementById('expectation-progress');
        const resultsDiv = document.getElementById('expectation-results');
        
        calculateBtn.disabled = true;
        calculateBtn.textContent = '계산 중...';
        progressDiv.style.display = 'block';
        resultsDiv.style.display = 'none';
        
        try {
            // 시뮬레이션 실행
            const results = await this.runExpectationSimulation(simulationCount, resetMethod);
            
            // 결과 표시
            this.displayExpectationResults(results, simulationCount, resetMethod);
            
        } catch (error) {
            console.error('기댓값 계산 중 오류:', error);
            alert('계산 중 오류가 발생했습니다.');
        } finally {
            // UI 상태 복원
            calculateBtn.disabled = false;
            calculateBtn.textContent = '기댓값 계산';
            progressDiv.style.display = 'none';
            resultsDiv.style.display = 'block';
        }
    }

    // 기댓값 시뮬레이션 실행
    async runExpectationSimulation(simulationCount, resetMethod) {
        const levelData = {};
        
        // 각 레벨별 데이터 초기화
        for (let level = 0; level <= 42; level++) {
            levelData[level] = {
                attempts: [],
                materials: [],
                credits: [],
                resets: [],
                diamonds: [],
                tickets: [],
                successCount: 0,
                noResetCount: 0  // 초기화 없이 도달한 횟수
            };
        }
        
        const startTime = Date.now();
        
        for (let i = 0; i < simulationCount; i++) {
            // 각 레벨까지의 시뮬레이션 실행
            for (let targetLevel = 0; targetLevel <= 42; targetLevel++) {
                const result = this.runSingleSimulation(targetLevel, resetMethod);
                
                if (result.success) {
                    levelData[targetLevel].attempts.push(result.attempts);
                    levelData[targetLevel].materials.push(result.materials);
                    levelData[targetLevel].credits.push(result.credits);
                    levelData[targetLevel].resets.push(result.resets);
                    levelData[targetLevel].diamonds.push(result.diamonds);
                    levelData[targetLevel].tickets.push(result.tickets);
                    levelData[targetLevel].successCount++;
                    
                    // 초기화 없이 도달한 경우 카운트
                    if (result.resets === 0) {
                        levelData[targetLevel].noResetCount++;
                    }
                }
            }
            
            // 진행률 업데이트
            if (i % 100 === 0) {
                const progress = ((i + 1) / simulationCount) * 100;
                document.getElementById('expectation-progress-fill').style.width = `${progress}%`;
                document.getElementById('expectation-progress-text').textContent = 
                    `계산 중... ${i + 1} / ${simulationCount} 시뮬레이션 완료`;
                
                // UI 업데이트를 위한 작은 지연
                await new Promise(resolve => setTimeout(resolve, 1));
            }
        }
        
        const totalTime = Date.now() - startTime;
        return { levelData, totalTime };
    }

    // 단일 시뮬레이션 실행
    runSingleSimulation(targetLevel, resetMethod) {
        const gameState = {
            coreLinkLevel: 0,
            failureCount: 0,
            stats: {
                attack: 0, defense: 0, health: 0, speed: 0,
                critical: 0, accuracy: 0, evasion: 0
            },
            totalConsumedResources: {
                materials: 0, credits: 0, diamonds: 0, tickets: 0
            },
            currentSessionResources: {
                materials: 0, credits: 0
            }
        };

        let attempts = 0;
        let resets = 0;

        while (gameState.coreLinkLevel < targetLevel) {
            // 강화 시도
            const success = this.attemptEnhancementSimulation(gameState);
            attempts++;

            // 실패 횟수가 5회가 되면 초기화
            if (gameState.failureCount >= 5) {
                this.performResetSimulation(gameState, resetMethod);
                resets++;
            }
        }

        return {
            attempts,
            resets,
            materials: gameState.totalConsumedResources.materials,
            credits: gameState.totalConsumedResources.credits,
            diamonds: gameState.totalConsumedResources.diamonds,
            tickets: gameState.totalConsumedResources.tickets,
            success: gameState.coreLinkLevel >= targetLevel
        };
    }

    // 시뮬레이션용 강화 시도
    attemptEnhancementSimulation(gameState) {
        const successRate = this.successRates[gameState.coreLinkLevel] || 55;
        const isSuccess = Math.random() * 100 < successRate;

        // 소모량 추적
        gameState.totalConsumedResources.materials += 1;
        gameState.totalConsumedResources.credits += 30000;
        gameState.currentSessionResources.materials += 1;
        gameState.currentSessionResources.credits += 30000;

        if (isSuccess) {
            gameState.coreLinkLevel += 1;
            // 랜덤 능력치 강화
            const availableStats = Object.keys(gameState.stats).filter(stat => 
                gameState.stats[stat] < 6
            );
            if (availableStats.length > 0) {
                const randomStat = availableStats[Math.floor(Math.random() * availableStats.length)];
                gameState.stats[randomStat] += 1;
            }
        } else {
            gameState.failureCount += 1;
        }

        return isSuccess;
    }

    // 시뮬레이션용 초기화 실행
    performResetSimulation(gameState, resetMethod) {
        // 현재 세션에서 소모한 강화 재료의 50% 환급
        const refundAmount = Math.floor(gameState.currentSessionResources.materials * 0.5);
        gameState.totalConsumedResources.materials -= refundAmount;

        // 초기화 비용 추가
        if (resetMethod === 'diamond') {
            gameState.totalConsumedResources.diamonds += 500;
        } else {
            gameState.totalConsumedResources.tickets += 1;
        }

        // 상태 초기화
        gameState.coreLinkLevel = 0;
        gameState.failureCount = 0;
        Object.keys(gameState.stats).forEach(stat => {
            gameState.stats[stat] = 0;
        });
        gameState.currentSessionResources = { materials: 0, credits: 0 };
    }

    // 기댓값 결과 표시
    displayExpectationResults(data, simulationCount, resetMethod) {
        const { levelData, totalTime } = data;
        const tbody = document.getElementById('expectation-table-body');
        tbody.innerHTML = '';

        for (let level = 0; level <= 42; level++) {
            const data = levelData[level];
            if (data.successCount === 0) continue;

            const avgAttempts = this.calculateAverage(data.attempts);
            const avgMaterials = this.calculateAverage(data.materials);
            const avgCredits = this.calculateAverage(data.credits);
            const avgResets = this.calculateAverage(data.resets);
            const avgDiamonds = this.calculateAverage(data.diamonds);
            const avgTickets = this.calculateAverage(data.tickets);
            const noResetRate = (data.noResetCount / simulationCount) * 100;

            // 레벨별 CSS 클래스 결정
            let levelClass = '';
            if (level <= 10) levelClass = 'level-1-10';
            else if (level <= 20) levelClass = 'level-11-20';
            else if (level <= 30) levelClass = 'level-21-30';
            else levelClass = 'level-31-42';

            const row = document.createElement('tr');
            row.className = levelClass;
            
            row.innerHTML = `
                <td class="level">${level}</td>
                <td class="number">${avgAttempts.toFixed(4)}</td>
                <td class="number">${avgMaterials.toFixed(4)}</td>
                <td class="number">${avgCredits.toFixed(4)}</td>
                <td class="number">${avgResets.toFixed(4)}</td>
                <td class="number">${resetMethod === 'diamond' ? avgDiamonds.toFixed(4) : avgTickets.toFixed(4)}</td>
                <td class="percentage">${noResetRate.toFixed(4)}%</td>
            `;

            tbody.appendChild(row);
        }

        // 요약 정보 업데이트
        document.getElementById('summary-simulations').textContent = simulationCount.toLocaleString();
        document.getElementById('summary-method').textContent = resetMethod === 'diamond' ? '다이아 (500개)' : '초기화권 (1개)';
        document.getElementById('summary-time').textContent = `${(totalTime / 1000).toFixed(4)}초`;
    }

    // 평균 계산
    calculateAverage(numbers) {
        return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    }
}

// 페이지 로드 시 시뮬레이터 초기화
document.addEventListener('DOMContentLoaded', () => {
    const simulator = new EnhancementSimulator();
    
    // 페이지 언로드 시 게임 상태 저장
    window.addEventListener('beforeunload', () => {
        simulator.saveGameState();
    });
    
    // 주기적으로 게임 상태 저장 (5분마다)
    setInterval(() => {
        simulator.saveGameState();
    }, 5 * 60 * 1000);
    
    // 저장된 게임 상태 불러오기
    simulator.loadGameState();
});
