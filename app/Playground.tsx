"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

type GameId = "feed" | "pack" | "survival" | "cringe";
type ResultMood = "good" | "bad" | null;

const feedRounds = [
  { want: "banana", options: [["banana", "🍌"], ["apple", "🍎"], ["cookie", "🍪"], ["carrot", "🥕"], ["milk", "🥛"]] },
  { want: "pizza", options: [["pizza", "🍕"], ["cheese", "🧀"], ["bread", "🍞"], ["grapes", "🍇"]] },
  { want: "ice cream", options: [["ice cream", "🍦"], ["cake", "🍰"], ["lemon", "🍋"], ["watermelon", "🍉"], ["pear", "🍐"]] },
  { want: "carrot", options: [["carrot", "🥕"], ["strawberry", "🍓"], ["egg", "🥚"], ["sandwich", "🥪"]] },
  { want: "apple", options: [["apple", "🍎"], ["banana", "🍌"], ["milk", "🥛"], ["pizza", "🍕"], ["cookie", "🍪"]] },
  { want: "cookie", options: [["cookie", "🍪"], ["pear", "🍐"], ["cheese", "🧀"], ["grapes", "🍇"]] },
  { want: "milk", options: [["milk", "🥛"], ["lemon", "🍋"], ["bread", "🍞"], ["cake", "🍰"], ["egg", "🥚"]] },
  { want: "watermelon", options: [["watermelon", "🍉"], ["strawberry", "🍓"], ["ice cream", "🍦"], ["sandwich", "🥪"]] },
] as const;

const schoolItems = [
  { id: "book", name: "book", emoji: "📘" }, { id: "pen", name: "pen", emoji: "🖊️" },
  { id: "pencil1", name: "pencil", emoji: "✏️" }, { id: "pencil2", name: "pencil", emoji: "✏️" },
  { id: "red-pencil", name: "red pencil", emoji: "✏️" }, { id: "blue-book", name: "blue book", emoji: "📘" },
  { id: "ruler", name: "ruler", emoji: "📏" }, { id: "notebook", name: "notebook", emoji: "📓" },
  { id: "eraser", name: "eraser", emoji: "▰" }, { id: "scissors", name: "scissors", emoji: "✂️" },
];

const packRounds = [
  { task: "I need a book and a pen", targets: ["book", "pen"] },
  { task: "I need two pencils", targets: ["pencil", "pencil"] },
  { task: "Pack a ruler and an eraser", targets: ["ruler", "eraser"] },
  { task: "I need a blue book", targets: ["blue book"] },
  { task: "Pack a notebook and scissors", targets: ["notebook", "scissors"] },
  { task: "I need a red pencil and a book", targets: ["red pencil", "book"] },
];

const survivalRounds = [
  { q: "She ___ to school every day.", choices: ["goes", "go"], correct: "goes" },
  { q: "Choose the safe sentence.", choices: ["I can swim", "I can to swim"], correct: "I can swim" },
  { q: "Yesterday we ___ a film.", choices: ["watched", "watch"], correct: "watched" },
  { q: "There ___ two doors.", choices: ["are", "is"], correct: "are" },
  { q: "This tunnel is ___ than that one.", choices: ["darker", "more dark"], correct: "darker" },
  { q: "If it rains, we ___ inside.", choices: ["will stay", "stayed"], correct: "will stay" },
  { q: "The key ___ under the rock.", choices: ["was hidden", "hid"], correct: "was hidden" },
  { q: "Quick! Which word means ‘выход’?​", choices: ["exit", "entrance"], correct: "exit" },
];

const cringePhrases = [
  { text: "I am agree with you.", correct: false, fix: "I agree with you." },
  { text: "I really like this song.", correct: true, fix: "Natural English!" },
  { text: "I didn't went there.", correct: false, fix: "I didn't go there." },
  { text: "It depends on the weather.", correct: true, fix: "Natural English!" },
  { text: "I very like it.", correct: false, fix: "I like it very much." },
  { text: "Let's meet at the weekend.", correct: true, fix: "Natural English!" },
  { text: "How is it called?", correct: false, fix: "What is it called?" },
  { text: "I'm looking forward to it.", correct: true, fix: "Natural English!" },
  { text: "He explained me the rule.", correct: false, fix: "He explained the rule to me." },
  { text: "That makes sense.", correct: true, fix: "Natural English!" },
  { text: "We discussed about it.", correct: false, fix: "We discussed it." },
  { text: "I haven't seen her lately.", correct: true, fix: "Natural English!" },
];

