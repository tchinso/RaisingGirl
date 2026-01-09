// 5장 콘텐츠 데이터 전체 구현 (Action, Item, Event, Constants)

export const CONSTANTS = {
    PHASES: ["morning", "day", "evening", "night", "late"],
    SLOTS: { morning: 3, day: 2, evening: 2, night: 2, late: 5 }, // 4-1
    START_STATS: {
        player: { money: 5000, sta: 100, maxSta: 100, str: 10, skl: 0, lp2: 0, virtue: 0 },
        char: { aff: 20, tru: 0, opn: 0, mood: -20, sat: 55, hp: 35, tra: 80, fox: 0, skill_c: 0 }
    }
};

export const ACTIONS = {
    // --- A. 대화 계열 ---
    "talk_light": {
        id: "talk_light", name: "가벼운 대화", phases: ["morning", "evening", "night"],
        cost: { sta: 5 }, gain: { aff: 3, tru: 4, mood: 8, lp2: 1 },
        tags: ["talk"]
    },
    "talk_deep": {
        id: "talk_deep", name: "심층 대화", phases: ["night"],
        cost: { sta: 15, str: 2 }, gain: { aff: 8, tru: 10, opn: 2, mood: 12, lp2: 4 },
        fail: { chance: 0.2, onFailGain: { aff: 3, tru: 3 }, reqStat: "char.tru", reqVal: 60 },
        tags: ["talk"]
    },
    "talk_nickname": {
        id: "talk_nickname", name: "애칭 부르기", phases: ["all"],
        cost: { sta: 2 }, gain: { aff: 2, mood: 6, lp2: 1 },
        limits: { daily: 5 }, tags: ["talk"]
    },

    // --- B. 돌봄/접촉 ---
    "care_headpat": {
        id: "care_headpat", name: "머리 쓰다듬기", phases: ["morning", "evening", "night"],
        cost: { sta: 3 }, gain: { aff: 2, tru: 3, mood: 10 },
        limits: { daily: 4 }, tags: ["care"]
    },
    "care_hug": {
        id: "care_hug", name: "포옹", phases: ["night"],
        cost: { sta: 5 }, gain: { aff: 5, tru: 6, mood: 15, sat: 2 },
        req: { stat: "char.tru", gte: 120 },
        fail: { chance: 0.5, onFailGain: { mood: -10 } },
        tags: ["care"]
    },
    "intimacy_kiss": {
        id: "intimacy_kiss", name: "키스", phases: ["night"],
        cost: { sta: 6 }, gain: { aff: 6, tru: 6, opn: 4, sat: 4, mood: 18 },
        req: { flag: "lover", stat: "char.mood", gte: -20, stat2: "char.hp", gte2: 60 },
        tags: ["intimacy"]
    },

    // --- C. 식사/가사 (식사 선택지는 편의상 개별 행동으로 분리) ---
    "meal_cook": {
        id: "meal_cook", name: "직접 요리", phases: ["evening"],
        cost: { sta: 10, money: 400, str: -1 }, gain: { aff: 1, lp2: 1 },
        tags: ["meal"]
    },
    "meal_cupramen": {
        id: "meal_cupramen", name: "컵라면 먹기", phases: ["evening"],
        cost: { sta: 5, money: 500, str: 2 }, gain: { aff: 1 },
        tags: ["meal"]
    },
    "meal_partyset": {
        id: "meal_partyset", name: "파티세트", phases: ["evening"],
        cost: { sta: 30, money: 3000, str: -2 }, gain: { aff: 1, lp2: 1 },
        tags: ["meal"]
    },
    "chore_clean": {
        id: "chore_clean", name: "청소", phases: ["morning", "day"],
        cost: { sta: 10 }, gain: { str: -6, mood: 5 },
        passive: "evt_prob_up", tags: ["work"]
    },

    // --- D. 외출/취미 ---
    "outing_walk": {
        id: "outing_walk", name: "산책", phases: ["day"],
        cost: { sta: 12 }, gain: { maxSta: 1, str: -3, mood: 8, aff: 2, tra: -1 },
        limits: { daily: 1 }, tags: ["hobby"]
    },
    "shop_visit": {
        id: "shop_visit", name: "쇼핑하러 가기", phases: ["day"],
        cost: { slot: 1 }, gain: {}, // 실제 구매는 상점 탭에서
        tags: ["shop"]
    },
    "hobby_tea": {
        id: "hobby_tea", name: "티타임", phases: ["evening", "night"],
        cost: { sta: 4, money: 300 }, gain: { aff: 3, tru: 3, mood: 12, str: -2, counter: "tea" },
        tags: ["hobby"]
    },
    "hobby_drama": {
        id: "hobby_drama", name: "시대극 시청", phases: ["evening", "night"],
        cost: { sta: 6 }, gain: { aff: 2, mood: 6, counter: "drama" },
        tags: ["hobby"]
    },
    "virtue_volunteer": {
        id: "virtue_volunteer", name: "봉사활동", phases: ["day"],
        cost: { sta: 18, str: 1 }, gain: { virtue: 2, aff: 1, lp2: 1, counter: "virtue" },
        tags: ["work"]
    },

    // --- E. 일/경제 ---
    "work_parttime": {
        id: "work_parttime", name: "알바 (적당히)", phases: ["day", "late"],
        cost: { sta: 22, str: 2 }, gain: { money: "formula_parttime", counter: "parttime" },
        tags: ["work"]
    },

    // --- F. 치료/회복 ---
    "heal_treat": {
        id: "heal_treat", name: "상처 치료", phases: ["morning", "evening"],
        cost: { sta: 8, money: 200 }, gain: { hp: 10, tra: -5, tru: 2, mood: 6 },
        limits: { daily: 1 }, tags: ["heal"]
    },
    "rest_relax": {
        id: "rest_relax", name: "휴식", phases: ["night", "late"],
        cost: { slot: 1 }, gain: { sta: 25, str: -6 },
        tags: ["heal"]
    },

    // --- G. 친밀/특수 ---
    "intimacy_session": {
        id: "intimacy_session", name: "친밀 세션", phases: ["night", "late"],
        cost: { sta: 10, str: -2 }, gain: { aff: 4, opn: 6, sat: 10 },
        req: { flag: "lover", stat: "char.hp", gte: 60 },
        tags: ["intimacy"]
    },
    "intimacy_bath": {
        id: "intimacy_bath", name: "함께 목욕", phases: ["night"],
        cost: { sta: 8 }, gain: { aff: 4, tru: 6, opn: 3, mood: 10, sat: 2 },
        req: { skill: "together_bath" },
        tags: ["intimacy"]
    },
    
    // --- 시스템 ---
    "system_next_phase": {
        id: "system_next_phase", name: "다음 시간대", phases: ["all"],
        cost: {}, gain: {}
    }
};

