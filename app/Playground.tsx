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

const timePortalLessons = {
  0: { base: "WATCH", past: "WATCHED", title: "TIME PORTAL", sentenceBefore: "Yesterday we", sentenceAfter: "a film.", irregular: false },
  1: { base: "PLAY", past: "PLAYED", title: "POWER THE STREET", sentenceBefore: "Yesterday they", sentenceAfter: "football.", irregular: false },
  4: { base: "GO", past: "WENT", title: "TIME GLITCH", sentenceBefore: "Yesterday I", sentenceAfter: "home.", irregular: true },
  5: { base: "SEE", past: "SAW", title: "IRREGULAR RIFT", sentenceBefore: "Yesterday she", sentenceAfter: "a friend.", irregular: true },
} as const;

const bridgeWords = ["Yesterday", "we", "watched", "a film."] as const;
const bridgeBank = ["a film.", "watched", "Yesterday", "we"] as const;
const escapeRelays = {
  6: [{ base: "PLAY", past: "PLAYED" }, { base: "GO", past: "WENT" }],
  7: [{ base: "SEE", past: "SAW" }, { base: "WATCH", past: "WATCHED" }],
} as const;

type CringeMode = "delete" | "replace" | "unscramble" | "repair" | "natural" | "send";
type CringeRound = {
  stage: 1 | 2 | 3; stageLabel: "SPOT IT" | "FIX IT" | "SOUND HUMAN"; mode: CringeMode;
  author: string; avatar: string; tokens: string[]; solution: string[]; reaction: string; hint: string;
  targetIndex?: number; tray?: string[]; answer?: string; rule?: string;
};

