const KEYS = {
    PROFILE: 'mygame_profile_v1',
    SAVES: 'mygame_saves_v1',
    SAVE_PREFIX: 'mygame_save_'
};

export const SaveSystem = {
    // 현재 게임 상태(Run) 저장
    saveRun(slotId, state) {
        const meta = {
            slotId,
            updatedAt: Date.now(),
            day: state.day,
            money: state.player.money
        };
        const savesList = JSON.parse(localStorage.getItem(KEYS.SAVES) || "{}");
        savesList[slotId] = meta;
        localStorage.setItem(KEYS.SAVES, JSON.stringify(savesList));

        const saveData = {
            version: 1,
            state: state,
            rng: state.rngState // 실제 저장 시에는 App에서 rng.getState()를 주입해야 함 (아래 로직은 임시)
        };
        localStorage.setItem(KEYS.SAVE_PREFIX + slotId, JSON.stringify(saveData));
        console.log(`Saved slot ${slotId}`);
    },

    loadRun(slotId) {
        const raw = localStorage.getItem(KEYS.SAVE_PREFIX + slotId);
        if (!raw) return null;
        
        const data = JSON.parse(raw);
        if (data.version < 1) { /* migration logic */ }
        return data;
    },
    
    // 디바운스 저장 (state 객체 자체를 캡처하는 것이 아니라, 호출 시점의 데이터를 받아야 함)
    createAutoSaver(slotId, getDataFn) {
        let timeout;
        return () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                const fullData = getDataFn(); 
                // saveData 구조체 생성
                const saveData = {
                    version: 1,
                    state: fullData.state,
                    rng: fullData.rng
                };
                localStorage.setItem(KEYS.SAVE_PREFIX + slotId, JSON.stringify(saveData));
            }, 500);
        };
    }
};