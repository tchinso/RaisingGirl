import { CONSTANTS } from '../data.js';

export const Rules = {
    // 4-1. 시간대별 행동칸 계산
    getSlotsForPhase(phase, inventory = {}) {
        let slots = CONSTANTS.SLOTS[phase] || 2;
        if (phase === 'late') {
            // 심야 턴 확장 로직 (예: 커피 효과 버프 등이 있다면 추가)
            // 여기서는 단순화하여 기본값만 반환
        }
        return slots;
    },

    // 4-6. 알바비 계산
    calcPartTimePay(workType, playerStats, inventory) {
        let hourly = 900 + (50 * playerStats.skl);
        let bookTier = 0;
        if (inventory['book_basic']) bookTier++;
        if (inventory['book_synergy']) bookTier++;
        if (inventory['book_master']) bookTier++;
        
        hourly += (200 * bookTier);
        
        // workType: 'short'(2h), 'medium'(4h), 'long'(8h) - 여기선 medium 기준
        const hours = 4; 
        const basePay = hourly * hours;
        return basePay + 200; // 보너스
    },

    // 4-5. 행동 성공률
    calcSuccessRate(baseChance, charStats) {
        if (!baseChance) return 100;
        let chance = baseChance + (charStats.tru / 50);
        if (charStats.mood > 40) chance += 5;
        if (charStats.mood < -40) chance -= 10;
        return Math.min(95, Math.max(35, chance));
    }
};

export const Utils = {
    clamp(val, min, max) { return Math.min(max, Math.max(min, val)); }
};