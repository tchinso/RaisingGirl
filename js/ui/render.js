import { ACTIONS, ITEMS } from '../data.js';
import { EventEngine } from '../engine/events.js';

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

            if (state.slotsLeft <= 0) isDisabled = true;
            if (limit && used >= limit) isDisabled = true;
            if (state.player.sta < (action.cost.sta || 0)) isDisabled = true;
            if (state.player.money < (action.cost.money || 0)) isDisabled = true;
            
            // 조건 체크 (req 필드가 있는 액션의 경우)
            if (action.req && !EventEngine.checkCondition(action.req, state)) isDisabled = true;

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
        const badgeBox = document.getElementById('char-image-badges');
        
        // [수정] 의상 티어(dressTier) 표시
        if (pGrid) {
            pGrid.innerHTML = `
                <div>생활기술(SKL): ${state.player.skl}</div>
                <div>LP2: ${state.player.lp2}</div>
                <div>덕행: ${state.player.virtue || 0}</div>
                <div>의상 레벨: ${state.player.dressTier || 0}</div>
            `;
        }
        
        // [수정] 개방도(OPN) 표시
        cGrid.innerHTML = `
            <div>호감(AFF): ${state.char.aff}</div>
            <div>신뢰(TRU): ${state.char.tru}</div>
            <div>개방(OPN): ${state.char.opn}</div>
            <div>기분(MOOD): ${state.char.mood}</div>
            <div>만족(SAT): ${state.char.sat}</div>
            <div>건강(HP): ${state.char.hp}</div>
            <div>트라우마(TRA): ${state.char.tra}</div>
        `;

        if (badgeBox) {
            const badges = [
                { label: "게임 시작", src: "img/1.jpg", show: true },
                { label: "9일차 아침 이후", src: "img/2.jpg", show: state.day >= 9 },
                { label: "17일차 아침 이후", src: "img/3.jpg", show: state.day >= 17 },
                { label: "flag_independent 보유", src: "img/4.jpg", show: (state.flags.flag_independent || 0) > 0 },
                { label: "flag_lover 보유", src: "img/5.jpg", show: (state.flags.flag_lover || 0) > 0 }
            ];

            badgeBox.innerHTML = badges
                .filter(badge => badge.show)
                .map(badge => `
                    <div class="badge-entry">
                        <img src="${badge.src}" alt="${badge.label}">
                        <span>${badge.label}</span>
                    </div>
                `)
                .join('');
        }
    },

    updateShop(state, onBuyClick) {
        const container = document.getElementById('shop-list');
        container.innerHTML = '';
        
        Object.values(ITEMS).forEach(item => {
            const el = document.createElement('div');
            el.className = 'card';
            
            const isReqMet = item.req ? EventEngine.checkCondition(item.req, state) : true;
            const hasMoney = state.player.money >= item.price;
            const canBuy = hasMoney && isReqMet;

            if (!canBuy) el.classList.add('disabled');

            let reqText = '';
            if (item.req && !isReqMet) {
                if (item.req.stat === 'char.aff') reqText = ` (호감 ${item.req.gte}↑)`;
                else if (item.req.stat === 'char.opn') reqText = ` (개방 ${item.req.gte}↑)`;
                else if (item.req.stat === 'char.tru') reqText = ` (신뢰 ${item.req.gte}↑)`;
                else if (item.req.stat === 'char.hp') reqText = ` (건강 ${item.req.gte}↑)`;
                else if (item.req.stat === 'char.sat') reqText = ` (만족 ${item.req.gte}↑)`;
                else if (item.req.flag === 'lover') reqText = ` (연인 상태)`;
            }

            // passive/consumable 표시 및 구매완료 표시
            const typeText = item.type === 'consumable' ? '소비형' : (state.inventory[item.id] ? '보유중' : '영구/소지형');

            el.innerHTML = `
                <div class="card-header">
                    <span>${item.name}</span>
                    <span>¥${item.price}</span>
                </div>
                <small>
                    ${typeText}
                    <span style="color: #d32f2f; font-weight: bold;">${reqText}</span>
                </small>
            `;
            // 보유중인 영구 아이템은 클릭 불가 처리 가능, 여기선 단순화
            if (canBuy) {
                el.onclick = () => onBuyClick(item.id);
            }
            container.appendChild(el);
        });
    }
};