export const ITEMS = {
    // 식료품
    "food_cupramen": { id: "food_cupramen", name: "컵라면", price: 500, type: "consumable", effects: { sta: 5, str: 2 } },
    "food_bento": { id: "food_bento", name: "도시락", price: 1000, type: "consumable", effects: { sta: 20 } },
    "food_partyset": { id: "food_partyset", name: "파티세트", price: 3000, type: "consumable", effects: { sta: 30, aff: 1, lp2: 1, str: -2 } },
    "food_healthtea": { id: "food_healthtea", name: "건강차", price: 1000, type: "consumable", effects: { sta: 2, str: -1 } },
    "food_snack": { id: "food_snack", name: "과자", price: 700, type: "consumable", effects: { sta: 10 } },

    // 약국
    "drug_energy": { id: "drug_energy", name: "에너지드링크", price: 1000, type: "consumable", effects: { sta: 15, str: 1 } },
    "drug_tonic": { id: "drug_tonic", name: "정력제", price: 2000, type: "consumable", effects: { sat: 3 } }, 
    "drug_condom": { id: "drug_condom", name: "콘돔", price: 500, type: "passive", effects: { risk: 0 } },
    "drug_emergency": { id: "drug_emergency", name: "긴급피임약", price: 3000, type: "consumable", effects: { mood: -10 } },

    // 카페/술집 (즉시 소비형으로 구현)
    "cafe_coffee": { id: "cafe_coffee", name: "커피(테이크아웃)", price: 500, type: "consumable", effects: { mood: 10, str: -2 } },
    "bar_plumwine": { id: "bar_plumwine", name: "매실주", price: 1200, type: "consumable", effects: { mood: 8, str: -2 } },

    // 서점
    "book_basic": { id: "book_basic", name: "[책] 내직의 기본", price: 5000, type: "passive", effects: { bookTier: 1 } },
    "book_synergy": { id: "book_synergy", name: "[책] 화학반응", price: 10000, type: "passive", effects: { bookTier: 1 } },
    "book_master": { id: "book_master", name: "[책] 매니저의 극의", price: 20000, type: "passive", effects: { bookTier: 1, autoIncome: true } },
    "mag_weeklysexy": { id: "mag_weeklysexy", name: "[잡지] 주간 섹시", price: 3000, type: "consumable", effects: { opn: 5 }, limits: { daily: 1 } },
    "book_lesson": { id: "book_lesson", name: "[책] 이번 주 교훈", price: 3000, type: "consumable", effects: { lp2: 10 } },

    // 의상/도구
    "dress_onepiece": { id: "dress_onepiece", name: "원피스", price: 8000, type: "item", req: { stat: "char.aff", gte: 50 } },
    "dress_swimsuit": { id: "dress_swimsuit", name: "노출 수영복", price: 12000, type: "item", req: { stat: "char.opn", gte: 100 } },
    "dress_nurse": { id: "dress_nurse", name: "간호사복", price: 15000, type: "item", req: { stat: "char.tru", gte: 150 } },
    "tool_camera": { id: "tool_camera", name: "카메라", price: 10000, type: "item", effects: { photo: true } }
};

