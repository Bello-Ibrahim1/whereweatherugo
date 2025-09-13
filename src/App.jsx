import React, { useEffect, useRef, useState } from "react";
import {
  MapPin,
  Search,
  Navigation,
  Sun,
  CloudRain,
  Cloud,
  Gamepad2,
  Lightbulb,
  AlertTriangle,
  Settings,
  Calendar as CalendarIcon,
  Smile,
  Compass,
  Thermometer,
  Droplets,
  Wind
} from "lucide-react";
import { Info } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from "recharts";
import { motion, AnimatePresence } from "framer-motion";

// --- WEATHER CODE MAP ---
const WEATHER_CODE = {
  0: { label: "Clear sky", icon: <Sun className="w-6 h-6" /> },
  1: { label: "Mainly clear", icon: <Sun className="w-6 h-6" /> },
  2: { label: "Partly cloudy", icon: <Cloud className="w-6 h-6" /> },
  3: { label: "Overcast", icon: <Cloud className="w-6 h-6" /> },
  45: { label: "Fog", icon: <Cloud className="w-6 h-6" /> },
  48: { label: "Depositing rime fog", icon: <Cloud className="w-6 h-6" /> },
  51: { label: "Light drizzle", icon: <CloudRain className="w-6 h-6" /> },
  53: { label: "Moderate drizzle", icon: <CloudRain className="w-6 h-6" /> },
  55: { label: "Dense drizzle", icon: <CloudRain className="w-6 h-6" /> },
  56: { label: "Light freezing drizzle", icon: <CloudRain className="w-6 h-6" /> },
  57: { label: "Dense freezing drizzle", icon: <CloudRain className="w-6 h-6" /> },
  61: { label: "Slight rain", icon: <CloudRain className="w-6 h-6" /> },
  63: { label: "Moderate rain", icon: <CloudRain className="w-6 h-6" /> },
  65: { label: "Heavy rain", icon: <CloudRain className="w-6 h-6" /> },
  66: { label: "Light freezing rain", icon: <CloudRain className="w-6 h-6" /> },
  67: { label: "Heavy freezing rain", icon: <CloudRain className="w-6 h-6" /> },
  71: { label: "Slight snow", icon: <Cloud className="w-6 h-6" /> },
  73: { label: "Moderate snow", icon: <Cloud className="w-6 h-6" /> },
  75: { label: "Heavy snow", icon: <Cloud className="w-6 h-6" /> },
  77: { label: "Snow grains", icon: <Cloud className="w-6 h-6" /> },
  80: { label: "Slight rain showers", icon: <CloudRain className="w-6 h-6" /> },
  81: { label: "Moderate rain showers", icon: <CloudRain className="w-6 h-6" /> },
  82: { label: "Violent rain showers", icon: <CloudRain className="w-6 h-6" /> },
  85: { label: "Slight snow showers", icon: <Cloud className="w-6 h-6" /> },
  86: { label: "Heavy snow showers", icon: <Cloud className="w-6 h-6" /> },
  95: { label: "Thunderstorm", icon: <CloudRain className="w-6 h-6" /> },
  96: { label: "Thunderstorm w/ hail", icon: <CloudRain className="w-6 h-6" /> },
  99: { label: "Thunderstorm w/ heavy hail", icon: <CloudRain className="w-6 h-6" /> }
};

// --- CITY DB (for game & facts) ---
const CITY_DB = [
  { name: "New York", country: "USA", region: "North America", lat: 40.7128, lon: -74.006, landmarks: ["Statue of Liberty"], facts: ["Times Square is nicknamed ‘The Crossroads of the World’.", "Central Park is larger than Monaco."] },
  { name: "London", country: "UK", region: "Europe", lat: 51.5072, lon: -0.1276, landmarks: ["Big Ben", "Tower Bridge"], facts: ["The Underground is the oldest metro.", "London has 170+ museums."] },
  { name: "Tokyo", country: "Japan", region: "Asia", lat: 35.6895, lon: 139.6917, landmarks: ["Shibuya Crossing"], facts: ["Tokyo was once called Edo.", "Vending machines are everywhere."] },
  { name: "Paris", country: "France", region: "Europe", lat: 48.8566, lon: 2.3522, landmarks: ["Eiffel Tower", "Louvre"], facts: ["Louvre is the most visited museum.", "37 bridges cross the Seine."] },
  { name: "Lagos", country: "Nigeria", region: "Africa", lat: 6.5244, lon: 3.3792, landmarks: ["Lekki Conservation Centre"], facts: ["One of Africa’s biggest tech hubs.", "Capital until 1991."] },
  { name: "Dubai", country: "UAE", region: "Asia", lat: 25.2048, lon: 55.2708, landmarks: ["Burj Khalifa"], facts: ["Home to world’s tallest building.", "Services dominate GDP now."] }
];