const cringeRounds: CringeRound[] = [
  { stage: 1, stageLabel: "SPOT IT", mode: "delete", author: "alex_07", avatar: "A", tokens: ["I", "am", "agree", "with", "you."], solution: ["I", "agree", "with", "you."], targetIndex: 1, reaction: "Same — that's exactly what I meant.", hint: "Drag the extra word to trash" },
  { stage: 1, stageLabel: "SPOT IT", mode: "delete", author: "maya", avatar: "M", tokens: ["She", "can", "to", "swim."], solution: ["She", "can", "swim."], targetIndex: 2, reaction: "Yeah, she's on the school team.", hint: "Remove the word that does not belong" },
  { stage: 1, stageLabel: "SPOT IT", mode: "repair", author: "dave", avatar: "D", tokens: ["I", "didn't", "went", "there."], solution: ["I", "didn't", "go", "there."], targetIndex: 2, answer: "go", rule: "DIDN'T → BASE VERB", reaction: "Me neither. It was raining anyway.", hint: "Drag the glitching word into repair" },
  { stage: 1, stageLabel: "SPOT IT", mode: "replace", author: "zoe", avatar: "Z", tokens: ["He", "don't", "like", "it."], solution: ["He", "doesn't", "like", "it."], targetIndex: 1, tray: ["didn't", "doesn't", "isn't"], answer: "doesn't", reaction: "Fair, it's not really his thing.", hint: "Tap the odd word, then replace it" },
  { stage: 2, stageLabel: "FIX IT", mode: "replace", author: "luna", avatar: "L", tokens: ["I", "very", "like", "this", "song."], solution: ["I", "really", "like", "this", "song."], targetIndex: 1, tray: ["much", "so", "really"], answer: "really", reaction: "Same — it's been on repeat all day.", hint: "Choose a better word and drop it in" },
  { stage: 2, stageLabel: "FIX IT", mode: "unscramble", author: "sam", avatar: "S", tokens: ["yesterday.", "went", "I", "there"], solution: ["I", "went", "there", "yesterday."], reaction: "Oh, was it busy?", hint: "Drag the message into a natural order" },
  { stage: 2, stageLabel: "FIX IT", mode: "delete", author: "nick", avatar: "N", tokens: ["We", "did", "saw", "that", "movie."], solution: ["We", "saw", "that", "movie."], targetIndex: 1, reaction: "Right! The ending was wild.", hint: "Delete the extra word" },
  { stage: 2, stageLabel: "FIX IT", mode: "delete", author: "emma", avatar: "E", tokens: ["We", "discussed", "about", "the", "plan."], solution: ["We", "discussed", "the", "plan."], targetIndex: 2, reaction: "Good — so are we doing it?", hint: "Delete the unnecessary word" },
  { stage: 3, stageLabel: "SOUND HUMAN", mode: "natural", author: "leo", avatar: "L", tokens: ["I", "very", "love", "this", "game."], solution: ["I", "really", "love", "this", "game."], targetIndex: 1, tray: ["actually", "very", "really", "much"], answer: "really", reaction: "Same. One more round?", hint: "Make the message sound natural" },
  { stage: 3, stageLabel: "SOUND HUMAN", mode: "replace", author: "maya", avatar: "M", tokens: ["How", "is", "it", "called?"], solution: ["What", "is", "it", "called?"], targetIndex: 0, tray: ["Which", "What", "Why"], answer: "What", reaction: "Night Shift, I think.", hint: "Replace the word that sounds translated" },
  { stage: 3, stageLabel: "SOUND HUMAN", mode: "send", author: "alex_07", avatar: "A", tokens: ["I'm", "into", "horror", "movies."], solution: ["I'm", "into", "horror", "movies."], reaction: "Same. Have you seen The Thing?", hint: "This one may already be ready" },
  { stage: 3, stageLabel: "SOUND HUMAN", mode: "unscramble", author: "zoe", avatar: "Z", tokens: ["this", "weekend?", "you", "Do", "to", "hang", "out", "want"], solution: ["Do", "you", "want", "to", "hang", "out", "this", "weekend?"], reaction: "Yeah — Saturday works for me.", hint: "Rebuild the message, then send it" },
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

type MonsterVoiceMood = "request" | "happy" | "funny";

function findNaturalEnglishVoice(voices: SpeechSynthesisVoice[]) {
  const englishVoices = voices.filter((voice) => /^en[-_]/i.test(voice.lang));
  return englishVoices.sort((left, right) => {
    const quality = (voice: SpeechSynthesisVoice) => {
      const name = voice.name.toLowerCase(); let score = 0;
      if (/natural|online/.test(name)) score += 100;
      if (/google (us|uk) english/.test(name)) score += 85;
      if (/aria|jenny|sonia|samantha|ava|serena/.test(name)) score += 70;
      if (/microsoft|google|apple/.test(name)) score += 25;
      if (/en-us/i.test(voice.lang)) score += 12;
      if (voice.localService) score += 4;
      return score;
    };
    return quality(right) - quality(left);
  })[0];
}

function speakMonster(text: string, enabled: boolean, mood: MonsterVoiceMood = "request") {
  if (!enabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const synthesizer = window.speechSynthesis; synthesizer.cancel();
  const utterance = new SpeechSynthesisUtterance(text); const voice = findNaturalEnglishVoice(synthesizer.getVoices());
  if (voice) { utterance.voice = voice; utterance.lang = voice.lang; } else utterance.lang = "en-US";
  utterance.rate = mood === "request" ? 0.84 : mood === "happy" ? 0.92 : 0.86;
  utterance.pitch = mood === "request" ? 1.02 : mood === "happy" ? 1.09 : 0.92;
  utterance.volume = 1;
  synthesizer.speak(utterance);
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
  useEffect(() => { if (!done) { const timer = setTimeout(() => speakMonster(data.prompt, sound), 350); return () => clearTimeout(timer); } }, [round, done, data.prompt, sound]);
  const finishDrop = (name: string) => {
    if (reaction) return; const correct = name === data.want; setPicked(name); setReaction(correct ? "good" : "bad");
    if (correct) {
      setScore((value) => value + 1); speakMonster("Yum! Thank you!", sound, "happy");
      setTimeout(() => { if (round === feedRounds.length - 1) setDone(true); else setRound((value) => value + 1); setReaction(null); setPicked(""); }, 1050);
    } else {
      speakMonster("Bleh!", sound, "funny"); setTimeout(() => { setReaction(null); setPicked(""); }, 950);
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
        <button type="button" className="speech-bubble" onClick={() => speakMonster(data.prompt, sound)} aria-label="Repeat request"><span>🔊</span>{data.prompt}</button>
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
  const [scene, setScene] = useState(0); const [lives, setLives] = useState(3); const [reaction, setReaction] = useState<ResultMood>(null); const [done, setDone] = useState(false); const [escaped, setEscaped] = useState(true); const [transformed, setTransformed] = useState(""); const [bridgePlaced, setBridgePlaced] = useState<(string | null)[]>([null, null, null, null]); const [rejected, setRejected] = useState(""); const [createdPast, setCreatedPast] = useState(""); const [relayStep, setRelayStep] = useState(0);
  const [drag, setDrag] = useState<{ id: string; x: number; y: number; sx: number; sy: number; moved: boolean; near: string } | null>(null);
  const portalRef = useRef<HTMLDivElement>(null); const doorRef = useRef<HTMLDivElement>(null); const bridgeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const portalLesson = scene === 0 ? timePortalLessons[0] : scene === 1 ? timePortalLessons[1] : scene === 4 ? timePortalLessons[4] : scene === 5 ? timePortalLessons[5] : null;
  const relay = scene === 6 ? escapeRelays[6] : scene === 7 ? escapeRelays[7] : null; const relayVerb = relay?.[relayStep];
  const advance = () => { setScene((value) => value + 1); setReaction(null); setTransformed(""); setRejected(""); setCreatedPast(""); setRelayStep(0); };
  const damage = () => { setLives((value) => { const next = Math.max(0, value - 1); if (next === 0) setTimeout(() => { setEscaped(false); setDone(true); }, 700); return next; }); };
  const findZone = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const inside = (element: HTMLDivElement | null, padding = 0) => { const rect = element?.getBoundingClientRect(); return !!rect && event.clientX >= rect.left - padding && event.clientX <= rect.right + padding && event.clientY >= rect.top - padding && event.clientY <= rect.bottom + padding; };
    if (inside(portalRef.current, 20)) return "portal"; if (inside(doorRef.current, 15)) return "door";
    const bridgeIndex = bridgeRefs.current.findIndex((element) => inside(element, 8)); return bridgeIndex >= 0 ? `bridge-${bridgeIndex}` : "";
  };
  const beginDrag = (event: ReactPointerEvent<HTMLButtonElement>, id: string) => { if (reaction) return; event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); setDrag({ id, x: 0, y: 0, sx: event.clientX, sy: event.clientY, moved: false, near: "" }); };
  const moveDrag = (event: ReactPointerEvent<HTMLButtonElement>) => { if (!drag || drag.id !== event.currentTarget.dataset.id) return; event.preventDefault(); const x = event.clientX - drag.sx; const y = event.clientY - drag.sy; setDrag((value) => value ? { ...value, x, y, moved: value.moved || Math.abs(x) + Math.abs(y) > 9, near: findZone(event) } : null); };
  const completePortal = (past: string, irregular: boolean) => { setReaction("good"); setTransformed(past); setTimeout(() => setReaction(null), irregular ? 900 : 650); };
  const handleBridgeDrop = (id: string, zone: string) => {
    if (!zone.startsWith("bridge-")) return; const slot = Number(zone.split("-")[1]);
    if (bridgeWords[slot] !== id) { setRejected(id); setReaction("bad"); setTimeout(() => { setRejected(""); setReaction(null); }, 650); return; }
    const next = [...bridgePlaced]; next[slot] = id; setBridgePlaced(next); setReaction("good");
    if (next.every(Boolean)) setTimeout(() => { setBridgePlaced([null, null, null, null]); advance(); }, 1000); else setTimeout(() => setReaction(null), 430);
  };
  const handleCreateDrop = (id: string, zone: string) => {
    if (createdPast) { if (id === "WATCHED" && zone === "door") { setReaction("good"); setTimeout(advance, 1050); } return; }
    if (zone === "door" && id === "WATCH") { setRejected("WATCH"); setReaction("bad"); damage(); setTimeout(() => { setRejected(""); setReaction(null); }, 950); return; }
    if (zone !== "portal") return;
    if (id !== "WATCH") { setRejected(id); setReaction("bad"); setTimeout(() => { setRejected(""); setReaction(null); }, 720); return; }
    setCreatedPast("WATCHED"); setTransformed("WATCHED"); setReaction("good"); setTimeout(() => { setReaction(null); setTransformed(""); }, 650);
  };
  const handleRelayDrop = (id: string, zone: string) => {
    if (!relay || !relayVerb || zone !== "portal" || id !== relayVerb.base) return; setReaction("good"); setTransformed(relayVerb.past);
    setTimeout(() => { setTransformed(""); if (relayStep < relay.length - 1) { setRelayStep((value) => value + 1); setReaction(null); } else if (scene === 7) { setEscaped(true); setDone(true); } else advance(); }, 900);
  };
  const dropToken = (id: string, zone: string) => {
    if (scene === 2) { handleBridgeDrop(id, zone); return; } if (scene === 3) { handleCreateDrop(id, zone); return; } if (scene === 6 || scene === 7) { handleRelayDrop(id, zone); return; }
    if (!portalLesson) return;
    if (!transformed && zone === "portal" && id === portalLesson.base) { completePortal(portalLesson.past, portalLesson.irregular); return; }
    if (transformed && zone === "door" && id === portalLesson.past) { setReaction("good"); setTimeout(advance, 900); }
  };
  const endDrag = (event: ReactPointerEvent<HTMLButtonElement>) => { if (!drag) return; const id = drag.id; const moved = drag.moved; const zone = findZone(event); setDrag(null); if (moved) dropToken(id, zone); };
  const cancelDrag = () => setDrag(null);
  const token = (id: string, extra = "") => <button type="button" key={id} data-id={id} className={`time-word ${extra} ${drag?.id === id ? "is-dragging" : ""} ${rejected === id ? "is-rejected" : ""}`} aria-label={`Drag ${id}`} onPointerDown={(event) => beginDrag(event, id)} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={cancelDrag} style={drag?.id === id ? { transform: `translate3d(${drag.x}px, ${drag.y - 20}px, 0) scale(1.13)`, zIndex: 40 } : undefined}>{id}</button>;
  const reset = () => { setScene(0); setLives(3); setReaction(null); setDone(false); setEscaped(true); setTransformed(""); setBridgePlaced([null, null, null, null]); setRejected(""); setCreatedPast(""); setRelayStep(0); setDrag(null); };
  if (done) return <FinalScreen icon={escaped ? "✦" : "⌛"} title={escaped ? "TIME REPAIRED" : "RIFT RESET"} score={escaped ? 8 : scene} total={8} detail={escaped ? "YOU ESCAPED!" : "TRY THE TIMELINE AGAIN"} tone="purple" onAgain={reset} onHome={onHome} />;
  return <GameFrame title="ENGLISH SURVIVAL" round={scene} total={8} onBack={onHome} tone="purple">
    <section className={`time-stage danger-${3 - lives} ${reaction === "bad" ? "time-error" : ""} ${reaction === "good" ? "time-success" : ""}`}>
      <div className="time-world">
        <div className="time-rain" aria-hidden="true"/>
        <div className="survival-hud"><strong>TIME BROKE</strong><div className="survival-lives" aria-label={`${lives} lives`}>{[0,1,2].map((heart) => <span key={heart} className={heart < lives ? "alive" : "lost"}>♥</span>)}</div></div>
        {portalLesson && <div className={`portal-mission ${portalLesson.irregular ? "irregular-scene" : ""}`}>
          <div className="world-caption"><small>{portalLesson.title}</small><b>{transformed ? "Use the form you checked to repair the sentence" : "Say the past form aloud. Then check yourself."}</b></div>
          <div className="portal-steps" aria-label="Say it, check it, use it">
            <span className={transformed ? "is-done" : "is-active"}>1 · SAY IT</span>
            <span className={transformed ? "is-done" : ""}>2 · CHECK</span>
            <span className={transformed ? "is-active" : ""}>3 · USE IT</span>
          </div>
          <div className="time-side today-side"><span>TODAY</span>{transformed ? <strong className="time-word time-word-static">{portalLesson.base}</strong> : token(portalLesson.base)}</div>
          <div ref={portalRef} className={`time-portal ${drag?.near === "portal" ? "is-near" : ""} ${reaction === "good" ? "is-transforming" : ""}`}><i/><em>{portalLesson.irregular ? "IRREGULAR" : "TIME PORTAL"}</em></div>
          <div className="time-side yesterday-side"><span>YESTERDAY</span>{transformed ? token(transformed, "portal-answer") : <strong className="past-ghost">PAST</strong>}</div>
          <div ref={doorRef} className={`portal-sentence ${drag?.near === "door" ? "is-near" : ""} ${reaction === "good" && transformed ? "is-powered" : ""}`} aria-label="Sentence drop zone"><span>{portalLesson.sentenceBefore}</span><i>___</i><span>{portalLesson.sentenceAfter}</span></div>
          <p className="world-clue world-instruction"><b>{transformed ? "USE IT" : "ACTION"}</b><span>{transformed ? "Drag the checked verb into the sentence" : "Say the past form aloud, then drag the verb through the portal"}</span></p>
        </div>}
        {scene === 2 && <div className="bridge-mission">
          <div className="world-caption"><small>REPAIR THE BRIDGE</small><b>Build the sentence to cross the gap</b></div>
          <div className="bridge-slots">{bridgeWords.map((word, index) => <div key={word} ref={(element) => { bridgeRefs.current[index] = element; }} className={`bridge-slot ${drag?.near === `bridge-${index}` ? "is-near" : ""} ${bridgePlaced[index] ? "is-powered" : ""}`}><span>{bridgePlaced[index] ?? index + 1}</span></div>)}</div>
          <div className="bridge-bank">{bridgeBank.filter((word) => !bridgePlaced.includes(word)).map((word) => token(word, "bridge-word"))}</div>
          <p className="world-clue world-instruction"><b>ACTION</b><span>Drag the words into the slots in the correct order</span></p>
        </div>}
        {scene === 3 && <div className={`create-mission ${rejected === "WATCH" ? "yesterday-alert" : ""}`}>
          <div className="world-caption"><small>CREATE THE VERB</small><b>Read the memory. Change the verb. Unlock the door.</b></div>
          <div className="memory-screen"><i/><i/><i/><span>FILM MEMORY</span></div>
          <div className="create-route">
            <div className="create-verbs">{createdPast ? token("WATCHED", "created-word") : ["PLAY", "WATCH", "VISIT"].map((word) => token(word))}</div>
            <div ref={portalRef} className={`time-portal mini-portal ${drag?.near === "portal" ? "is-near" : ""} ${reaction === "good" && createdPast ? "is-transforming" : ""}`}><i/><em>PAST</em></div>
            <div ref={doorRef} className={`time-door ${drag?.near === "door" ? "is-near" : ""} ${reaction === "good" && createdPast ? "door-ready" : ""}`}><span className="yesterday-word">Yesterday</span><b>we <i>{createdPast ? "___" : "___"}</i> a film.</b><em>ENERGY SLOT</em></div>
          </div>
          <p className="world-clue world-instruction"><b>{rejected === "WATCH" ? "TIME HINT" : "ACTION"}</b><span>{createdPast ? "Drag the transformed verb into the door slot" : rejected === "WATCH" ? "Use the portal before the door" : "Drag the matching verb through the portal"}</span></p>
        </div>}
        {relay && relayVerb && <div className="relay-mission">
          <div className="world-caption"><small>{scene === 6 ? "ESCAPE RELAY I" : "FINAL ESCAPE"}</small><b>Repair every time fragment</b></div>
          <div className="escape-cells">{relay.map((verb, index) => <span key={verb.base} className={index < relayStep || (index === relayStep && transformed) ? "powered" : ""}>{index + 1}</span>)}</div>
          <div className="relay-track">{token(relayVerb.base, "relay-word")}<div ref={portalRef} className={`time-portal relay-portal ${drag?.near === "portal" ? "is-near" : ""} ${reaction === "good" ? "is-transforming" : ""}`}><i/><em>SHIFT</em></div><div className="relay-output">{transformed || "?"}</div></div>
          <div className={`escape-gate ${scene === 7 && relayStep === 1 ? "almost-open" : ""}`}><i/><i/><b>ESCAPE GATE</b></div>
          <p className="world-clue world-instruction"><b>ACTION</b><span>Drag the next verb through the portal</span></p>
        </div>}
      </div>
    </section>
  </GameFrame>;
}

function CringeGame({ onHome }: { onHome: () => void }) {
  type ChatDrag = { kind: "word" | "tray" | "message"; index: number; word: string; x: number; y: number; sx: number; sy: number; moved: boolean; near: string };
  const [round, setRound] = useState(0); const [words, setWords] = useState<string[]>([...cringeRounds[0].tokens]); const [selected, setSelected] = useState<number | null>(null); const [vibe, setVibe] = useState(62); const [score, setScore] = useState(0); const [natural, setNatural] = useState(0); const [streak, setStreak] = useState(0); const [best, setBest] = useState(0); const [mistakes, setMistakes] = useState(0); const [reaction, setReaction] = useState<ResultMood>(null); const [npcBubble, setNpcBubble] = useState(""); const [sent, setSent] = useState(false); const [done, setDone] = useState(false); const [drag, setDrag] = useState<ChatDrag | null>(null);
  const trashRef = useRef<HTMLDivElement>(null); const repairRef = useRef<HTMLDivElement>(null); const sendRef = useRef<HTMLButtonElement>(null); const wordRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const data = cringeRounds[round]; const ready = words.join("|") === data.solution.join("|");
  const stageProgress = cringeRounds.filter((item, index) => item.stage === data.stage && index <= round).length;
  const stageTotal = cringeRounds.filter((item) => item.stage === data.stage).length;
  const pointInside = (event: ReactPointerEvent<HTMLElement>, element: Element | null, padding = 0) => { const rect = element?.getBoundingClientRect(); return !!rect && event.clientX >= rect.left - padding && event.clientX <= rect.right + padding && event.clientY >= rect.top - padding && event.clientY <= rect.bottom + padding; };
  const findChatZone = (event: ReactPointerEvent<HTMLElement>) => {
    if (pointInside(event, trashRef.current, 16)) return "trash";
    if (pointInside(event, repairRef.current, 16)) return "repair";
    if (pointInside(event, sendRef.current, 14)) return "send";
    const wordIndex = wordRefs.current.findIndex((element) => pointInside(event, element, 7));
    return wordIndex >= 0 ? `word-${wordIndex}` : "";
  };
  const miss = () => {
    if (reaction) return; setReaction("bad"); setNpcBubble(mistakes % 2 ? "what 💀" : "bro..."); setMistakes((value) => value + 1); setVibe((value) => Math.max(8, value - 4)); setStreak(0);
    setTimeout(() => { setReaction(null); setNpcBubble(""); }, 760);
  };
  const fixedFlash = () => { setReaction("good"); setTimeout(() => setReaction(null), 430); };
  const deleteWord = (index: number) => {
    if (data.mode !== "delete" || index !== data.targetIndex) { miss(); return; }
    setWords((value) => value.filter((_, wordIndex) => wordIndex !== index)); setSelected(null); fixedFlash();
  };
  const replaceWord = (word: string) => {
    if ((data.mode !== "replace" && data.mode !== "natural") || selected !== data.targetIndex || word !== data.answer) { miss(); return; }
    setWords((value) => value.map((entry, index) => index === selected ? word : entry)); setSelected(null); fixedFlash();
  };
  const repairWord = (index: number) => {
    if (data.mode !== "repair" || index !== data.targetIndex || !data.answer) { miss(); return; }
    setReaction("good"); setTimeout(() => { setWords((value) => value.map((entry, wordIndex) => wordIndex === index ? data.answer! : entry)); setSelected(null); setReaction(null); }, 620);
  };
  const moveWord = (from: number, to: number) => {
    if (data.mode !== "unscramble" || from === to || from < 0 || to < 0) return;
    setWords((value) => { const next = [...value]; const [moved] = next.splice(from, 1); next.splice(to, 0, moved); return next; }); setSelected(to);
  };
  const beginDrag = (event: ReactPointerEvent<HTMLElement>, kind: ChatDrag["kind"], word: string, index: number) => {
    if (reaction || sent) return; event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); if (kind === "word") setSelected(index); setDrag({ kind, word, index, x: 0, y: 0, sx: event.clientX, sy: event.clientY, moved: false, near: "" });
  };
  const moveDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (!drag) return; event.preventDefault(); const x = event.clientX - drag.sx; const y = event.clientY - drag.sy; setDrag((value) => value ? { ...value, x, y, moved: value.moved || Math.abs(x) + Math.abs(y) > 8, near: findChatZone(event) } : null);
  };
  const endWordDrag = (event: ReactPointerEvent<HTMLButtonElement>, index: number) => {
    if (!drag || drag.kind !== "word" || drag.index !== index) return; const zone = findChatZone(event); const moved = drag.moved; setDrag(null);
    if (!moved) { setSelected(index); return; }
    if (data.mode === "delete" && zone === "trash") { deleteWord(index); return; }
    if (data.mode === "repair" && zone === "repair") { repairWord(index); return; }
    if (data.mode === "unscramble" && zone.startsWith("word-")) { moveWord(index, Number(zone.split("-")[1])); return; }
    if (data.mode === "send") miss();
  };
  const endTrayDrag = (event: ReactPointerEvent<HTMLButtonElement>, word: string) => {
    if (!drag || drag.kind !== "tray" || drag.word !== word) return; const zone = findChatZone(event); const moved = drag.moved; setDrag(null);
    if (!moved || zone === `word-${selected}`) replaceWord(word); else miss();
  };
  const sendMessage = () => {
    if (!ready || sent || reaction) { if (!ready) miss(); return; }
    setSent(true); setReaction("good"); setNpcBubble(data.reaction); setScore((value) => value + 1); if (data.stage === 3) setNatural((value) => value + 1); setVibe((value) => Math.min(100, value + 4)); setStreak((value) => { const next = value + 1; setBest((current) => Math.max(current, next)); return next; });
    setTimeout(() => { if (round === cringeRounds.length - 1) setDone(true); else { const next = round + 1; setRound(next); setWords([...cringeRounds[next].tokens]); setSelected(null); setReaction(null); setNpcBubble(""); setSent(false); setDrag(null); } }, 1050);
  };
  const endMessageDrag = (event: ReactPointerEvent<HTMLDivElement>) => { if (!drag || drag.kind !== "message") return; const zone = findChatZone(event); setDrag(null); if (zone === "send") sendMessage(); };
  const reset = () => { setRound(0); setWords([...cringeRounds[0].tokens]); setSelected(null); setVibe(62); setScore(0); setNatural(0); setStreak(0); setBest(0); setMistakes(0); setReaction(null); setNpcBubble(""); setSent(false); setDone(false); setDrag(null); };
  const finalLine = vibe >= 90 ? "The conversation flows naturally." : vibe >= 70 ? "The group chat sounds clear and confident." : "The chat survived — a few messages took extra work.";
  if (done) return <main className="game-shell game-red cringe-final-shell"><header className="game-topbar"><button type="button" className="back-button" onClick={onHome} aria-label="Back to zones">‹</button><strong>CRINGE OR CORRECT?</strong><span>12 / 12</span></header><section className="cringe-final"><p>FIX THE CRINGE · CHAT COMPLETE</p><h1>FINAL CHAT VIBE</h1><b>{vibe}%</b><h2>{finalLine}</h2><div className="cringe-stats"><span><small>MESSAGES SENT</small><strong>{score}</strong></span><span><small>NATURAL PHRASES</small><strong>{natural}</strong></span><span><small>BEST STREAK</small><strong>{best}</strong></span><span><small>RETRIES</small><strong>{mistakes}</strong></span></div><button type="button" className="primary-game-button" onClick={reset}>REPLAY ↻</button><button type="button" className="text-button" onClick={onHome}>PICK ANOTHER ZONE</button></section></main>;
  const dragStyle = (kind: ChatDrag["kind"], index: number, word = "") => drag?.kind === kind && drag.index === index && (!word || drag.word === word) ? { transform: `translate3d(${drag.x}px, ${drag.y - 16}px, 0) scale(1.12)`, zIndex: 80 } : undefined;
  return <GameFrame title="CRINGE OR CORRECT?" round={round} total={cringeRounds.length} onBack={onHome} tone="red">
    <section className={`cringe-stage chat-game ${reaction === "bad" ? "chat-glitch" : ""}`}>
      <div className="chat-game-head"><div><small>FIX THE CRINGE</small><strong>ROUND {data.stage} · {data.stageLabel}</strong></div><div className="chat-vibe"><span>CHAT VIBE <b>{vibe}%</b></span><i><em style={{ width: `${vibe}%` }}/></i></div><div className="chat-streak">STREAK <b>×{streak}</b></div></div>
      <div className="chat-layout">
        <div className="chat-window">
          <header><b># chill-zone</b><span>● {5 + data.stage} online</span><i>⌕　♩</i></header>
          <div className="chat-feed">
            <article className="chat-message ambient-message"><div className="chat-avatar bot">C</div><div><p><b>chat_core</b><time>now</time></p><div className="npc-text">read it. fix it. send it.</div></div></article>
            <article className={`chat-message current-message ${reaction ?? ""}`}><div className={`chat-avatar avatar-${data.stage}`}>{data.avatar}</div><div><p><b>{data.author}</b><time>9:{40 + round} PM</time></p><div className={`editable-message mode-${data.mode} ${sent ? "is-sent" : ""}`}>
              {words.map((word, index) => <button type="button" key={`${word}-${index}`} ref={(element) => { wordRefs.current[index] = element; }} className={`message-word ${selected === index ? "is-selected" : ""} ${data.mode === "unscramble" ? "is-fragment" : ""} ${drag?.kind === "word" && drag.index === index ? "is-dragging" : ""}`} aria-label={`${word}. Tap for actions or drag to edit.`} onPointerDown={(event) => beginDrag(event, "word", word, index)} onPointerMove={moveDrag} onPointerUp={(event) => endWordDrag(event, index)} onPointerCancel={() => setDrag(null)} onClick={(event) => { if (event.detail === 0) setSelected(index); }} style={dragStyle("word", index)}>{word}</button>)}
            </div>{data.rule && ready && <small className="micro-rule">{data.rule}</small>}</div></article>
            {npcBubble && <article className="chat-message npc-reaction"><div className="chat-avatar bot">C</div><div><p><b>chat_core</b><time>now</time></p><div className="npc-text">{npcBubble}</div></div></article>}
          </div>
          {ready && <div className="ready-composer"><div className={`ready-message ${drag?.kind === "message" ? "is-dragging" : ""}`} role="button" tabIndex={0} aria-label="Drag the finished message to Send" onPointerDown={(event) => beginDrag(event, "message", words.join(" "), -1)} onPointerMove={moveDrag} onPointerUp={endMessageDrag} onPointerCancel={() => setDrag(null)} style={dragStyle("message", -1)}><span>{words.join(" ")}</span><i>edited</i></div></div>}
          <footer><button type="button">＋</button><span>{ready ? "Message ready — drag it to SEND" : "Fix the message…"}</span><i>☺　♩</i></footer>
        </div>
        <aside className="chat-tools">
          <div className="chat-task"><small>{data.mode === "natural" ? "SOUND HUMAN" : data.mode === "unscramble" ? "UNSCRAMBLE" : data.mode === "repair" ? "GLITCH WORD" : data.mode === "delete" ? "DELETE THE CRINGE" : data.mode === "send" ? "READ THE ROOM" : "REPLACE IT"}</small><strong>{data.hint}</strong><span>Tap a word for accessible actions, or drag it.</span></div>
          {data.mode === "delete" && <div ref={trashRef} className={`chat-drop trash-drop ${drag?.near === "trash" ? "is-near" : ""}`}><b>⌫</b><span>TRASH</span></div>}
          {data.mode === "repair" && <div ref={repairRef} className={`chat-drop repair-drop ${drag?.near === "repair" ? "is-near" : ""} ${reaction === "good" ? "is-working" : ""}`}><b>⌁</b><span>REPAIR SLOT</span></div>}
          {(data.mode === "replace" || data.mode === "natural") && <div className={`word-tray ${selected === null ? "is-locked" : ""}`}><small>{selected === null ? "TAP THE WORD TO OPEN THE TRAY" : "DRAG A WORD CHIP INTO THE MESSAGE"}</small><div>{data.tray?.map((word, index) => <button type="button" key={word} className={`tray-word ${drag?.kind === "tray" && drag.word === word ? "is-dragging" : ""}`} onPointerDown={(event) => beginDrag(event, "tray", word, index)} onPointerMove={moveDrag} onPointerUp={(event) => endTrayDrag(event, word)} onPointerCancel={() => setDrag(null)} onClick={(event) => { if (event.detail === 0) replaceWord(word); }} style={dragStyle("tray", index, word)}>{word}</button>)}</div></div>}
          {selected !== null && <div className="tap-actions"><small>TAP ACTIONS</small>{data.mode === "delete" && <button type="button" onClick={() => deleteWord(selected)}>DELETE SELECTED</button>}{data.mode === "repair" && <button type="button" onClick={() => repairWord(selected)}>REPAIR SELECTED</button>}{data.mode === "unscramble" && <><button type="button" disabled={selected === 0} onClick={() => moveWord(selected, selected - 1)}>← MOVE</button><button type="button" disabled={selected === words.length - 1} onClick={() => moveWord(selected, selected + 1)}>MOVE →</button></>}</div>}
          <div className="chat-cycle"><span className={ready ? "done" : "active"}>READ</span><i>→</i><span className={ready ? "done" : "active"}>FIX</span><i>→</i><span className={ready ? "active" : ""}>SEND</span></div>
          <button ref={sendRef} type="button" className={`chat-send ${ready ? "is-ready" : ""} ${drag?.near === "send" ? "is-near" : ""}`} disabled={!ready || sent} onPointerDown={(event) => event.stopPropagation()} onClick={sendMessage}><span>SEND</span><b>↗</b></button>
          <p className="chat-round-count">{data.stageLabel} · {stageProgress} / {stageTotal}</p>
        </aside>
      </div>
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
