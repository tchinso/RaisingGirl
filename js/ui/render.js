import { ACTIONS, ITEMS } from '../data.js';

export const Render = {
    updateStatus(state) {
        document.getElementById('day-display').textContent = `Day ${state.day}`;
        const phaseMap = { morning: "아침", day: "낮", evening: "저녁", night: "밤", late: "심야" };
        document.getElementById('phase-display').textContent = phaseMap[state.timePhase];
        document.getElementById('slots-display').textContent = `행동력 ${state.slotsLeft}`;
        
        document.getElementById('money-val').textContent = state.player.money.toLocaleString();
        document.getElementById('sta-val').textContent = `${state.player.sta}/${state.player.maxSta}`;
        document.getElementById('str-val').textContent = state.player.str;
    },

    updateActionList(state, onActionClick) {
        const container = document.getElementById('action-list');
        container.innerHTML = '';

        Object.values(ACTIONS).forEach(action => {
            if (!action.phases.includes(state.timePhase) && !action.phases.includes('all')) return;
            if (action.id.startsWith('system')) return;

            const btn = document.createElement('div');
            btn.className = 'card';
            
            let costText = [];
            if (action.cost.sta) costText.push(`STA -${action.cost.sta}`);
            if (action.cost.money) costText.push(`¥${action.cost.money}`);
            
            const used = state.dailyLimits[action.id] || 0;
            const limit = action.limits?.daily;
            let isDisabled = false;

            if (limit && used >= limit) isDisabled = true;
            if (state.player.sta < (action.cost.sta || 0)) isDisabled = true;
            if (state.player.money < (action.cost.money || 0)) isDisabled = true;

            if (isDisabled) btn.classList.add('disabled');

            btn.innerHTML = `
                <div class="card-header">
                    <span>${action.name}</span>
                    <span class="card-cost">${costText.join(', ')}</span>
                </div>
                <small>${action.tags ? action.tags.join(' / ') : ''} ${limit ? `(${used}/${limit})` : ''}</small>
            `;

            if (!isDisabled) {
                btn.onclick = () => onActionClick(action.id);
            }
            container.appendChild(btn);
        });

        // "시간 보내기" 버튼 (슬롯이 남았어도 강제로 넘길 수 있게 할 수도 있고, 0일 때만 띄울 수도 있음. 여기선 0일 때)
        if (state.slotsLeft <= 0) {
            const nextBtn = document.createElement('div');
            nextBtn.className = 'card';
            nextBtn.style.background = '#e3f2fd';
            nextBtn.innerHTML = `<div class="card-header" style="color:#1565c0; justify-content:center;">시간 보내기 (다음 단계) >></div>`;
            nextBtn.onclick = () => onActionClick('system_next_phase');
            container.appendChild(nextBtn);
        }
    },

    updateLog(state) {
        const logBox = document.getElementById('log-display');
        logBox.innerHTML = state.log.join('<br>');
    },

    updateStats(state) {
        const pGrid = document.getElementById('player-stats-grid');
        const cGrid = document.getElementById('char-stats-grid');
        
        pGrid.innerHTML = `
            <div>생활기술(SKL): ${state.player.skl}</div>
            <div>LP2: ${state.player.lp2}</div>
            <div>덕행: ${state.player.virtue || 0}</div>
        `;
        
        cGrid.innerHTML = `
            <div>호감(AFF): ${state.char.aff}</div>
            <div>신뢰(TRU): ${state.char.tru}</div>
            <div>기분(MOOD): ${state.char.mood}</div>
            <div>만족(SAT): ${state.char.sat}</div>
            <div>건강(HP): ${state.char.hp}</div>
            <div>트라우마(TRA): ${state.char.tra}</div>
        `;
    },

    updateShop(state, onBuyClick) {
        const container = document.getElementById('shop-list');
        container.innerHTML = '';
        
        Object.values(ITEMS).forEach(item => {
            const el = document.createElement('div');
            el.className = 'card';
            const canBuy = state.player.money >= item.price;
            if (!canBuy) el.classList.add('disabled');

            el.innerHTML = `
                <div class="card-header">
                    <span>${item.name}</span>
                    <span>¥${item.price}</span>
                </div>
                <small>${item.type === 'consumable' ? '소비형' : '영구/소지형'}</small>
            `;
            if (canBuy) {
                el.onclick = () => onBuyClick(item.id);
            }
            container.appendChild(el);
        });
    }
};