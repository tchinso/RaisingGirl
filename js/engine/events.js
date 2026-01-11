import { EVENTS } from '../data.js';

export const EventEngine = {
    // 고정 이벤트 체크 (하루 시작/시간대 변경 시)
    checkFixedEvents(state) {
        const candidates = EVENTS.filter(e => e.type === 'fixed');
        
        for (const evt of candidates) {
            if (state.flags[evt.id]) continue; // 이미 본 이벤트

            if (evt.trigger.day && evt.trigger.day !== state.day) continue;
            if (evt.trigger.phase && evt.trigger.phase !== state.timePhase) continue;

            if (this.checkCondition(evt.condition, state)) {
                return evt;
            } else if (evt.failText) {
                // 조건 미달이지만 실패 텍스트가 있는 경우 (강제 이벤트)
                return { ...evt, isFail: true };
            }
        }
        return null;
    },

    // 랜덤 이벤트 체크 (하루 종료 시)
    checkRandomEvents(state, rng) {
        let chance = 25; // 기본 25%
        if (state.player.str >= 70) chance -= 10;
        if (state.char.mood >= 71) chance += 8;
        
        if (!rng.check(chance)) return null;

        const candidates = EVENTS.filter(e => e.type === 'random');
        if (candidates.length === 0) return null;

        // 단순 랜덤 (필터링 조건이 있다면 여기서 추가)
        const idx = rng.range(0, candidates.length - 1);
        return candidates[idx];
    },

    checkCondition(cond, state) {
        if (!cond) return true;

        const checkStat = (suffix = '') => {
            const statKey = cond[`stat${suffix}`];
            if (!statKey) return true;
            const [target, key] = statKey.split('.');
            const val = state[target][key];
            const gte = cond[`gte${suffix}`];
            const lte = cond[`lte${suffix}`];
            if (gte !== undefined && val < gte) return false;
            if (lte !== undefined && val > lte) return false;
            return true;
        };

        if (!checkStat('') || !checkStat('2') || !checkStat('3')) return false;

        if (cond.dayGte !== undefined && state.day < cond.dayGte) return false;
        if (cond.dayLte !== undefined && state.day > cond.dayLte) return false;

        if (cond.item) {
            if (!state.inventory[cond.item]) return false;
        }
        if (cond.flag) {
            const flagVal = state.flags[cond.flag] || 0;
            // flagGte: Greater Than or Equal (이상)
            if (cond.flagGte !== undefined) {
                if (flagVal < cond.flagGte) return false;
            } else if (flagVal <= 0) {
                return false;
            }
        }
        return true;
    }
};
