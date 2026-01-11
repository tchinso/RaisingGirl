이미 잘 작동하는 코드니까 거대한 구조 수정은 하지 말아줘.
#### 변경할 사항
1. 지금 캐릭터 스탯화면과 상점 화면이 안 보여. 이걸 보이게 해줘.
2. 플레이어 정보가 안 뜨는건 의도된 사항이야. 문제가 많아서 주석처리 해뒀어.
3. 캐릭터 정보 밑에 다음과 같은 이미지를 표시하게해줘
   게임 시작 \img\1.jpg
   9일차 아침 이후 \img\2.jpg
   17일차 아침 이후 \img\3.jpg
   flag_independent 보유 \img\4.jpg
   flag_lover 보유 \img\5.jpg

4. evt_badge_independent, evt_badge_lover, evt_true_end 에 각각 조건을 추가해줘
   해당 이벤트들은 20일 아침 이후에만 발생

5. evt_badge_lover는 조건에 flag_independent 가 있어야하고, evt_true_end는 조건에 flag_lover가 있어야 하는데
   지금 이유는 모르겠지만 해당 조건을 만족하지 않아도 발생할 수 있는 버그가 있어 이것도 수정해줘.