const zoneData: { id: GameId; age: string; title: string; tagline: string; icon: string; action: string; tone: string }[] = [
  { id: "feed", age: "5–7", title: "FEED THE MONSTER", tagline: "Listen, look and tap!", icon: "👾", action: "PLAY", tone: "lime" },
  { id: "pack", age: "7–9", title: "PACK MY BAG", tagline: "Read, match and pack!", icon: "🎒", action: "EXPLORE", tone: "blue" },
  { id: "survival", age: "10–12", title: "ENGLISH SURVIVAL", tagline: "Choose wisely. Run fast.", icon: "🧟", action: "CHALLENGE", tone: "purple" },
  { id: "cringe", age: "14+", title: "CRINGE OR CORRECT?", tagline: "Think fast. Judge harder.", icon: "💀", action: "SURVIVE", tone: "red" },
];

function speak(text: string, enabled: boolean) {
  if (!enabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.86;
  utterance.pitch = 1.18;
  window.speechSynthesis.speak(utterance);
}

function GameFrame({ title, round, total, onBack, children, tone = "lime" }: { title: string; round: number; total: number; onBack: () => void; children: React.ReactNode; tone?: string }) {
  return <main className={`game-shell game-${tone}`}>
    <header className="game-topbar">
      <button type="button" className="back-button" onClick={onBack} aria-label="Back to zones">‹</button>
      <strong>{title}</strong><span>{Math.min(round + 1, total)} / {total}</span>
    </header>
    <div className="progress-track"><i style={{ width: `${Math.min(((round + 1) / total) * 100, 100)}%` }} /></div>
    {children}
  </main>;
}

function FinalScreen({ icon, title, score, total, detail, tone, onAgain, onHome }: { icon: string; title: string; score: number; total: number; detail: string; tone: string; onAgain: () => void; onHome: () => void }) {
  return <main className={`game-shell game-${tone} final-shell`}>
    <section className="final-card">
      <div className="final-burst" aria-hidden="true">✦</div><div className="final-icon">{icon}</div>
      <p>SESSION COMPLETE</p><h1>{title}</h1><div className="score-ring"><b>{score}</b><span>/ {total}</span></div>
      <h2>{detail}</h2>
      <button type="button" className="primary-game-button" onClick={onAgain}>PLAY AGAIN ↻</button>
      <button type="button" className="text-button" onClick={onHome}>PICK ANOTHER ZONE</button>
    </section>
  </main>;
}

function FeedGame({ sound, onHome }: { sound: boolean; onHome: () => void }) {
  const [round, setRound] = useState(0); const [score, setScore] = useState(0); const [reaction, setReaction] = useState<ResultMood>(null); const [picked, setPicked] = useState(""); const [done, setDone] = useState(false);
  const data = feedRounds[round];
  useEffect(() => { if (!done) { const timer = setTimeout(() => speak(`I want a ${data.want}!`, sound), 350); return () => clearTimeout(timer); } }, [round, done, data.want, sound]);
  const choose = (name: string) => {
    if (reaction) return; const correct = name === data.want; setPicked(name); setReaction(correct ? "good" : "bad");
    if (correct) setScore((s) => s + 1); speak(correct ? "Yummy! Thank you!" : "Oops! Try the next one!", sound);
    setTimeout(() => { if (round === feedRounds.length - 1) setDone(true); else setRound((r) => r + 1); setReaction(null); setPicked(""); }, 900);
  };
  if (done) return <FinalScreen icon="👾" title="MONSTER FED!" score={score} total={feedRounds.length} detail={score > 6 ? "SUPER TASTY!" : "YUMMY WORK!"} tone="lime" onAgain={() => { setRound(0); setScore(0); setDone(false); }} onHome={onHome} />;
  return <GameFrame title="FEED THE MONSTER" round={round} total={feedRounds.length} onBack={onHome}>
    <section className="feed-stage">
      <button type="button" className="speech-bubble" onClick={() => speak(`I want a ${data.want}!`, sound)} aria-label="Repeat request"><span>🔊</span> I want a {data.want}!</button>
      <div className={`monster ${reaction === "good" ? "monster-happy" : reaction === "bad" ? "monster-spit" : ""}`} aria-label="Friendly hungry monster"><i className="horn h1"/><i className="horn h2"/><div className="monster-eye e1"/><div className="monster-eye e2"/><div className="monster-mouth">{reaction === "good" ? "♥" : reaction === "bad" ? " bleh " : ""}</div></div>
      <div className="food-field">
        {data.options.map(([name, emoji], index) => <button type="button" key={name} aria-label={name} onClick={() => choose(name)} className={`food-option food-${index} ${picked === name ? reaction === "good" ? "food-eaten" : "food-spit" : ""}`}><span>{emoji}</span></button>)}
      </div>
      <p className={`instant-feedback ${reaction ?? ""}`}>{reaction === "good" ? "YUMMY! ★" : reaction === "bad" ? "PTOOIE! 😝" : "Tap the food the monster wants"}</p>
    </section>
  </GameFrame>;
}

function PackGame({ onHome }: { onHome: () => void }) {
  const [round, setRound] = useState(0); const [score, setScore] = useState(0); const [remaining, setRemaining] = useState<string[]>([...packRounds[0].targets]); const [packed, setPacked] = useState<string[]>([]); const [used, setUsed] = useState<string[]>([]); const [reaction, setReaction] = useState<ResultMood>(null); const [done, setDone] = useState(false);
  const [drag, setDrag] = useState<{ id: string; x: number; y: number; sx: number; sy: number; moved: boolean } | null>(null); const bagRef = useRef<HTMLDivElement>(null);
  const startRound = (next: number) => { setRound(next); setRemaining([...packRounds[next].targets]); setPacked([]); setUsed([]); setReaction(null); };
  const tryPack = (id: string) => {
    if (reaction || used.includes(id)) return; const item = schoolItems.find((it) => it.id === id); if (!item) return;
    const wanted = remaining.includes(item.name); setReaction(wanted ? "good" : "bad");
    if (wanted) {
      setUsed((u) => [...u, id]); setPacked((p) => [...p, item.emoji]);
      const next = [...remaining]; next.splice(next.indexOf(item.name), 1); setRemaining(next);
      if (!next.length) { setScore((s) => s + 1); setTimeout(() => { if (round === packRounds.length - 1) setDone(true); else startRound(round + 1); }, 750); } else setTimeout(() => setReaction(null), 450);
    } else setTimeout(() => setReaction(null), 520);
  };
  const pointerDown = (e: ReactPointerEvent<HTMLButtonElement>, id: string) => { e.currentTarget.setPointerCapture(e.pointerId); setDrag({ id, x: 0, y: 0, sx: e.clientX, sy: e.clientY, moved: false }); };
  const pointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => setDrag((d) => d && d.id === e.currentTarget.dataset.id ? { ...d, x: e.clientX - d.sx, y: e.clientY - d.sy, moved: d.moved || Math.abs(e.clientX - d.sx) + Math.abs(e.clientY - d.sy) > 8 } : d);
  const pointerUp = (e: ReactPointerEvent<HTMLButtonElement>) => { if (!drag) return; const rect = bagRef.current?.getBoundingClientRect(); const overBag = !!rect && e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom; if (!drag.moved || overBag) tryPack(drag.id); else { setReaction("bad"); setTimeout(() => setReaction(null), 400); } setDrag(null); };
  if (done) return <FinalScreen icon="🎒" title="BAG PACKED!" score={score} total={packRounds.length} detail="READY FOR SCHOOL" tone="blue" onAgain={() => { startRound(0); setScore(0); setDone(false); }} onHome={onHome} />;
  const required = packRounds[round].targets;
  const items = schoolItems.filter((item) => !used.includes(item.id) && required.includes(item.name));
  schoolItems.forEach((item) => { if (items.length < 6 && !used.includes(item.id) && !items.some((shown) => shown.id === item.id)) items.push(item); });
  return <GameFrame title="PACK MY BAG" round={round} total={packRounds.length} onBack={onHome} tone="blue">
    <section className="pack-stage"><div className="task-card"><span>MISSION</span><h1>{packRounds[round].task}</h1></div>
      <div className="desk-scene">
        <div className="item-tray">{items.map((item) => <button type="button" key={item.id} data-id={item.id} aria-label={`Drag ${item.name} to the bag`} onPointerDown={(e) => pointerDown(e, item.id)} onPointerMove={pointerMove} onPointerUp={pointerUp} className={`school-item ${drag?.id === item.id ? "dragging" : ""}`} style={drag?.id === item.id ? { transform: `translate(${drag.x}px, ${drag.y}px) scale(1.12)` } : undefined}><span>{item.emoji}</span><b>{item.name}</b></button>)}</div>
        <div ref={bagRef} className={`backpack ${reaction === "good" ? "bag-happy" : reaction === "bad" ? "bag-nope" : ""}`}><div className="bag-handle"/><div className="bag-pocket">{packed.map((emoji, i) => <span key={`${emoji}-${i}`}>{emoji}</span>)}</div><b>DROP HERE</b></div>
      </div><p className={`instant-feedback ${reaction ?? ""}`}>{reaction === "good" ? "PACKED! ✓" : reaction === "bad" ? "BOING! NOT THIS ONE" : "Drag or tap the things you need"}</p>
    </section>
  </GameFrame>;
}

function SurvivalGame({ onHome }: { onHome: () => void }) {
  const [round, setRound] = useState(0); const [lives, setLives] = useState(3); const [score, setScore] = useState(0); const [reaction, setReaction] = useState<ResultMood>(null); const [chosen, setChosen] = useState(""); const [done, setDone] = useState(false);
  const data = survivalRounds[round]; const answer = (choice: string) => { if (reaction) return; const ok = choice === data.correct; setChosen(choice); setReaction(ok ? "good" : "bad"); if (ok) setScore((s) => s + 1); const newLives = ok ? lives : lives - 1; if (!ok) setLives(newLives); setTimeout(() => { if (round === survivalRounds.length - 1 || newLives === 0) setDone(true); else { setRound((r) => r + 1); setReaction(null); setChosen(""); } }, 850); };
  if (done) return <FinalScreen icon={lives ? "🏃" : "🧟"} title={lives ? "YOU ESCAPED!" : "SO CLOSE!"} score={score} total={survivalRounds.length} detail={lives ? `${"❤️".repeat(lives)} LIVES LEFT` : "THE MONSTER GOT YOU"} tone="purple" onAgain={() => { setRound(0); setLives(3); setScore(0); setReaction(null); setDone(false); }} onHome={onHome} />;
  return <GameFrame title="ENGLISH SURVIVAL" round={round} total={survivalRounds.length} onBack={onHome} tone="purple">
    <section className="survival-stage"><div className="lives" aria-label={`${lives} lives`}>{[0,1,2].map((n) => <span key={n} className={n < lives ? "alive" : "lost"}>♥</span>)}</div>
      <div className={`run-scene danger-${3 - lives} ${reaction === "good" ? "dash" : reaction === "bad" ? "caught" : ""}`}><div className="moon"/><div className="monster-chaser">🧟</div><div className="runner">🏃</div><div className="road-lines"><i/><i/><i/></div></div>
      <div className="fork-card"><span>CHOOSE YOUR PATH</span><h1>{data.q}</h1><div className="path-choices">{data.choices.map((choice, i) => <button type="button" key={choice} onClick={() => answer(choice)} className={`${chosen === choice ? (choice === data.correct ? "right-path" : "wrong-path") : ""}`}><small>PATH {i + 1}</small><b>{choice}</b><em>➜</em></button>)}</div></div>
      <p className={`instant-feedback ${reaction ?? ""}`}>{reaction === "good" ? "SAFE PATH — RUN!" : reaction === "bad" ? "WRONG TURN — IT'S CLOSER!" : "No time limit. Choose wisely."}</p>
    </section>
  </GameFrame>;
}

function CringeGame({ onHome }: { onHome: () => void }) {
  const [round, setRound] = useState(0); const [score, setScore] = useState(0); const [streak, setStreak] = useState(0); const [best, setBest] = useState(0); const [reaction, setReaction] = useState<ResultMood>(null); const [done, setDone] = useState(false); const [dragX, setDragX] = useState(0); const startX = useRef<number | null>(null);
  const data = cringePhrases[round];
  const judge = (saysCorrect: boolean) => { if (reaction) return; const ok = saysCorrect === data.correct; setReaction(ok ? "good" : "bad"); if (ok) { setScore((s) => s + 1); setStreak((s) => { const next = s + 1; setBest((b) => Math.max(b, next)); return next; }); } else setStreak(0); setTimeout(() => { if (round === cringePhrases.length - 1) setDone(true); else { setRound((r) => r + 1); setReaction(null); setDragX(0); } }, 900); };
  const pointerDown = (e: ReactPointerEvent<HTMLDivElement>) => { startX.current = e.clientX; e.currentTarget.setPointerCapture(e.pointerId); };
  const pointerMove = (e: ReactPointerEvent<HTMLDivElement>) => { if (startX.current !== null) setDragX(Math.max(-150, Math.min(150, e.clientX - startX.current))); };
  const pointerUp = () => { if (Math.abs(dragX) > 65) judge(dragX > 0); else setDragX(0); startX.current = null; };
  const cringeLevel = Math.round(((cringePhrases.length - score) / cringePhrases.length) * 100);
  if (done) return <FinalScreen icon={cringeLevel < 25 ? "🔥" : "💀"} title="CRINGE CHECKED" score={score} total={cringePhrases.length} detail={`CRINGE LEVEL: ${cringeLevel}% · BEST COMBO ×${best}`} tone="red" onAgain={() => { setRound(0); setScore(0); setStreak(0); setBest(0); setReaction(null); setDone(false); }} onHome={onHome} />;
  return <GameFrame title="CRINGE OR CORRECT?" round={round} total={cringePhrases.length} onBack={onHome} tone="red">
    <section className="cringe-stage"><div className="combo"><span>STREAK</span><b>×{streak}</b></div><p className="swipe-hint">SWIPE OR TAP</p>
      <div className="judge-deck"><div className="ghost-card g1"/><div className="ghost-card g2"/><div role="group" aria-label="Phrase to judge" className={`phrase-card ${reaction === "good" ? "judge-good" : reaction === "bad" ? "judge-bad" : ""}`} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} style={{ transform: `translateX(${dragX}px) rotate(${dragX / 18}deg)` }}><span className="cringe-stamp">CRINGE 💀</span><span className="correct-stamp">CORRECT 🔥</span><small>DOES THIS SOUND RIGHT?</small><h1>“{data.text}”</h1>{reaction && <p>{reaction === "good" ? "NAILED IT!" : data.fix}</p>}</div></div>
      <div className="judge-buttons"><button type="button" className="cringe-button" onClick={() => judge(false)}>💀<span>CRINGE</span></button><button type="button" className="correct-button" onClick={() => judge(true)}>🔥<span>CORRECT</span></button></div>
    </section>
  </GameFrame>;
}

