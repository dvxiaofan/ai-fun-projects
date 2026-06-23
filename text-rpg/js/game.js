const storyEl = document.getElementById("story");
const choicesEl = document.getElementById("choices");
const hpEl = document.getElementById("hp");
const atkEl = document.getElementById("atk");
const defEl = document.getElementById("def");
const goldEl = document.getElementById("gold");
const inventoryEl = document.getElementById("inventory");

let player, currentScene;

function init() {
  player = {
    hp: 100, maxHp: 100,
    atk: 10, def: 5,
    gold: 0,
    inventory: [],
    flags: {},
  };
  updateStats();
  go("start");
}

function updateStats() {
  hpEl.textContent = `${player.hp}/${player.maxHp}`;
  atkEl.textContent = player.atk;
  defEl.textContent = player.def;
  goldEl.textContent = player.gold;
  inventoryEl.textContent = player.inventory.length
    ? player.inventory.join("、")
    : "空";
}

function addItem(item) {
  player.inventory.push(item);
  updateStats();
}

function hasItem(item) {
  return player.inventory.includes(item);
}

function removeItem(item) {
  const idx = player.inventory.indexOf(item);
  if (idx >= 0) player.inventory.splice(idx, 1);
  updateStats();
}

function addText(html) {
  storyEl.innerHTML += html;
  storyEl.scrollTop = storyEl.scrollHeight;
}

function clearStory() {
  storyEl.innerHTML = "";
}

function setChoices(list) {
  choicesEl.innerHTML = "";
  list.forEach(({ text, action, disabled }) => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = text;
    if (disabled) btn.disabled = true;
    btn.onclick = () => {
      if (action) action();
    };
    choicesEl.appendChild(btn);
  });
}

function go(sceneId) {
  currentScene = sceneId;
  const scene = scenes[sceneId];
  if (!scene) return;
  scene();
}

// 战斗系统
function combat(enemy, onWin, onLose) {
  let eHp = enemy.hp;
  const eMaxHp = enemy.hp;

  addText(`<p>⚔️ 遭遇 <b>${enemy.name}</b>！</p>
    <p><span class="enemy-hp">HP: ${eHp}/${eMaxHp}</span></p>`);

  function playerTurn() {
    const dmg = Math.max(1, player.atk - enemy.def + Math.floor(Math.random() * 4));
    eHp -= dmg;
    addText(`<p>你攻击 ${enemy.name}，造成 <span class="damage">${dmg}</span> 点伤害</p>`);

    if (eHp <= 0) {
      addText(`<p>🎉 击败了 ${enemy.name}！</p>`);
      if (enemy.gold) {
        player.gold += enemy.gold;
        addText(`<p>获得 <span class="gold">${enemy.gold} 金币</span></p>`);
        updateStats();
      }
      setChoices([{ text: "继续", action: onWin }]);
      return;
    }

    addText(`<p><span class="enemy-hp">敌人 HP: ${eHp}/${eMaxHp}</span></p>`);
    setTimeout(enemyTurn, 500);
  }

  function enemyTurn() {
    const eDmg = Math.max(1, enemy.atk - player.def + Math.floor(Math.random() * 3));
    player.hp -= eDmg;
    addText(`<p>${enemy.name} 攻击你，造成 <span class="damage">${eDmg}</span> 点伤害</p>`);
    updateStats();

    if (player.hp <= 0) {
      player.hp = 0;
      updateStats();
      addText(`<p>💀 你被击败了...</p>`);
      setChoices([{ text: "重新开始", action: init }]);
      return;
    }

    setChoices([
      { text: "攻击", action: playerTurn },
      ...(hasItem("治疗药水") ? [{ text: "使用治疗药水 (+30 HP)", action: () => {
        removeItem("治疗药水");
        player.hp = Math.min(player.maxHp, player.hp + 30);
        updateStats();
        addText(`<p><span class="heal">使用治疗药水，恢复 30 HP</span></p>`);
        setTimeout(enemyTurn, 500);
      }}] : []),
    ]);
  }

  setTimeout(playerTurn, 600);
}