// 5-6 이벤트 데이터
export const EVENTS = [
    {
        id: "evt_day7_check",
        type: "fixed",
        trigger: { day: 7, phase: "night" },
        condition: { stat: "char.aff", gte: 100 },
        text: "7일차 밤. 그녀가 당신을 빤히 바라보며 묻습니다.\n'계속 여기 있어도 될까요...?'",
        choices: [
            { text: "물론이지. (정착)", effects: { aff: 20 }, next: "chapter_2" }
        ],
        failText: "그녀는 짐을 싸서 조용히 사라졌습니다... (Bad End: 떠남)",
        failEffects: { badFlag: 1 }
    },
    {
        id: "evt_day16_nurse",
        type: "fixed",
        trigger: { day: 16, phase: "morning" },
        condition: { stat: "char.aff", gte: 70, item: "dress_onepiece" },
        text: "16일차 아침. 그녀가 원피스를 입고 수줍게 웃으며 간호를 자처합니다.",
        choices: [
            { text: "고마워. (받아들인다)", effects: { hp: 100, aff: 15, tra: -25, str: -10 } }
        ],
        failText: "그녀는 몸이 안 좋은지 하루 종일 방에 틀어박혀 있습니다.",
        failEffects: { tra: 10, relapse: 3 }
    },
    {
        id: "evt_rand_clean",
        type: "random",
        prob: 25,
        text: "방청소를 하다가 예전 추억의 물건을 발견했습니다.",
        choices: [
            { text: "추억에 잠긴다", effects: { mood: 5, str: -5 } }
        ]
    },
    {
        id: "evt_rand_nightmare",
        type: "random",
        prob: 10,
        trigger: { phase: "night" },
        text: "그녀가 악몽을 꾸는 것 같습니다. 식은땀을 흘리고 있습니다.",
        choices: [
            { text: "깨워서 안심시킨다", effects: { aff: 2, tra: -2 } },
            { text: "지켜본다", effects: { tra: 2 } }
        ]
    }
];