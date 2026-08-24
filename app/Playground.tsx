"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";

type GameId = "feed" | "pack" | "survival" | "cringe";
type ResultMood = "good" | "bad" | null;

const feedRounds = [
  { want: "banana", prompt: "I want a banana!", options: [["banana", "🍌"], ["apple", "🍎"], ["cookie", "🍪"], ["carrot", "🥕"], ["milk", "🥛"]] },
  { want: "pizza", prompt: "I want some pizza!", options: [["pizza", "🍕"], ["cheese", "🧀"], ["bread", "🍞"], ["grapes", "🍇"]] },
  { want: "ice cream", prompt: "I want some ice cream!", options: [["ice cream", "🍦"], ["cake", "🍰"], ["lemon", "🍋"], ["watermelon", "🍉"], ["pear", "🍐"]] },
  { want: "carrot", prompt: "I want a carrot!", options: [["carrot", "🥕"], ["strawberry", "🍓"], ["egg", "🥚"], ["sandwich", "🥪"]] },
  { want: "apple", prompt: "I want an apple!", options: [["apple", "🍎"], ["banana", "🍌"], ["milk", "🥛"], ["pizza", "🍕"], ["cookie", "🍪"]] },
  { want: "cookie", prompt: "I want a cookie!", options: [["cookie", "🍪"], ["pear", "🍐"], ["cheese", "🧀"], ["grapes", "🍇"]] },
  { want: "milk", prompt: "I want some milk!", options: [["milk", "🥛"], ["lemon", "🍋"], ["bread", "🍞"], ["cake", "🍰"], ["egg", "🥚"]] },
  { want: "watermelon", prompt: "I want some watermelon!", options: [["watermelon", "🍉"], ["strawberry", "🍓"], ["ice cream", "🍦"], ["sandwich", "🥪"]] },
] as const;

const schoolItems = [
  { id: "book", name: "book", label: "BOOK", emoji: "📘", hue: "205 93% 58%" },
  { id: "blue-book", name: "blue book", label: "BLUE BOOK", emoji: "📘", hue: "213 100% 55%" },
  { id: "pen", name: "pen", label: "PEN", emoji: "🖊️", hue: "201 93% 60%" },
  { id: "pencil-a", name: "pencil", label: "PENCIL", emoji: "✏️", hue: "43 100% 61%" },
  { id: "pencil-b", name: "pencil", label: "PENCIL", emoji: "✏️", hue: "43 100% 61%" },
  { id: "eraser", name: "eraser", label: "ERASER", emoji: "🧼", hue: "346 94% 72%" },
  { id: "notebook", name: "notebook", label: "NOTEBOOK", emoji: "📓", hue: "267 82% 68%" },
  { id: "red-notebook", name: "red notebook", label: "RED NOTEBOOK", emoji: "📕", hue: "2 91% 64%" },
  { id: "ruler", name: "ruler", label: "RULER", emoji: "📏", hue: "49 94% 59%" },
  { id: "pencil-case", name: "pencil case", label: "PENCIL CASE", emoji: "👝", hue: "24 96% 58%" },
  { id: "water-bottle", name: "water bottle", label: "WATER BOTTLE", emoji: "🧴", hue: "104 67% 57%" },
  { id: "scissors", name: "scissors", label: "SCISSORS", emoji: "✂️", hue: "187 85% 55%" },
  { id: "glue", name: "glue", label: "GLUE", emoji: "🧴", hue: "38 95% 62%" },
] as const;

const packRounds = [
  { task: "I need a book and a pen.", targets: ["book", "pen"], options: ["notebook", "book", "eraser", "pencil-case", "pen", "water-bottle", "pencil-a"] },
  { task: "I need two pencils.", targets: ["pencil", "pencil"], options: ["eraser", "pencil-a", "pen", "glue", "pencil-b", "ruler", "notebook"] },
  { task: "I need a red notebook.", targets: ["red notebook"], options: ["blue-book", "pen", "notebook", "red-notebook", "water-bottle", "book", "pencil-a"] },
  { task: "I need a pencil and an eraser.", targets: ["pencil", "eraser"], options: ["ruler", "pencil-a", "notebook", "glue", "scissors", "eraser", "pen"] },
  { task: "I need a blue book and a pencil case.", targets: ["blue book", "pencil case"], options: ["book", "pen", "pencil-case", "red-notebook", "water-bottle", "blue-book", "ruler"] },
  { task: "I need a ruler, some glue, and scissors.", targets: ["ruler", "glue", "scissors"], options: ["pen", "scissors", "water-bottle", "ruler", "pencil-a", "glue", "eraser"] },
] as const;

