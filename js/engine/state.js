import { CONSTANTS, ACTIONS, ITEMS } from '../data.js';
import { Rules, Utils } from './rules.js';
import { SeededRNG } from './rng.js';
import { EventEngine } from './events.js';

export class GameState {
    constructor() {
        this.data = {
            day: 1,
            timePhase: 'morning',
            slotsLeft: 3,
            player: { ...CONSTANTS.START_STATS.player },
            char: { ...CONSTANTS.START_STATS.char },
            inventory: {},
            dailyLimits: {},
            flags: {}, 
            log: [],
            rngSeed: Date.now()
        };
        this.rng = new SeededRNG(this.data.rngSeed);
    }

    load(savedData) {
        this.data = savedData.state;
        this.rng = new SeededRNG(savedData.rng);
    }

    export() {
        return {
            state: this.data,
            rng: this.rng.getState()
        };
    }

    log(msg) {
        this.data.log.unshift(`[Day ${this.data.day} ${this.data.timePhase}] ${msg}`);
        if (this.data.log.length > 25) this.data.log.pop();
    }

    executeAction(actionId) {
        const action = ACTIONS[actionId];
        const p = this.data.player;
        const c = this.data.char;

        // 비용
        if (action.cost.sta) p.sta -= action.cost.sta;
        if (action.cost.money) p.money -= action.cost.money;
        if (action.cost.str) p.str += action.cost.str;

        // 성공 판정
        let success = true;
        if (action.fail) {
            const chance = Rules.calcSuccessRate(100 - (action.fail.chance * 100), c);
            if (!this.rng.check(chance)) success = false;
        }

        // 결과 적용
        const gain = success ? action.gain : (action.fail?.onFailGain || {});
        
        if (gain.money === 'formula_parttime') {
            const pay = Rules.calcPartTimePay('medium', p, this.data.inventory);
            p.money += pay;
            this.log(`알바 완료: +¥${pay}`);
        } else if (gain.money) p.money += gain.money;
        
        if (gain.str) p.str += gain.str;
        if (gain.maxSta) p.maxSta += gain.maxSta;

        if (gain.aff) c.aff += gain.aff;
        if (gain.tru) c.tru += gain.tru;
        if (gain.mood) c.mood += gain.mood;
        if (gain.sat) c.sat += gain.sat;
        if (gain.hp) c.hp += gain.hp;
        if (gain.tra) c.tra += gain.tra;
        
        // [수정] 개방도(OPN) 로직 구현
        if (gain.opn) c.opn += gain.opn;

        // [신규] 친밀 세션 동적 보상 (dressTier * 20)
        if (actionId === 'intimacy_session') {
            const tier = p.dressTier || 0;
            const opnBonus = 20 * tier;
            if (opnBonus > 0) {
                c.opn += opnBonus;
                this.log(`의상 효과로 개방도 대폭 상승! (+${opnBonus})`);
            }
        }

        // 클램프
        p.sta = Utils.clamp(p.sta, 0, p.maxSta);
        p.str = Utils.clamp(p.str, 0, 100);
        c.mood = Utils.clamp(c.mood, -100, 100);
        c.sat = Utils.clamp(c.sat, 0, 100);
        c.hp = Utils.clamp(c.hp, 0, 100);
        // opn은 상한 없음 (또는 매우 높게)
        if (c.opn < 0) c.opn = 0;

        // 슬롯 차감
        this.data.slotsLeft -= (action.cost.slot !== undefined ? action.cost.slot : 1);

        // 일일 제한
        if (action.limits?.daily) {
            this.data.dailyLimits[actionId] = (this.data.dailyLimits[actionId] || 0) + 1;
        }

        this.log(`${action.name} 실행.`);
    }

    buyItem(itemId) {
        const item = ITEMS[itemId];

        if (item.req) {
            if (!EventEngine.checkCondition(item.req, this.data)) {
                this.log(`조건 미달: ${item.name}을(를) 구매할 수 없습니다.`);
                return;
            }
        }

        if (this.data.player.money >= item.price) {
            this.data.player.money -= item.price;
            this.data.inventory[itemId] = (this.data.inventory[itemId] || 0) + 1;
            
            // 효과 적용
            if (item.effects) {
                const eff = item.effects;
                if (eff.sta) this.data.player.sta += eff.sta;
                if (eff.str) this.data.player.str += eff.str;
                if (eff.mood) this.data.char.mood += eff.mood;
                
                // [신규] dressTier 증가
                if (eff.dressTier) {
                    this.data.player.dressTier = (this.data.player.dressTier || 0) + eff.dressTier;
                }
                
                // [신규] bookTier 증가 (기존 로직에는 명시적 처리가 없었음, effects 객체 활용)
                if (eff.bookTier) {
                    this.data.player.bookTier = (this.data.player.bookTier || 0) + eff.bookTier;
                }
            }

            if (item.type === 'consumable') {
                this.data.inventory[itemId]--;
                this.log(`${item.name} 사용.`);
            } else {
                this.log(`${item.name} 구매.`);
            }
            this.data.player.sta = Utils.clamp(this.data.player.sta, 0, this.data.player.maxSta);
        } else {
            this.log("돈이 부족합니다.");
        }
    }

    advanceTime() {
        if (this.data.slotsLeft > 0) return;

        const phases = CONSTANTS.PHASES;
        const currentIdx = phases.indexOf(this.data.timePhase);

        if (currentIdx < phases.length - 1) {
            this.data.timePhase = phases[currentIdx + 1];
            this.data.slotsLeft = Rules.getSlotsForPhase(this.data.timePhase, this.data.inventory);
            this.log(`시간 변경: ${this.data.timePhase}`);
        } else {
            this.endDay();
        }
    }

    endDay() {
        this.log(`Day ${this.data.day} 종료.`);
        
        // 자연 변화
        this.data.char.sat -= 2;
        this.data.char.tra -= 1;
        this.data.char.mood = Math.round(this.data.char.mood * 0.9);

        // 번아웃
        if (this.data.player.str >= 90 && this.rng.check(30)) {
            this.log("⚠️ 번아웃! 컨디션 난조.");
        }

        this.data.day++;
        this.data.timePhase = 'morning';
        this.data.slotsLeft = Rules.getSlotsForPhase('morning');
        this.data.dailyLimits = {};
        
        this.log(`Day ${this.data.day} 시작.`);
    }
}