// 场景
const scenes = {
  start: () => {
    clearStory();
    addText(`<p>你醒来时发现自己躺在一片幽暗的森林中。</p>
      <p>远处隐约可见一座古老城堡的轮廓，身旁有一条蜿蜒的小路。</p>
      <p>空气中弥漫着潮湿的泥土气息，你感到一阵迷茫...</p>`);
    setChoices([
      { text: "沿着小路走向城堡", action: () => go("castle_gate") },
      { text: "深入森林探索", action: () => go("forest") },
      { text: "检查周围环境", action: () => go("search_start") },
    ]);
  },

  search_start: () => {
    addText(`<p>你在附近的灌木丛中发现了一个小包裹。</p>`);
    if (!player.flags.searchedStart) {
      player.flags.searchedStart = true;
      addItem("治疗药水");
      addText(`<p>获得 <span class="heal">治疗药水</span> ×1</p>`);
    } else {
      addText(`<p>这里已经没有什么了。</p>`);
    }
    setChoices([
      { text: "前往城堡", action: () => go("castle_gate") },
      { text: "深入森林", action: () => go("forest") },
    ]);
  },

  forest: () => {
    clearStory();
    addText(`<p>你走进森林深处，树木越来越密，光线逐渐暗淡。</p>
      <p>忽然，前方传来低沉的咆哮声...</p>`);
    setChoices([
      { text: "小心翼翼地靠近", action: () => go("forest_beast") },
      { text: "转身离开，去城堡", action: () => go("castle_gate") },
    ]);
  },

  forest_beast: () => {
    clearStory();
    combat(
      { name: "森林狼", hp: 40, atk: 8, def: 2, gold: 15 },
      () => {
        addText(`<p>森林狼倒下后，你发现了一把生锈的剑。</p>`);
        if (!player.flags.gotSword) {
          player.flags.gotSword = true;
          player.atk += 5;
          addItem("生锈的剑");
          addText(`<p>装备 <b>生锈的剑</b>，攻击力 +5</p>`);
          updateStats();
        }
        setChoices([
          { text: "继续探索", action: () => go("forest_deeper") },
          { text: "前往城堡", action: () => go("castle_gate") },
        ]);
      },
      () => go("start")
    );
  },

  forest_deeper: () => {
    clearStory();
    addText(`<p>森林深处有一间破旧的小屋，门半掩着。</p>`);
    setChoices([
      { text: "进入小屋", action: () => go("cabin") },
      { text: "返回", action: () => go("castle_gate") },
    ]);
  },

  cabin: () => {
    clearStory();
    addText(`<p>小屋里坐着一位老者，他浑浊的眼睛注视着你。</p>
      <p>"年轻人，你也在寻找城堡的秘密吗？"他沙哑地问道。</p>`);
    setChoices([
      { text: ""城堡里有什么？"", action: () => go("cabin_lore") },
      { text: ""您是谁？"", action: () => go("cabin_oldman") },
      { text: "离开小屋", action: () => go("castle_gate") },
    ]);
  },

  cabin_lore: () => {
    addText(`<p>"城堡里住着一条恶龙，它守护着无尽的财宝。"</p>
      <p>"但没有勇者之盾，你不可能战胜它。"</p>`);
    if (!player.flags.knowDragon) {
      player.flags.knowDragon = true;
    }
    setChoices([
      { text: ""勇者之盾在哪里？"", action: () => go("cabin_shield") },
      { text: "离开", action: () => go("castle_gate") },
    ]);
  },

  cabin_oldman: () => {
    addText(`<p>"我曾是城堡的守卫...直到那条龙来了。"</p>
      <p>"如果你愿意帮我取回城堡塔楼上的全家福画像，我会给你一样好东西。"</p>`);
    player.flags.hasQuest = true;
    setChoices([
      { text: ""我会帮你的"", action: () => go("castle_gate") },
      { text: "离开", action: () => go("castle_gate") },
    ]);
  },

  cabin_shield: () => {
    addText(`<p>"勇者之盾在城堡的地下室里，被一只巨魔看守着。"</p>
      <p>"祝你好运，年轻人。"</p>`);
    player.flags.knowShield = true;
    setChoices([
      { text: "前往城堡", action: () => go("castle_gate") },
    ]);
  },

  castle_gate: () => {
    clearStory();
    addText(`<p>你来到了城堡大门前。巨大的石门半开着，里面漆黑一片。</p>
      <p>左边有一条通往地下室的楼梯，右边是通往塔楼的阶梯。</p>`);
    const choices = [
      { text: "进入城堡大厅", action: () => go("hall") },
      { text: "去地下室", action: () => go("basement") },
      { text: "去塔楼", action: () => go("tower") },
    ];
    if (!player.flags.talkedGuard) {
      choices.push({ text: "与门口守卫交谈", action: () => go("guard") });
    }
    setChoices(choices);
  },

  guard: () => {
    clearStory();
    player.flags.talkedGuard = true;
    addText(`<p>一个疲惫的守卫坐在门边。</p>
      <p>"别进去...那条龙太强大了。"他喃喃道。</p>
      <p>"不过，如果你非要进去...塔楼顶上据说有一瓶圣水，能克制龙的火焰。"</p>`);
    player.flags.knowHolyWater = true;
    setChoices([
      { text: "进入城堡", action: () => go("hall") },
      { text: "先去塔楼", action: () => go("tower") },
      { text: "先去地下室", action: () => go("basement") },
    ]);
  },

  tower: () => {
    clearStory();
    addText(`<p>你沿着螺旋阶梯爬上塔楼。</p>
      <p>塔楼顶层积满了灰尘，角落里有一个闪闪发光的瓶子。</p>`);
    if (!player.flags.gotHolyWater) {
      setChoices([
        { text: "拿起瓶子", action: () => {
          player.flags.gotHolyWater = true;
          addItem("圣水");
          addText(`<p>获得 <b>圣水</b>！据说可以克制龙的火焰。</p>`);
          if (player.flags.hasQuest) {
            addText(`<p>你还发现墙上挂着一幅画像——正是老守卫的全家福。</p>`);
            addItem("全家福画像");
          }
          setChoices([{ text: "返回", action: () => go("castle_gate") }]);
        }},
        { text: "返回", action: () => go("castle_gate") },
      ]);
    } else {
      addText(`<p>这里已经没有什么了。</p>`);
      setChoices([{ text: "返回", action: () => go("castle_gate") }]);
    }
  },

  basement: () => {
    clearStory();
    addText(`<p>地下室阴暗潮湿，水滴声回荡在石壁间。</p>
      <p>前方站着一只巨大的魔像，它手中握着一面发光的盾牌。</p>`);
    setChoices([
      { text: "与巨魔战斗", action: () => go("basement_fight") },
      { text: "返回", action: () => go("castle_gate") },
    ]);
  },

  basement_fight: () => {
    clearStory();
    combat(
      { name: "石像巨魔", hp: 60, atk: 12, def: 6, gold: 30 },
      () => {
        if (!player.flags.gotShield) {
          player.flags.gotShield = true;
          player.def += 8;
          addItem("勇者之盾");
          addText(`<p>获得 <b>勇者之盾</b>！防御力 +8</p>`);
          updateStats();
        }
        setChoices([{ text: "返回城堡", action: () => go("castle_gate") }]);
      },
      () => go("start")
    );
  },

  hall: () => {
    clearStory();
    addText(`<p>城堡大厅宏伟而阴森，巨大的吊灯摇摇欲坠。</p>
      <p>大厅尽头是一扇金色的巨门，门缝中透出灼热的红光。</p>
      <p>龙就在里面...</p>`);
    setChoices([
      { text: "推开门，直面恶龙", action: () => go("dragon") },
      { text: "先准备一下再回来", action: () => go("castle_gate") },
    ]);
  },

  dragon: () => {
    clearStory();
    const dragonHp = 100;
    const dragonAtk = player.flags.gotHolyWater ? 12 : 18;
    addText(`<p>你推开巨门，一股热浪扑面而来。</p>
      <p>巨大的红龙盘踞在金币堆上，它的竖瞳紧盯着你。</p>`);
    if (player.flags.gotHolyWater) {
      addText(`<p>你举起圣水，龙的火焰被削弱了！</p>`);
    }
    combat(
      { name: "红龙", hp: dragonHp, atk: dragonAtk, def: 5, gold: 100 },
      () => go("victory"),
      () => go("start")
    );
  },

  victory: () => {
    clearStory();
    addText(`<p>🎉 <b>红龙倒下了！</b></p>
      <p>你站在堆积如山的财宝上，阳光从破碎的穹顶洒落。</p>
      <p>城堡的诅咒被解除了，你是真正的勇者！</p>
      <p class="gold">最终金币: ${player.gold}</p>`);

    if (player.flags.hasQuest && hasItem("全家福画像")) {
      addText(`<p>你记得老守卫的请求...</p>`);
      setChoices([
        { text: "把画像送回去", action: () => go("ending_good") },
        { text: "带着财宝离开", action: () => go("ending_neutral") },
      ]);
    } else {
      setChoices([
        { text: "带着财宝离开", action: () => go("ending_neutral") },
      ]);
    }
  },

  ending_good: () => {
    clearStory();
    player.gold += 50;
    addText(`<p>你回到森林小屋，把画像交给了老守卫。</p>
      <p>老人泪流满面，从怀中取出一枚古老的金币递给你。</p>
      <p>"这是王国最后一枚幸运金币，它会保佑你的。"</p>
      <p class="gold">获得 50 金币</p>
      <p>🏆 <b>结局：最好的勇者</b> — 你不仅战胜了恶龙，还守护了他人的回忆。</p>`);
    setChoices([{ text: "再来一次", action: init }]);
  },

  ending_neutral: () => {
    clearStory();
    addText(`<p>你带着满满的财宝离开了城堡。</p>
      <p>从此以后，你成为了远近闻名的屠龙勇士。</p>
      <p>🏆 <b>结局：屠龙者</b> — 你的传说将被世人传颂。</p>`);
    setChoices([{ text: "再来一次", action: init }]);
  },
};

init();