// --- Helpers ---
const classNames = (...c) => c.filter(Boolean).join(" ");

function Section({ title, icon, children, right }) {
  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight flex items-center gap-2">{icon}{title}</h2>
        {right}
      </div>
      <div className="bg-white/70 backdrop-blur border border-gray-200 rounded-2xl p-3 md:p-4 shadow-sm">{children}</div>
    </section>
  );
}

function useLocalStorage(key, initialValue) {
  const [val, setVal] = useState(() => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : initialValue; } catch { return initialValue; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }, [key, val]);
  return [val, setVal];
}

async function geocodeCity(name) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Geocoding failed");
  const r = (await res.json())?.results?.[0];
  if (!r) throw new Error("City not found");
  return { name: `${r.name}${r.admin1 ? ", " + r.admin1 : ""}${r.country ? ", " + r.country : ""}`, lat: r.latitude, lon: r.longitude };
}

async function fetchWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude: String(lat), longitude: String(lon), timezone: "auto", current_weather: "true",
    hourly: ["temperature_2m","relativehumidity_2m","precipitation","wind_speed_10m","weathercode","pressure_msl"].join(","),
    daily: ["weathercode","temperature_2m_max","temperature_2m_min","sunrise","sunset","uv_index_max","precipitation_sum","wind_speed_10m_max"].join(","),
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  if (!res.ok) throw new Error("Weather fetch failed");
  const data = await res.json();
  const { current_weather, hourly, daily } = data;
  const nowIdx = hourly.time.findIndex((t) => new Date(t).getTime() >= Date.now());
  const series = hourly.time.slice(Math.max(0, nowIdx), Math.max(0, nowIdx)+24).map((t,i)=>({
    time: new Date(t).toLocaleTimeString([], { hour: "numeric" }),
    temp: hourly.temperature_2m[Math.max(0, nowIdx)+i],
    humidity: hourly.relativehumidity_2m[Math.max(0, nowIdx)+i],
    precipitation: hourly.precipitation[Math.max(0, nowIdx)+i],
    wind: hourly.wind_speed_10m[Math.max(0, nowIdx)+i],
    code: hourly.weathercode[Math.max(0, nowIdx)+i],
    pressure: hourly.pressure_msl[Math.max(0, nowIdx)+i]
  }));
  const dailySeries = daily.time.map((d,i)=>({
    date: new Date(d), label: new Date(d).toLocaleDateString([], { weekday: "long" }),
    hi: daily.temperature_2m_max[i], lo: daily.temperature_2m_min[i], code: daily.weathercode[i],
    sunrise: daily.sunrise[i], sunset: daily.sunset[i], uv: daily.uv_index_max?.[i],
    precip_sum: daily.precipitation_sum?.[i], wind_max: daily.wind_speed_10m_max?.[i]
  }));
  return { current: current_weather, series, daily: dailySeries };
}

async function fetchAlerts(lat, lon) {
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/warnings?latitude=${lat}&longitude=${lon}&timezone=auto`);
    if (!res.ok) throw new Error("no alerts");
    return (await res.json())?.warnings || [];
  } catch { return []; }
}

async function fetchCityImages(titleLike) {
  try {
    const title = encodeURIComponent(titleLike);
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/media-list/${title}`);
    if (!res.ok) throw new Error("no media");
    const data = await res.json();
    return (data?.items||[]).filter(m=>m?.type==="image" && /(jpg|jpeg|png)$/i.test(m?.srcset?.[0]?.src||m?.src||""))
      .slice(0,8).map(m=>m?.srcset?.[0]?.src||m?.src);
  } catch { return []; }
}

async function fetchNearbyOverpass(lat, lon, kind = "amenity") {
  const radius = 2000;
  const filters =
    kind === "amenity"
      ? ["restaurant", "cafe", "fast_food"]
      : ["supermarket", "convenience", "mall"];

  // ✅ keep the whole template string on one line; use join("\\n") for newlines
  const q = `[
    out:json][timeout:25];
    (
      ${filters
        .map((f) => `node[${kind}=${f}](around:${radius},${lat},${lon});`)
        .join("\\n")}
      ${filters
        .map((f) => `way[${kind}=${f}](around:${radius},${lat},${lon});`)
        .join("\\n")}
    );
    out center 20;`;

  try {
    const res = await fetch(
      "https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(q)
    );
    if (!res.ok) throw new Error("overpass");
    const data = await res.json();
    return (data?.elements || []).map((el) => ({
      id: el.id,
      name: el.tags?.name || "Unnamed",
      type: el.tags?.amenity || el.tags?.shop || "place",
      lat: el.lat || el.center?.lat,
      lon: el.lon || el.center?.lon,
    }));
  } catch {
    return [];
  }
}


