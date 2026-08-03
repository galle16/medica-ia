import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `Eres MédicaIA, un asistente médico de inteligencia artificial diseñado exclusivamente para clínicas privadas de primer nivel. Tu función es asistir tanto a pacientes como a personal médico.

Para PACIENTES puedes:
- Evaluar síntomas y orientar sobre posibles causas (sin reemplazar diagnóstico médico)
- Informar sobre preparación para exámenes y procedimientos
- Resolver dudas sobre medicamentos (interacciones, dosis generales, efectos secundarios)
- Orientar sobre especialistas según síntomas
- Dar consejos de salud preventiva
- Explicar resultados de laboratorio en términos simples

Para MÉDICOS Y PERSONAL puedes:
- Asistir en protocolos clínicos
- Sugerir diagnósticos diferenciales
- Revisar guías de tratamiento actualizadas
- Calcular dosis de medicamentos
- Asistir en interpretación de resultados

IMPORTANTE:
- Siempre recomienda consultar con un médico para diagnósticos definitivos
- En emergencias, indica llamar al servicio de urgencias
- Mantén un tono profesional, empático y accesible
- Responde siempre en español`;

const QUICK_QUESTIONS = [
  { icon: "🩺", text: "Evaluar mis síntomas" },
  { icon: "💊", text: "Información sobre medicamentos" },
  { icon: "🔬", text: "Interpretar mis resultados" },
  { icon: "👨‍⚕️", text: "¿Qué especialista necesito?" },
  { icon: "🧪", text: "Preparación para exámenes" },
  { icon: "❤️", text: "Consejos de salud preventiva" },
];

const SPECIALTIES = ["Cardiología", "Dermatología", "Neurología", "Pediatría", "Ginecología", "Traumatología"];

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: "5px", padding: "4px 0" }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#4CAF9C", animation: "bounce 1.2s infinite", animationDelay: `${i * 0.2}s` }} />
      ))}
    </div>
  );
}

function formatMessage(text) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("**") && line.endsWith("**")) return <div key={i} style={{ fontWeight: 700, color: "#1a3a2e", marginTop: 8 }}>{line.replace(/\*\*/g, "")}</div>;
    if (line.startsWith("- ") || line.startsWith("• ")) return <div key={i} style={{ paddingLeft: 16, marginTop: 4 }}>• {line.slice(2)}</div>;
    if (line.trim() === "") return <div key={i} style={{ height: 6 }} />;
    return <div key={i}>{line}</div>;
  });
}