export default function Playground() {
  const [game, setGame] = useState<GameId | null>(null); const [sound, setSound] = useState(true); const [menuOpen, setMenuOpen] = useState(false);
  if (game === "feed") return <FeedGame sound={sound} onHome={() => setGame(null)} />;
  if (game === "pack") return <PackGame onHome={() => setGame(null)} />;
  if (game === "survival") return <SurvivalGame onHome={() => setGame(null)} />;
  if (game === "cringe") return <CringeGame onHome={() => setGame(null)} />;
  return <main className="home-shell">
    <nav className="topbar" aria-label="Main navigation"><BrandLogo/><div className="nav-actions"><button className="battle" type="button" onClick={() => setMenuOpen(true)}>🏆 <span>CLASS BATTLE</span></button><button className="round-button" type="button" onClick={() => setSound((s) => !s)} aria-label={sound ? "Mute sound" : "Turn on sound"}>{sound ? "🔊" : "🔇"}</button><button className="round-button" type="button" onClick={() => setMenuOpen(true)} aria-label="Menu">☰</button></div></nav>
    <section className="hero"><p className="eyebrow">TELLmeMORE PLAYGROUND</p><h1>PICK YOUR <em>ZONE</em></h1><p>Choose your age. Jump in. Have fun.</p></section>
    <section className="zone-grid" aria-label="Age zones">{zoneData.map((zone) => <article className={`zone-card ${zone.tone}`} key={zone.id}><div className="zone-glow"/><div className={`zone-art cover-shot cover-${zone.id}`} aria-hidden="true"/><div className="zone-copy"><h2>{zone.age}</h2><strong>YEARS OLD</strong><h3 className="sr-only">{zone.title}</h3><p>{zone.tagline}</p><button type="button" aria-label={`${zone.action}: ${zone.title}`} onClick={() => setGame(zone.id)}>{zone.action}<b>›</b></button></div></article>)}</section>
    {menuOpen && <div className="modal-shade" role="dialog" aria-modal="true" aria-label="Playground menu" onClick={() => setMenuOpen(false)}><div className="mini-modal" onClick={(e) => e.stopPropagation()}><button className="modal-close" type="button" onClick={() => setMenuOpen(false)}>×</button><span>⚡</span><h2>READY TO PLAY?</h2><p>Pick any age zone. Every game takes just a few minutes and works with one finger.</p><button className="primary-game-button" type="button" onClick={() => setMenuOpen(false)}>LET'S GO</button></div></div>}
  </main>;
}

function BrandLogo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;
    const image = new Image();
    image.src = "/tmm-logo-source.png";
    image.onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 66, 405, 895, 220, 0, 0, canvas.width, canvas.height);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
      for (let index = 0; index < pixels.data.length; index += 4) {
        if (pixels.data[index] > 238 && pixels.data[index + 1] > 238 && pixels.data[index + 2] > 238) pixels.data[index + 3] = 0;
      }
      context.putImageData(pixels, 0, 0);
    };
  }, []);
  return <a className="brand" href="#" aria-label="TELLmeMORE home"><canvas ref={canvasRef} width="895" height="220" role="img" aria-label="TELLmeMORE"/></a>;
}