const kmDistance = (a,b)=>{ const R=6371, toRad=(x)=>x*Math.PI/180; const dLat=toRad(b.lat-a.lat), dLon=toRad(b.lon-a.lon); const s1=Math.sin(dLat/2)**2+Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLon/2)**2; return 2*R*Math.asin(Math.sqrt(s1)); };

// --- UI PARTS ---
function Slideshow({ images }) {
  const [idx,setIdx]=useState(0);
  useEffect(()=>{ if(!images?.length) return; const id=setInterval(()=>setIdx(i=>(i+1)%images.length),7000); return ()=>clearInterval(id); },[images]);
  if(!images?.length) return null;
  return (
    <AnimatePresence mode="wait">
      <motion.div key={images[idx]} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:1.2}} className="absolute inset-0 bg-cover bg-center" style={{backgroundImage:`url(${images[idx]})`}}/>
    </AnimatePresence>
  );
}

function WeatherHero({ city, weather, unit, images }){
  const code=weather?.current?.weathercode; const wc=code!=null?(WEATHER_CODE[code]||{label:"Unknown",icon:<Cloud className="w-6 h-6"/>}):null;
  const tC=weather?.current?.temperature; const t = unit==="C"?tC:(tC!=null?Math.round(tC*9/5+32):null);
  return (
    <div className="relative overflow-hidden rounded-3xl p-5 md:p-6 min-h-[220px] bg-gradient-to-r from-sky-100 to-indigo-100">
      <div className="absolute inset-0 -z-10 opacity-50"><Slideshow images={images}/></div>
      <div className="text-6xl md:text-7xl font-bold leading-none">{t??"—"}<span className="text-3xl">°{unit}</span></div>
      <div className="mt-2 text-lg flex items-center gap-2">{wc?.icon}<span>{wc?.label||"—"}</span></div>
      <div className="text-sm text-gray-700">{city}</div>
    </div>
  );
}