export default function ClinicaIA() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("patient");
  const [started, setStarted] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput("");
    setStarted(true);
    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const modeContext = mode === "doctor" ? "\n[MODO: Personal médico]" : "\n[MODO: Paciente]";
      const callAPI = async (retries = 2) => {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ system: SYSTEM_PROMPT + modeContext, messages: newMessages }),
        });
        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          if (res.status === 529 && retries > 0) { await new Promise(r => setTimeout(r, 1500)); return callAPI(retries - 1); }
          throw new Error(e?.error?.message || `HTTP ${res.status}`);
        }
        return res.json();
      };
      const data = await callAPI();
      setMessages([...newMessages, { role: "assistant", content: data.content?.[0]?.text || "No pude procesar tu consulta." }]);
    } catch (err) {
      console.error("MédicaIA API error:", err);
      const msg = err.message?.includes("529") ? "Servicio saturado, reintentando... 🔄" : `Error de conexión. Intenta nuevamente ⚠️ (${err.message})`;
      setMessages([...newMessages, { role: "assistant", content: msg }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f0f5f2", fontFamily: "Georgia, serif", display: "flex", flexDirection: "column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Source+Sans+3:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-8px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .qbtn:hover{background:#1a6b52!important;color:#fff!important;}
        .mbtn-active{background:#1a6b52!important;color:#fff!important}
        textarea:focus{outline:none}
        ::-webkit-scrollbar{width:6px} ::-webkit-scrollbar-thumb{background:#b2cfc5;border-radius:3px}
      `}</style>
      <header style={{ background: "#fff", borderBottom: "1px solid #dce9e3", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 12px rgba(26,107,82,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#1a6b52,#4CAF9C)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏥</div>
          <div>
            <div style={{ fontFamily: "Playfair Display,serif", fontWeight: 700, fontSize: 18, color: "#1a3a2e" }}>MédicaIA</div>
            <div style={{ fontSize: 11, color: "#6b9e8e", textTransform: "uppercase", letterSpacing: "0.5px" }}>Asistente Clínico IA</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", background: "#f0f5f2", borderRadius: 20, padding: 3 }}>
            {[["patient","🤒 Paciente"],["doctor","👨‍⚕️ Médico"]].map(([m,label]) => (
              <button key={m} className={mode===m?"mbtn-active":""} onClick={() => setMode(m)} style={{ padding: "5px 14px", borderRadius: 16, border: "none", background: "transparent", cursor: "pointer", fontSize: 12, fontWeight: 500, color: mode===m?"#fff":"#4a7a68", transition: "all 0.2s" }}>{label}</button>
            ))}
          </div>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4CAF9C", animation: "pulse-dot 2s infinite" }} />
          <span style={{ fontSize: 12, color: "#4a7a68" }}>En línea</span>
        </div>
      </header>
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <aside style={{ width: 260, background: "#fff", borderRight: "1px solid #dce9e3", padding: "24px 16px", display: "flex", flexDirection: "column", gap: 24, overflowY: "auto" }}>
          <button onClick={() => { setMessages([]); setStarted(false); }} style={{ width: "100%", padding: "10px 0", background: "#f0f5f2", border: "1px solid #c5ddd5", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#1a6b52" }}>+ Nueva consulta</button>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ab8ae", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 10 }}>Consultas rápidas</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {QUICK_QUESTIONS.map(q => <button key={q.text} className="qbtn" onClick={() => sendMessage(q.text)} style={{ padding: "9px 12px", border: "none", background: "#f6faf8", borderRadius: 8, cursor: "pointer", textAlign: "left", fontSize: 12.5, color: "#2d5a47", transition: "all 0.2s", display: "flex", gap: 8, alignItems: "center" }}><span>{q.icon}</span>{q.text}</button>)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ab8ae", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 10 }}>Especialidades</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {SPECIALTIES.map(s => <button key={s} onClick={() => sendMessage(`¿Cuándo necesito ver a un especialista en ${s}?`)} style={{ padding: "4px 10px", border: "1px solid #c5ddd5", background: "#f0f5f2", borderRadius: 20, cursor: "pointer", fontSize: 11.5, color: "#2d5a47" }}>{s}</button>)}
            </div>
          </div>
          <div style={{ marginTop: "auto", padding: 14, background: "#f6faf8", borderRadius: 10, border: "1px solid #dce9e3" }}>
            <div style={{ fontSize: 11, color: "#6b9e8e", lineHeight: 1.5 }}>⚠️ No reemplaza consulta médica. Emergencias: <strong>112</strong></div>
          </div>
        </aside>
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
            {!started && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 20, paddingTop: 40, animation: "fadeUp 0.5s ease" }}>
                <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg,#1a6b52,#4CAF9C)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, boxShadow: "0 8px 30px rgba(26,107,82,0.2)" }}>🏥</div>
                <div style={{ textAlign: "center" }}>
                  <h1 style={{ fontFamily: "Playfair Display,serif", fontSize: 28, fontWeight: 700, color: "#1a3a2e", marginBottom: 8 }}>Bienvenido a MédicaIA</h1>
                  <p style={{ fontSize: 15, color: "#5a8a7a", maxWidth: 380, lineHeight: 1.6 }}>Asistente de inteligencia artificial para clínicas privadas.</p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, maxWidth: 480, width: "100%" }}>
                  {QUICK_QUESTIONS.map(q => <button key={q.text} className="qbtn" onClick={() => sendMessage(q.text)} style={{ padding: "12px 14px", border: "1px solid #c5ddd5", background: "#fff", borderRadius: 10, cursor: "pointer", textAlign: "left", fontSize: 13, color: "#2d5a47", transition: "all 0.2s", display: "flex", gap: 8, alignItems: "center" }}><span style={{ fontSize: 18 }}>{q.icon}</span><span>{q.text}</span></button>)}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role==="user"?"flex-end":"flex-start", animation: "fadeUp 0.3s ease" }}>
                {msg.role==="assistant" && <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#1a6b52,#4CAF9C)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, marginRight: 10, flexShrink: 0, alignSelf: "flex-end" }}>🏥</div>}
                <div style={{ maxWidth: "72%", padding: "12px 16px", borderRadius: msg.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px", background: msg.role==="user"?"linear-gradient(135deg,#1a6b52,#2d8f6f)":"#fff", color: msg.role==="user"?"#fff":"#1a3a2e", fontSize: 14, lineHeight: 1.6, boxShadow: msg.role==="user"?"0 3px 12px rgba(26,107,82,0.25)":"0 2px 10px rgba(0,0,0,0.07)" }}>
                  {msg.role==="assistant"?formatMessage(msg.content):msg.content}
                </div>
              </div>
            ))}
            {loading && <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}><div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#1a6b52,#4CAF9C)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🏥</div><div style={{ background: "#fff", borderRadius: "18px 18px 18px 4px", padding: "12px 18px", boxShadow: "0 2px 10px rgba(0,0,0,0.07)" }}><TypingDots /></div></div>}
            <div ref={bottomRef} />
          </div>
          <div style={{ padding: "16px 20px", background: "#fff", borderTop: "1px solid #dce9e3" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end", background: "#f6faf8", borderRadius: 16, padding: "10px 14px", border: "1.5px solid #c5ddd5" }}>
              <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage()} }} placeholder={mode==="doctor"?"Consulta clínica, diagnóstico diferencial...":"Describe tus síntomas o escribe tu consulta..."} style={{ flex: 1, background: "transparent", border: "none", resize: "none", fontSize: 14, color: "#1a3a2e", lineHeight: 1.5, maxHeight: 120, minHeight: 20 }} rows={1} onInput={e=>{e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,120)+"px"}} />
              <button onClick={() => sendMessage()} disabled={!input.trim()||loading} style={{ width: 40, height: 40, borderRadius: "50%", background: input.trim()&&!loading?"#1a6b52":"#c5ddd5", border: "none", cursor: input.trim()&&!loading?"pointer":"default", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, transition: "all 0.2s", flexShrink: 0 }}>➤</button>
            </div>
            <div style={{ textAlign: "center", fontSize: 11, color: "#9ab8ae", marginTop: 8 }}>MédicaIA · Para clínicas privadas · No reemplaza consulta médica</div>
          </div>
        </main>
      </div>
    </div>
  );
}