function shufflePackOptions(data: typeof packRounds[number]) {
  const order = [...data.options] as string[];
  for (let index = order.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [order[index], order[swapIndex]] = [order[swapIndex], order[index]];
  }
  const targetNames = new Set<string>(data.targets);
  const firstItem = schoolItems.find((item) => item.id === order[0]);
  if (firstItem && targetNames.has(firstItem.name)) {
    const distractorIndex = order.findIndex((id, index) => index > 0 && !targetNames.has(schoolItems.find((item) => item.id === id)?.name ?? ""));
    if (distractorIndex > 0) [order[0], order[distractorIndex]] = [order[distractorIndex], order[0]];
  }
  return order;
}

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
  { id: "feed", age: "5–7", title: "FEED THE MONSTER", tagline: "Listen, drag and feed!", icon: "👾", action: "PLAY", tone: "lime" },
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
  const [round, setRound] = useState(0); const [score, setScore] = useState(0); const [reaction, setReaction] = useState<ResultMood>(null); const [picked, setPicked] = useState(""); const [done, setDone] = useState(false); const [hintDismissed, setHintDismissed] = useState(false);
  const [drag, setDrag] = useState<{ name: string; x: number; y: number; sx: number; sy: number; near: boolean } | null>(null); const [look, setLook] = useState({ x: 0, y: 0 });
  const mouthRef = useRef<HTMLDivElement>(null);
  const data = feedRounds[round];
  useEffect(() => { if (!done) { const timer = setTimeout(() => speak(data.prompt, sound), 350); return () => clearTimeout(timer); } }, [round, done, data.prompt, sound]);
  const finishDrop = (name: string) => {
    if (reaction) return; const correct = name === data.want; setPicked(name); setReaction(correct ? "good" : "bad");
    if (correct) {
      setScore((value) => value + 1); speak("Yum! Thank you!", sound);
      setTimeout(() => { if (round === feedRounds.length - 1) setDone(true); else setRound((value) => value + 1); setReaction(null); setPicked(""); }, 1050);
    } else {
      speak("Bleh!", sound); setTimeout(() => { setReaction(null); setPicked(""); }, 950);
    }
  };
  const pointerDown = (event: ReactPointerEvent<HTMLButtonElement>, name: string) => {
    if (reaction) return; event.currentTarget.setPointerCapture(event.pointerId); setHintDismissed(true); setDrag({ name, x: 0, y: 0, sx: event.clientX, sy: event.clientY, near: false });
  };
  const pointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!drag || drag.name !== event.currentTarget.dataset.name) return; const mouth = mouthRef.current?.getBoundingClientRect(); if (!mouth) return;
    const near = event.clientX >= mouth.left - 55 && event.clientX <= mouth.right + 55 && event.clientY >= mouth.top - 55 && event.clientY <= mouth.bottom + 55;
    const centerX = mouth.left + mouth.width / 2; const centerY = mouth.top + mouth.height / 2;
    setLook({ x: Math.max(-12, Math.min(12, (event.clientX - centerX) / 11)), y: Math.max(-9, Math.min(9, (event.clientY - centerY) / 13)) });
    setDrag((current) => current ? { ...current, x: event.clientX - current.sx, y: event.clientY - current.sy, near } : null);
  };
  const pointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!drag) return; const mouth = mouthRef.current?.getBoundingClientRect(); const overMouth = !!mouth && event.clientX >= mouth.left - 12 && event.clientX <= mouth.right + 12 && event.clientY >= mouth.top - 12 && event.clientY <= mouth.bottom + 12; const name = drag.name;
    setDrag(null); setLook({ x: 0, y: 0 }); if (overMouth) finishDrop(name);
  };
  const pointerCancel = () => { setDrag(null); setLook({ x: 0, y: 0 }); };
  if (done) return <FinalScreen icon="👾" title="MONSTER FED!" score={score} total={feedRounds.length} detail="SUPER TASTY!" tone="lime" onAgain={() => { setRound(0); setScore(0); setDone(false); setHintDismissed(false); }} onHome={onHome} />;
  const pickedEmoji = data.options.find(([name]) => name === picked)?.[1];
  const labStyle = { "--look-x": `${look.x}px`, "--look-y": `${look.y}px` } as CSSProperties;
  return <GameFrame title="FEED THE MONSTER" round={round} total={feedRounds.length} onBack={onHome}>
    <section className="feed-stage feed-3d-stage">
      <div className={`monster-lab ${drag ? "is-tracking" : ""} ${drag?.near ? "is-near" : ""} ${reaction === "good" ? "is-chewing" : reaction === "bad" ? "is-disgusted" : ""}`} style={labStyle}>
        <button type="button" className="speech-bubble" onClick={() => speak(data.prompt, sound)} aria-label="Repeat request"><span>🔊</span>{data.prompt}</button>
        <i className="tracking-glint glint-left"/><i className="tracking-glint glint-right"/>
        <div ref={mouthRef} className="mouth-drop" aria-label="Monster mouth drop zone"/>
        {reaction === "good" && <div className="yum-burst" aria-hidden="true">♥ ✦ ♥</div>}
        {reaction === "bad" && pickedEmoji && <div className="spit-food" aria-hidden="true">{pickedEmoji}</div>}
        <div className="food-field">
          {data.options.map(([name, emoji], index) => <button type="button" key={name} data-name={name} aria-label={`Drag ${name} to the monster`} onPointerDown={(event) => pointerDown(event, name)} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerCancel} className={`food-option food-${index} ${drag?.name === name ? "food-dragging" : ""} ${picked === name && reaction === "good" ? "food-fed" : ""} ${picked === name && reaction === "bad" ? "food-rejected" : ""}`} style={drag?.name === name ? { transform: `translate3d(${drag.x}px, ${drag.y}px, 0) scale(1.16)`, zIndex: 30 } : undefined}><span>{emoji}</span><b>{name}</b></button>)}
        </div>
        {round === 0 && !hintDismissed && <div className="drag-hint" aria-hidden="true"><span>☝️</span><i/></div>}
      </div>
      <p className="feed-instruction">DRAG THE FOOD TO THE MONSTER</p>
    </section>
  </GameFrame>;
}