function DailySidebar({ daily, unit, onPickDay }){
  return (
    <aside className="w-full md:w-64">
      <div className="rounded-2xl bg-white/70 border overflow-hidden">
        {daily?.map((d,i)=> (
          <button key={i} onClick={()=>onPickDay?.(d)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left border-b last:border-b-0">
            <div className="w-6 h-6 text-amber-500">{(WEATHER_CODE[d.code]?.icon)||<Cloud className="w-6 h-6"/>}</div>
            <div className="flex-1">
              <div className="text-sm font-medium">{i===0?"Today":d.date.toLocaleDateString([], { weekday:"long" })}</div>
              <div className="text-xs text-gray-500">{WEATHER_CODE[d.code]?.label||"—"}</div>
            </div>
            <div className="text-sm font-semibold">{unit==="C"?`${Math.round(d.hi)}°/${Math.round(d.lo)}°`:`${Math.round(d.hi*9/5+32)}°/${Math.round(d.lo*9/5+32)}°`}</div>
          </button>
        ))}
      </div>
    </aside>
  );
}

function HourlyRow({ series, unit }){
  return (
    <div className="rounded-2xl bg-white/70 border p-3 overflow-x-auto">
      <div className="flex gap-3 min-w-max">
        {series?.slice(0,24)?.map((h,i)=> (
          <div key={i} className="w-20 flex flex-col items-center text-sm">
            <div className="mb-1 text-gray-500">{h.time}</div>
            <div className="w-6 h-6 text-amber-500">{(WEATHER_CODE[h.code]?.icon)||<Cloud className="w-6 h-6"/>}</div>
            <div className="mt-1 font-semibold">{unit==="C"?Math.round(h.temp):Math.round(h.temp*9/5+32)}°</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeatherCards({ weather }){
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="rounded-2xl border p-3 bg-white/70"><div className="text-xs text-gray-500">Wind</div><div className="text-xl font-semibold">{weather?.current?.windspeed??"—"} km/h</div></div>
      <div className="rounded-2xl border p-3 bg-white/70"><div className="text-xs text-gray-500">Humidity</div><div className="text-xl font-semibold">{weather?.series?.[0]?.humidity??"—"}%</div></div>
      <div className="rounded-2xl border p-3 bg-white/70"><div className="text-xs text-gray-500">UV index</div><div className="text-xl font-semibold">{weather?.daily?.[0]?.uv??"—"}</div></div>
      <div className="rounded-2xl border p-3 bg-white/70"><div className="text-xs text-gray-500">Pressure</div><div className="text-xl font-semibold">{weather?.series?.[0]?.pressure?Math.round(weather.series[0].pressure)+" hPa":"—"}</div></div>
    </div>
  );
}

function HourlyDetails({ series }){
  const [tab,setTab]=useState("precip");
  return (
    <div className="rounded-2xl bg-white/70 border p-3">
      <div className="flex items-center gap-2 mb-3">
        {[{id:"precip",label:"Precipitation"},{id:"wind",label:"Wind"},{id:"humidity",label:"Humidity"}].map(t=> (
          <button key={t.id} onClick={()=>setTab(t.id)} className={classNames("px-3 py-1.5 rounded-xl border text-sm", tab===t.id?"bg-gray-900 text-white":"bg-white")}>{t.label}</button>
        ))}
      </div>
      {tab==="precip" && (
        <ResponsiveContainer width="100%" height={180}><BarChart data={series} margin={{left:12,right:12,top:8,bottom:8}}><XAxis dataKey="time" tick={{fontSize:12}}/><YAxis tick={{fontSize:12}}/><Tooltip/><Bar dataKey="precipitation"/></BarChart></ResponsiveContainer>
      )}
      {tab==="wind" && (
        <ResponsiveContainer width="100%" height={180}><AreaChart data={series} margin={{left:12,right:12,top:8,bottom:8}}><XAxis dataKey="time" tick={{fontSize:12}}/><YAxis tick={{fontSize:12}}/><Tooltip/><Area type="monotone" dataKey="wind"/></AreaChart></ResponsiveContainer>
      )}
      {tab==="humidity" && (
        <ResponsiveContainer width="100%" height={180}><LineChart data={series} margin={{left:12,right:12,top:8,bottom:8}}><XAxis dataKey="time" tick={{fontSize:12}}/><YAxis tick={{fontSize:12}}/><Tooltip/><Line type="monotone" dataKey="humidity" strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer>
      )}
    </div>
  );
}

function Alerts({ alerts }){
  if(!alerts?.length) return <div className="rounded-2xl border bg-white/70 p-4 text-sm text-gray-500">No active alerts.</div>;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {alerts.map((a,i)=> (
        <div key={i} className="rounded-2xl border bg-red-50/70 p-4">
          <div className="flex items-center gap-2 font-semibold text-red-800"><AlertTriangle className="w-4 h-4"/> {a?.event||a?.headline||"Weather alert"}</div>
          {a?.description && <div className="mt-1 text-sm whitespace-pre-wrap">{a.description}</div>}
          <div className="mt-2 text-xs text-red-700">{a?.effective?`From: ${new Date(a.effective).toLocaleString()}`:""} {a?.expires?` · To: ${new Date(a.expires).toLocaleString()}`:""}</div>
          {a?.severity && <div className="text-xs mt-1">Severity: {a.severity}</div>}
        </div>
      ))}
    </div>
  );
}

function DidYouKnow({ activeCity }){
  const [query,setQuery]=useState(""); const [city,setCity]=useState(activeCity||""); const [fact,setFact]=useState(""); const [loading,setLoading]=useState(false);
  const factsFor=(name)=>CITY_DB.find(c=>c.name.toLowerCase()===name?.toLowerCase());
  useEffect(()=>{ if(activeCity){ setCity(activeCity); const f=factsFor(activeCity)?.facts?.[0]||"Click ‘Another fact’ for a surprise!"; setFact(f);} },[activeCity]);
  const pickRandomFact=()=>{ const c=factsFor(city); if(c?.facts?.length){ const i=Math.floor(Math.random()*c.facts.length); setFact(c.facts[i]); } else { setFact("No local fact cached. Try ‘Fetch from Wikipedia’. ✨"); } };
  const fetchFromWikipedia=async()=>{ if(!city) return; try{ setLoading(true); const res=await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(city)}`); if(!res.ok) throw new Error("No wiki"); const data=await res.json(); setFact(data.extract||"Couldn't find a quick fact."); } catch{ setFact("Couldn't fetch Wikipedia facts right now."); } finally{ setLoading(false);} };
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <input className="flex-1 min-w-[200px] px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Search a city (e.g., Lagos)" value={query} onChange={(e)=>setQuery(e.target.value)}/>
        <button onClick={()=>{ if(!query) return; setCity(query); setFact(""); }} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"><Search className="w-4 h-4"/> Use city</button>
        <button onClick={pickRandomFact} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200"><Lightbulb className="w-4 h-4"/> Another fact</button>
        <button onClick={fetchFromWikipedia} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200"><Info className="w-4 h-4"/> Fetch from Wikipedia</button>
      </div>
      <div className="rounded-xl p-4 bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200">
        <div className="text-sm text-amber-800 mb-1">Did you know about <span className="font-semibold">{city||"(choose a city)"}</span>?</div>
        <div className="text-lg">{loading?"Loading…":(fact||"Pick a city and click ‘Another fact’.")}</div>
      </div>
    </div>
  );
}

function GuessTheLocationGame({ onRevealCity }){
  const [round,setRound]=useState(1); const [score,setScore]=useState(0); const [question,setQuestion]=useState(null); const [selected,setSelected]=useState(null); const [finished,setFinished]=useState(false);
  const maxRounds=5;
  const newQuestion=()=>{ const choices=CITY_DB.slice(); const city=choices[Math.floor(Math.random()*choices.length)]; const options=new Set([city.name]); while(options.size<4){ options.add(choices[Math.floor(Math.random()*choices.length)].name);} const shuffled=Array.from(options).sort(()=>Math.random()-0.5); const clues=[`Region: ${city.region}`,`Starts with: ${city.name[0]}`,`${city.landmarks?.[0]?`Landmark hint: ${city.landmarks[0]}`:`Hemisphere: ${city.lat>=0?"Northern":"Southern"}`}`]; setQuestion({ city, options: shuffled, clues }); setSelected(null); };
  useEffect(()=>{ newQuestion(); },[]);
  const choose=(opt)=>{ if(!question) return; setSelected(opt); if(opt===question.city.name) setScore(s=>s+1); };
  const next=()=>{ if(round>=maxRounds){ setFinished(true); return;} setRound(r=>r+1); newQuestion(); };
  if(!question) return <div className="text-gray-500">Loading game…</div>;
  if(finished) return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="text-3xl font-bold">Game over!</div>
      <div className="text-lg">You scored <span className="font-semibold">{score}</span> / {maxRounds}</div>
      <div className="flex flex-wrap gap-2">
        <button onClick={()=>{ setRound(1); setScore(0); setFinished(false); newQuestion(); }} className="px-4 py-2 rounded-xl bg-indigo-600 text-white">Play again</button>
        <button onClick={()=>onRevealCity?.(question.city)} className="px-4 py-2 rounded-xl bg-gray-100">See weather for last city</button>
      </div>
    </div>
  );
  const correct=selected && selected===question.city.name;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between"><div className="text-sm text-gray-600">Round {round} / {maxRounds}</div><div className="text-sm font-semibold">Score: {score}</div></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 rounded-xl border p-4 bg-gradient-to-br from-sky-50 to-indigo-50"><div className="text-sm text-gray-600 mb-2">Clues</div><ul className="list-disc ml-5 space-y-1">{question.clues.map((c,i)=>(<li key={i}>{c}</li>))}</ul></div>
        <div className="md:col-span-1 flex flex-col gap-2">{question.options.map(opt=>(<button key={opt} onClick={()=>choose(opt)} disabled={!!selected} className={classNames("w-full px-3 py-2 rounded-xl border", selected?(opt===question.city.name?"bg-green-50 border-green-400":(opt===selected?"bg-red-50 border-red-400":"bg-white")):"hover:bg-gray-50")}>{opt}</button>))}</div>
      </div>
      {selected && (<div className={classNames("px-4 py-3 rounded-xl", correct?"bg-green-100 text-green-800":"bg-red-100 text-red-800")}>{correct?"Correct!":`Oops — it was ${question.city.name}.`}</div>)}
      <div className="flex justify-end"><button onClick={()=>{ if(selected) onRevealCity?.(question.city); next(); }} disabled={!selected} className={classNames("px-4 py-2 rounded-xl", selected?"bg-indigo-600 text-white":"bg-gray-200 text-gray-500")}>Next</button></div>
    </div>
  );
}

function SettingsModal({ open, onClose, unit, setUnit }){
  const [openAIKey,setOpenAIKey]=useLocalStorage("wwu_openai_key", "");
  const [placesKey,setPlacesKey]=useLocalStorage("wwu_places_key", "");
  if(!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}/>
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-5 border shadow-xl">
        <div className="flex items-center justify-between mb-3"><div className="font-semibold">Settings</div><button onClick={onClose} className="px-2 py-1 rounded-xl border">Close</button></div>
        <div className="space-y-4">
          <div><div className="text-sm font-medium mb-1">Units</div><div className="flex gap-2">{["C","F"].map(u=> (<button key={u} onClick={()=>setUnit(u)} className={classNames("px-3 py-1.5 rounded-xl border", unit===u?"bg-gray-900 text-white":"bg-white")}>°{u}</button>))}</div></div>
          <div>
            <div className="text-sm font-medium mb-1">Optional API keys</div>
            <label className="block text-xs text-gray-500 mb-1">OpenAI API key (stored locally)</label>
            <input value={openAIKey} onChange={(e)=>setOpenAIKey(e.target.value)} placeholder="sk-..." className="w-full px-3 py-2 rounded-xl border"/>
            <label className="block text-xs text-gray-500 mt-3 mb-1">Places API key (e.g., Google Places). Not required; app falls back to OpenStreetMap.</label>
            <input value={placesKey} onChange={(e)=>setPlacesKey(e.target.value)} placeholder="AIza..." className="w-full px-3 py-2 rounded-xl border"/>
          </div>
          <div className="text-xs text-gray-500">Keys are saved in your browser only. For production, route via your backend.</div>
        </div>
      </div>
    </div>
  );
}

function MiniCalendar({ onSelect, notes }){
  const today=new Date(); const [month,setMonth]=useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const start=new Date(month); const startDay=(start.getDay()+6)%7; const daysInMonth=new Date(month.getFullYear(), month.getMonth()+1, 0).getDate();
  const cells=[]; for(let i=0;i<startDay;i++) cells.push(null); for(let d=1; d<=daysInMonth; d++) cells.push(new Date(month.getFullYear(), month.getMonth(), d));
  const fmt=(d)=>d?.toISOString().slice(0,10);
  return (
    <div className="rounded-2xl border bg-white/70 p-3">
      <div className="flex items-center justify-between mb-2">
        <button onClick={()=>setMonth(new Date(month.getFullYear(), month.getMonth()-1, 1))} className="px-2 py-1 rounded-xl border">Prev</button>
        <div className="text-sm font-semibold">{month.toLocaleDateString([], { month:"long", year:"numeric" })}</div>
        <button onClick={()=>setMonth(new Date(month.getFullYear(), month.getMonth()+1, 1))} className="px-2 py-1 rounded-xl border">Next</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-xs text-center">
        {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=> <div key={d} className="py-1 text-gray-500">{d}</div>)}
        {cells.map((d,i)=> (
          <button key={i} disabled={!d} onClick={()=>onSelect?.(d)} className={classNames("h-9 rounded-xl border", d?"bg-white hover:bg-gray-50":"opacity-0")}>
            {d && (<div className="relative"><div>{d.getDate()}</div>{notes?.[fmt(d)] && <div className="absolute right-1 top-0 w-1.5 h-1.5 rounded-full bg-indigo-600"/>}</div>)}
          </button>
        ))}
      </div>
    </div>
  );
}

function MoodCard(){
  const [mood,setMood]=useLocalStorage("wwu_mood", { emoji:"🙂", note:"" });
  return (
    <div className="rounded-2xl border bg-white/70 p-3">
      <div className="flex items-center gap-2 mb-2"><Smile className="w-4 h-4"/><div className="font-semibold">Mood of the day</div></div>
      <div className="flex items-center gap-2">{["😀","🙂","😐","😕","😢","🔥","💪"].map(e=> (<button key={e} onClick={()=>setMood({...mood, emoji:e})} className={classNames("text-xl", mood.emoji===e?"ring-2 ring-indigo-600 rounded":"")}>{e}</button>))}</div>
      <input value={mood.note} onChange={(e)=>setMood({...mood, note:e.target.value})} placeholder="Add a note…" className="mt-2 w-full px-3 py-2 rounded-xl border"/>
    </div>
  );
}

function NearbyBeta({ coords }){
  const [tab,setTab]=useState("eat"); const [items,setItems]=useState([]);
  useEffect(()=>{ let active=true; if(!coords) return; const run=async()=>{ const kind=tab==="shop"?"shop":"amenity"; const data=await fetchNearbyOverpass(coords.lat, coords.lon, kind); if(!active) return; setItems(data); }; run(); return ()=>{active=false}; },[coords,tab]);
  return (
    <div className="rounded-2xl border bg-white/70 p-3">
      <div className="flex items-center gap-2 mb-3">{[{id:"eat",label:"Restaurants & Cafes"},{id:"shop",label:"Shops"}].map(t=> (<button key={t.id} onClick={()=>setTab(t.id)} className={classNames("px-3 py-1.5 rounded-xl border text-sm", tab===t.id?"bg-gray-900 text-white":"bg-white")}>{t.label}</button>))}<span className="ml-auto text-xs text-gray-500">Beta · Data from OpenStreetMap</span></div>
      {!coords? (<div className="text-sm text-gray-500">Search a city or share your location to load nearby places.</div>): (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">{items.slice(0,10).map(p=> (<a target="_blank" rel="noreferrer" key={p.id} href={`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lon}`} className="rounded-xl border p-2 hover:bg-gray-50"><div className="font-medium">{p.name}</div><div className="text-xs text-gray-500">{p.type} · {kmDistance(coords,p).toFixed(1)} km</div></a>))}</div>
      )}
    </div>
  );
}

function TabBar({ active, setActive }){
  const tabs=[{id:"weather",label:"Weather"},{id:"facts",label:"Facts"},{id:"game",label:"Game"},{id:"nearby",label:"Nearby"},{id:"planner",label:"Planner"}];
  return (
    <div className="border-b bg-white/60 backdrop-blur"><div className="max-w-6xl mx-auto px-4 py-2 flex gap-2">{tabs.map(t=> (<button key={t.id} onClick={()=>setActive(t.id)} className={classNames("px-3 py-2 rounded-t-xl border-b-2", active===t.id?"border-indigo-600 font-semibold":"border-transparent text-gray-600 hover:text-gray-900")}>{t.label}</button>))}</div></div>
  );
}

function LoadingSplash(){
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-gradient-to-b from-indigo-50 to-white">
      <div className="flex flex-col items-center gap-3">
        <motion.img src="/icon.png" alt="WhereWeatherUGo" className="w-9 h-9 rounded-xl shadow-sm object-cover ring-1 ring-black/5" whileHover={{ scale: 1.06, rotate: 2 }} transition={{ type: 'spring', stiffness: 250, damping: 15 }} />
        <div className="text-gray-700 font-medium tracking-tight">Loading weather…</div>
      </div>
    </div>
  );
}

function PageBackdrop({ images }) {
  // Soft, blurred full-page background slideshow based on city images
  return (
    <div className="fixed inset-0 -z-10 opacity-15 pointer-events-none">
      <Slideshow images={images} />
    </div>
  );
}

export default function WhereWeatherUGoApp(){
  const [search,setSearch]=useState(""); const [cityLabel,setCityLabel]=useState("Select a city"); const [coords,setCoords]=useState(null);
  const [weather,setWeather]=useState(null); const [alerts,setAlerts]=useState([]); const [images,setImages]=useState([]);
  const [loading,setLoading]=useState(false); const [error,setError]=useState(""); const [unit,setUnit]=useLocalStorage("wwu_unit","C");
  const [settingsOpen,setSettingsOpen]=useState(false); const [notes,setNotes]=useLocalStorage("wwu_notes",{}); const [activeTab,setActiveTab]=useState("weather");
  const containerRef=useRef(null); const [mood]=useLocalStorage("wwu_mood", { emoji:"🙂", note:"" });

  const resolveAndFetch=async(nameOrCoords)=>{ try{ setLoading(true); setError(""); let loc=nameOrCoords; if(typeof nameOrCoords==="string"){ loc=await geocodeCity(nameOrCoords);} const {lat,lon,name}=loc; const data=await fetchWeather(lat,lon); const warns=await fetchAlerts(lat,lon); const imgList=await fetchCityImages((name||`${lat.toFixed(3)}, ${lon.toFixed(3)}`).split(",")[0]); setWeather(data); setAlerts(warns); setImages(imgList); setCoords({lat,lon}); setCityLabel(name||`${lat.toFixed(3)}, ${lon.toFixed(3)}`);} catch(e){ setError(e.message||"Something went wrong"); } finally { setLoading(false);} };
  const useMyLocation=()=>{ if(!navigator.geolocation){ setError("Geolocation not supported"); return;} navigator.geolocation.getCurrentPosition(async(pos)=>{ const { latitude:lat, longitude:lon }=pos.coords; await resolveAndFetch({lat,lon,name:"My location"}); }, ()=>setError("Location permission denied")); };
  useEffect(()=>{ const fallback=CITY_DB[Math.floor(Math.random()*CITY_DB.length)]; resolveAndFetch({ lat:fallback.lat, lon:fallback.lon, name:`${fallback.name}, ${fallback.country}` }); },[]);
  const revealCityFromGame=(c)=>{ resolveAndFetch({ lat:c.lat, lon:c.lon, name:`${c.name}, ${c.country}` }); setCityLabel(`${c.name}, ${c.country}`); setActiveTab("weather"); containerRef.current?.scrollTo({top:0,behavior:"smooth"}); };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-indigo-100 via-white to-white text-gray-900" ref={containerRef}>
      <PageBackdrop images={images} />
      <div className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} transition={{duration:0.4}} className="flex items-center gap-2">
            <img src="/icon.png" alt="WhereWeatherUGo" className="w-9 h-9 rounded-xl shadow-sm object-cover ring-1 ring-black/5"/>
            <div className="text-lg font-semibold tracking-tight">WhereWeatherUGo</div>
          </motion.div>
          <div className="hidden md:flex items-center text-sm text-gray-600 ml-2">Today’s mood: <span className="ml-1 text-lg">{mood.emoji}</span>{mood.note?<span className="ml-1">· {mood.note}</span>:null}</div>
          <div className="flex-1"/>
          <div className="flex items-center gap-2 w-full md:w-[480px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input value={search} onChange={(e)=>setSearch(e.target.value)} onKeyDown={(e)=>{ if(e.key==="Enter" && search.trim()) resolveAndFetch(search.trim()); }} placeholder="Search a city (Enter to fetch)" className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
            </div>
            <button onClick={()=>search.trim() && resolveAndFetch(search.trim())} className="px-3 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700">Go</button>
            <button onClick={useMyLocation} title="Use my location" className="p-2 rounded-xl border hover:bg-gray-50"><Navigation className="w-4 h-4"/></button>
            <button onClick={()=>setSettingsOpen(true)} title="Settings" className="p-2 rounded-xl border hover:bg-gray-50"><Settings className="w-4 h-4"/></button>
          </div>
        </div>
        <TabBar active={activeTab} setActive={setActiveTab}/>
      </div>

      {activeTab==="weather" && (
        <main className="max-w-6xl mx-auto px-4 py-6 md:py-8 grid grid-cols-1 md:grid-cols-[16rem,1fr] gap-6">
          <DailySidebar daily={weather?.daily||[]} unit={unit} onPickDay={()=>{}}/>
          <div className="flex flex-col gap-6">
            <WeatherHero city={cityLabel} weather={weather} unit={unit} images={images}/>
            <HourlyRow series={weather?.series||[]} unit={unit}/>
            <WeatherCards weather={weather}/>
            <HourlyDetails series={weather?.series||[]}/>
            <Section title="Alerts" icon={<AlertTriangle className="w-5 h-5 text-red-500"/>}><Alerts alerts={alerts}/></Section>
          </div>
        </main>
      )}

      {activeTab==="facts" && (
        <main className="max-w-6xl mx-auto px-4 py-6 md:py-8 grid grid-cols-1 gap-6">
          <Section title="Did you know?" icon={<Lightbulb className="w-5 h-5 text-amber-500"/>}><DidYouKnow activeCity={cityLabel.split(",")[0]}/></Section>
        </main>
      )}

      {activeTab==="game" && (
        <main className="max-w-6xl mx-auto px-4 py-6 md:py-8 grid grid-cols-1 gap-6">
          <Section title="Guess the Location" icon={<Gamepad2 className="w-5 h-5 text-emerald-500"/>} right={<span className="text-sm text-gray-500">Test your geography skills!</span>}>
            <GuessTheLocationGame onRevealCity={revealCityFromGame}/>
          </Section>
        </main>
      )}

      {activeTab==="nearby" && (
        <main className="max-w-6xl mx-auto px-4 py-6 md:py-8 grid grid-cols-1 gap-6">
          <Section title="Nearby (beta)" icon={<MapPin className="w-5 h-5 text-indigo-500"/>} right={<span className="text-sm text-gray-500">Restaurants • Cafes • Shops</span>}>
            <NearbyBeta coords={coords}/>
          </Section>
        </main>
      )}

      {activeTab==="planner" && (
        <main className="max-w-6xl mx-auto px-4 py-6 md:py-8 grid grid-cols-1 gap-6">
          <Section title="Planner" icon={<CalendarIcon className="w-5 h-5 text-emerald-600"/>} right={<span className="text-sm text-gray-500">Calendar & Mood</span>}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <MiniCalendar notes={notes} onSelect={(d)=>{ const key=d.toISOString().slice(0,10); const text=prompt(`Note for ${key}`, notes[key]||""); if(text!=null) setNotes({...notes,[key]:text}); }}/>
              </div>
              <div><MoodCard/></div>
            </div>
          </Section>
        </main>
      )}

      <footer className="text-center text-sm text-gray-500 my-6 flex items-center justify-center gap-2">
        <img src="/icon.png" alt="logo" className="w-5 h-5 rounded-md ring-1 ring-black/5" />
        <span>Built for you by WhereWeatherUGo — responsive, interactive, and fun. Data via Open‑Meteo, Wikipedia & OpenStreetMap.</span>
      </footer>
      {loading && <LoadingSplash/>}
      <SettingsModal open={settingsOpen} onClose={()=>setSettingsOpen(false)} unit={unit} setUnit={setUnit}/>
    </div>
  );
}

// --- Dev self-tests ---
if (typeof window !== "undefined" && !window.__WWU_TESTS__) {
  window.__WWU_TESTS__ = true;
  try {
    console.assert(
      Math.round(kmDistance({ lat: 0, lon: 0 }, { lat: 0, lon: 0 })) === 0,
      "kmDistance same point"
    );
    console.assert(
      WEATHER_CODE[0].label === "Clear sky",
      "WEATHER_CODE[0] mapping"
    );
    const cj = ["a", "b"].join("\\n");
    console.assert(cj === "a\nb", "join newline ok");
  } catch (e) {
    console.warn("Self-tests failed:", e);
  }
}
