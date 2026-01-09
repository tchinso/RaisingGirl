import { GameState } from './engine/state.js';
import { SaveSystem } from './engine/save.js';
import { Render } from './ui/render.js';
import { EventEngine } from './engine/events.js';

const game = new GameState();
const SLOT_ID = 1;

// UI 초기화
function initTabs() {
    const tabs = document.querySelectorAll('#tabs button');
    tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#tabs button').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
            
            btn.classList.add('active');
            const target = btn.getAttribute('data-tab');
            document.getElementById(`screen-${target}`).style.display = 'block';
            
            renderAll();
        });
    });
}

function showEventModal(evt) {
    const overlay = document.getElementById('modal-overlay');
    const title = document.getElementById('modal-title');
    const desc = document.getElementById('modal-desc');
    const choicesBox = document.getElementById('modal-choices');

    overlay.classList.remove('hidden');
    title.textContent = evt.isFail ? "이벤트 (조건 미달)" : (evt.name || "이벤트 발생");
    desc.innerText = evt.isFail ? evt.failText : evt.text;
    choicesBox.innerHTML = '';

    const choices = evt.isFail ? [] : evt.choices;
    
    if (!choices || choices.length === 0) {
        const btn = document.createElement('button');
        btn.textContent = "확인";
        btn.onclick = () => {
            applyEventEffects(evt.isFail ? evt.failEffects : null);
            overlay.classList.add('hidden');
            game.data.flags[evt.id] = true;
            renderAll();
            saveNow();
        };
        choicesBox.appendChild(btn);
    } else {
        choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.textContent = choice.text;
            btn.onclick = () => {
                applyEventEffects(choice.effects);
                overlay.classList.add('hidden');
                game.data.flags[evt.id] = true;
                if(choice.next) { /* 다음 이벤트 체인 로직이 있다면 여기서 처리 */ }
                renderAll();
                saveNow();
            };
            choicesBox.appendChild(btn);
        });
    }
}

function applyEventEffects(effects) {
    if (!effects) return;
    const p = game.data.player;
    const c = game.data.char;

    if (effects.aff) c.aff += effects.aff;
    if (effects.hp) c.hp += effects.hp;
    if (effects.mood) c.mood += effects.mood;
    if (effects.tra) c.tra += effects.tra;
    if (effects.str) p.str += effects.str;
    if (effects.badFlag) game.data.flags.badFlag = (game.data.flags.badFlag || 0) + effects.badFlag;
    
    // 단순화된 메시지 처리
    game.log("이벤트 결과가 적용되었습니다.");
}

function handleAction(actionId) {
    if (actionId === 'system_next_phase') {
        const prevPhase = game.data.timePhase;
        game.advanceTime();
        const currPhase = game.data.timePhase;

        // 1. 고정 이벤트 (시간대가 바뀌었을 때)
        const fixedEvt = EventEngine.checkFixedEvents(game.data);
        if (fixedEvt) {
            showEventModal(fixedEvt);
            // 모달이 떠도 렌더링은 해야 함
            renderAll();
            return;
        }

        // 2. 랜덤 이벤트 (하루가 지났고 아침이 되었을 때)
        if (prevPhase !== 'morning' && currPhase === 'morning') {
            const randEvt = EventEngine.checkRandomEvents(game.data, game.rng);
            if (randEvt) {
                showEventModal(randEvt);
            }
        }

    } else {
        game.executeAction(actionId);
    }
    
    saveAuto();
    renderAll();
}

function handleBuy(itemId) {
    game.buyItem(itemId);
    saveAuto();
    renderAll();
}

function renderAll() {
    Render.updateStatus(game.data);
    Render.updateActionList(game.data, handleAction);
    Render.updateLog(game.data);
    Render.updateStats(game.data);
    Render.updateShop(game.data, handleBuy);
}

const saveAuto = SaveSystem.createAutoSaver(SLOT_ID, () => game.export());
const saveNow = () => SaveSystem.saveRun(SLOT_ID, game.data);

async function initGame() {
    const saved = SaveSystem.loadRun(SLOT_ID);
    if (saved) {
        console.log("세이브 로드");
        game.load(saved);
    } else {
        console.log("새 게임");
    }
    
    initTabs();
    
    document.getElementById('btn-save').onclick = () => {
        saveNow();
        alert('저장되었습니다.');
    };
    
    document.getElementById('btn-reset').onclick = () => {
        if(confirm("초기화 하시겠습니까?")) {
            localStorage.clear();
            location.reload();
        }
    };

    renderAll();
}

window.addEventListener('DOMContentLoaded', initGame);