function PackGame({ sound, onHome }: { sound: boolean; onHome: () => void }) {
  const [round, setRound] = useState(0); const [score, setScore] = useState(0); const [remaining, setRemaining] = useState<string[]>([...packRounds[0].targets]); const [itemOrder, setItemOrder] = useState<string[]>([...packRounds[0].options]); const [packed, setPacked] = useState<string[]>([]); const [used, setUsed] = useState<string[]>([]); const [reaction, setReaction] = useState<ResultMood>(null); const [done, setDone] = useState(false); const [ready, setReady] = useState(false); const [hintDismissed, setHintDismissed] = useState(false); const [attempted, setAttempted] = useState(""); const [dropOffset, setDropOffset] = useState<{ id: string; x: number; y: number } | null>(null);
  const [drag, setDrag] = useState<{ id: string; x: number; y: number; sx: number; sy: number; moved: boolean; near: boolean } | null>(null); const bagRef = useRef<HTMLDivElement>(null);
  const data = packRounds[round];
  useEffect(() => { if (!done) { const timer = setTimeout(() => speak(data.task, sound), 350); return () => clearTimeout(timer); } }, [round, done, data.task, sound]);
  useEffect(() => { setItemOrder(shufflePackOptions(packRounds[0])); }, []);
  const startRound = (next: number) => { setRound(next); setRemaining([...packRounds[next].targets]); setItemOrder(shufflePackOptions(packRounds[next])); setPacked([]); setUsed([]); setReaction(null); setAttempted(""); setDropOffset(null); setReady(false); };
  const tryPack = (id: string) => {
    if (reaction || used.includes(id)) return; const item = schoolItems.find((entry) => entry.id === id); if (!item) return;
    const wantedAt = remaining.indexOf(item.name); const wanted = wantedAt >= 0; setAttempted(id); setReaction(wanted ? "good" : "bad");
    if (!wanted) { setTimeout(() => { setReaction(null); setAttempted(""); setDropOffset(null); }, 620); return; }
    setHintDismissed(true); const next = [...remaining]; next.splice(wantedAt, 1); setRemaining(next);
    setTimeout(() => { setUsed((value) => [...value, id]); setPacked((value) => [...value, item.emoji]); setAttempted(""); setDropOffset(null); }, 380);
    if (next.length) { setTimeout(() => setReaction(null), 620); return; }
    setScore((value) => value + 1); setReady(true); speak("Ready!", sound);
    setTimeout(() => { if (round === packRounds.length - 1) setDone(true); else startRound(round + 1); }, 1150);
  };
  const pointerDown = (event: ReactPointerEvent<HTMLButtonElement>, id: string) => { if (reaction || used.includes(id)) return; event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); setDrag({ id, x: 0, y: 0, sx: event.clientX, sy: event.clientY, moved: false, near: false }); };
  const pointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!drag || drag.id !== event.currentTarget.dataset.id) return; event.preventDefault(); const rect = bagRef.current?.getBoundingClientRect();
    const near = !!rect && event.clientX >= rect.left - 55 && event.clientX <= rect.right + 55 && event.clientY >= rect.top - 45 && event.clientY <= rect.bottom + 45;
    setDrag((current) => current ? { ...current, x: event.clientX - current.sx, y: event.clientY - current.sy, moved: current.moved || Math.abs(event.clientX - current.sx) + Math.abs(event.clientY - current.sy) > 9, near } : null);
  };
  const pointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!drag) return; const rect = bagRef.current?.getBoundingClientRect(); const overBag = !!rect && event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom; const droppedId = drag.id; const moved = drag.moved;
    setDrag(null); if (moved && overBag) { setDropOffset({ id: droppedId, x: drag.x, y: drag.y - 24 }); tryPack(droppedId); }
  };
  const pointerCancel = () => setDrag(null);
  if (done) return <FinalScreen icon="🎒" title="BAG PACKED!" score={score} total={packRounds.length} detail="READY FOR SCHOOL" tone="blue" onAgain={() => { startRound(0); setScore(0); setDone(false); setHintDismissed(false); }} onHome={onHome} />;
  const items = itemOrder.map((id) => schoolItems.find((item) => item.id === id)).filter((item): item is NonNullable<typeof item> => !!item && !used.includes(item.id));
  return <GameFrame title="PACK MY BAG" round={round} total={packRounds.length} onBack={onHome} tone="blue">
    <section className="pack-stage pack-3d-stage">
      <div className={`pack-room ${drag?.near ? "bag-near" : ""} ${reaction === "bad" ? "bag-rejecting" : ""} ${ready ? "bag-ready" : ""}`}>
        <button type="button" className="pack-mission" onClick={() => speak(data.task, sound)} aria-label="Listen to the mission"><span>MISSION</span><i aria-hidden="true">🔊</i><strong>{data.task}</strong></button>
        <div ref={bagRef} className="bag-drop-zone" aria-label="Open backpack drop zone"><span>{ready ? "READY!" : drag?.near ? "LET GO!" : "DROP HERE"}</span>{packed.map((emoji, index) => <i key={`${emoji}-${index}`} aria-hidden="true">{emoji}</i>)}</div>
        {reaction === "good" && <div className="pack-sparkles" aria-hidden="true">✦ ✓ ✦</div>}
        <div className="pack-item-dock">
          {items.map((item) => <button type="button" key={item.id} data-id={item.id} aria-label={`Drag ${item.name} into the backpack`} onPointerDown={(event) => pointerDown(event, item.id)} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerCancel} className={`pack-object ${drag?.id === item.id ? "is-dragging" : ""} ${attempted === item.id && reaction === "good" ? "is-packing" : ""} ${attempted === item.id && reaction === "bad" ? "is-rejected" : ""}`} style={{ "--item-hue": item.hue, "--drop-x": `${dropOffset?.id === item.id ? dropOffset.x : 0}px`, "--drop-y": `${dropOffset?.id === item.id ? dropOffset.y : 0}px`, ...(drag?.id === item.id ? { transform: `translate3d(${drag.x}px, ${drag.y - 24}px, 0) scale(1.17)`, zIndex: 40 } : {}) } as CSSProperties}><span aria-hidden="true">{item.emoji}</span><b>{item.label}</b></button>)}
        </div>
        {round === 0 && !hintDismissed && <div className="pack-drag-hint" aria-hidden="true"><span>☝️</span><i/></div>}
        <p className={`pack-feedback ${reaction ?? ""}`}>{ready ? "READY!" : reaction === "good" ? "PACKED!" : reaction === "bad" ? "BOOP!" : "DRAG THE ITEMS INTO THE BAG"}</p>
      </div>
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
  if (game === "pack") return <PackGame sound={sound} onHome={() => setGame(null)} />;
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
