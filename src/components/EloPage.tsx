
import { useState, useEffect, useMemo } from "react";
import { supabase } from '../lib/supabase';
import { useGame } from '../context/useGame';
import { ArrowLeft, ChevronRight, TrendingUp, TrendingDown, Minus , UserPlus,BarChart3,LogOut,History} from "lucide-react";

// ─── TYPES ───────────────────────────────────────────────────────────────────
type GameModeKey = "coinche4P"|"coinche3P"|"coinche2P"|"belote4P"|"belote3P"|"belote2P";
interface EloMap { coinche4P:number; coinche3P:number; coinche2P:number; belote4P:number; belote3P:number; belote2P:number; }
interface PlayerRow { id:string; username:string; profile_picture?:string; elo:EloMap; stats:any; }
interface EloHistoryRow { id:string; elo_before:number; elo_after:number; delta:number; k_factor:number; multiplier:number; events:string[]; won:boolean; created_at:string; game_mode:string; }

// ─── LIGUES ──────────────────────────────────────────────────────────────────
const LEAGUES = [
  { name:"Bronze",  min:0,    max:1099, color:"#a87030", dark:"#7A4A1E",light:"#fcbb83",  symbol:"♣" },
  { name:"Argent",  min:1100, max:1299, color:"#B0BEC5", dark:"#546E7A",light:"#e5f5fa", symbol:"♠" },
  { name:"Or",      min:1300, max:1499, color:"#F0C040", dark:"#8B6914",light:"#f2fd8b", symbol:"♦" },
{
  name: "Emeraude",
  min: 1500,
  max: 1699,
  color: "#069464",
  bg: "#06281F",
  light: "#9affda",
  symbol: "♥",
  gradient: "linear-gradient(135deg,#047857,#10B981)"
},   { name:"Diamant", min:1700, max:1899, color:"#7db5e4", dark:"#1565C0",light:"#c0e2f5", symbol:"★" },
  { name:"Légende", min:1900, max:2099, color:"#F48FB1", dark:"#AD1457",light:"#fad8ed", symbol:"♛" },
  {
  name:"Master",
  min:2100,
  max:2299,
  color:"#9C27B0",
  dark:"#4A148C",
  light:"#E1BEE7",
  symbol:"✦"
},
{
  name:"Grand Master",
  min:2300,
  max:9999,
  color:"#b11616",
  dark:"#7F0000",
  light:"#f8a2ab",
  symbol:"♜"
},
];
function getLeague(elo:number){ return LEAGUES.find(l=>elo>=l.min&&elo<=l.max)??LEAGUES[0]; }
function getTierInfo(elo:number){
  const league=getLeague(elo);
  if(league.name==="Grand Master") return {league,tierLabel:"",pct:Math.min(100,((elo-league.min)/200)*100)};
  if(league.name==="Bronze"){league.min=900}
  const tierSize=(league.max-league.min+1)/4;
  const tierIdx=Math.min(3,Math.floor((elo-league.min)/tierSize));
  const tierLabel=["IV","III","II","I"][tierIdx];
  const floorInTier=league.min+tierIdx*tierSize;
  const pct=Math.min(99,((elo-floorInTier)/tierSize)*100);
  if (elo<900){return {league,tierLabel:"V",pct:Math.min(100,(elo/9000)*100)}}
  return {league,tierLabel,pct};
}
const MODE_LABELS:Record<GameModeKey,string>={coinche4P:"Coinche 4J",coinche3P:"Coinche 3J",coinche2P:"Coinche 2J",belote4P:"Belote 4J",belote3P:"Belote 3J",belote2P:"Belote 2J"};
const MODE_KEYS:GameModeKey[]=["coinche4P","belote4P","coinche3P","belote3P","coinche2P","belote2P"];

// ─── COURBE ÉLO ──────────────────────────────────────────────────────────────
function EloCurve({data,color,width=300,height=90,showLabels=false}:{data:{date:string;elo:number}[];color:string;width?:number;height?:number;showLabels?:boolean}){
  if(data.length<2) return(
    <div style={{width,height,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <span style={{fontSize:12,color:"#64748B"}}>Pas encore assez de parties</span>
    </div>
  );
  const elos=data.map(d=>d.elo);
  const minE=Math.min(...elos)-10, maxE=Math.max(...elos)+10, range=maxE-minE||1;
  const pl=showLabels?34:8, pr=8, pt=10, pb=showLabels?22:8;
  const W=width-pl-pr, H=height-pt-pb;
  const px=(i:number)=>pl+(i/(data.length-1))*W;
  const py=(e:number)=>pt+H-(((e-minE)/range)*H);
  const coords=data.map((d,i)=>({x:px(i),y:py(d.elo)}));
  function makePath(pts:{x:number;y:number}[]){
    let d=`M ${pts[0].x} ${pts[0].y}`;
    for(let i=0;i<pts.length-1;i++){
      const p0=pts[Math.max(0,i-1)],p1=pts[i],p2=pts[i+1],p3=pts[Math.min(pts.length-1,i+2)];
      d+=` C ${p1.x+(p2.x-p0.x)/6} ${p1.y+(p2.y-p0.y)/6},${p2.x-(p3.x-p1.x)/6} ${p2.y-(p3.y-p1.y)/6},${p2.x} ${p2.y}`;
    }
    return d;
  }
  const path=makePath(coords);
  const area=path+` L ${px(data.length-1)} ${pt+H} L ${pl} ${pt+H} Z`;
  const up=elos[elos.length-1]>=elos[0];
  const lc=up?"#34D399":"#F87171";
  const gid=`g${Math.random().toString(36).slice(2,6)}`;
  return(
    <svg width={width} height={height} style={{overflow:"visible",display:"block"}}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lc} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={lc} stopOpacity="0.02"/>
        </linearGradient>
      </defs>
      {showLabels&&[0,0.5,1].map((t,i)=>{
        const yy=pt+H*t, val=Math.round(maxE-t*(maxE-minE));
        return <g key={i}><line x1={pl} y1={yy} x2={pl+W} y2={yy} stroke="#334155" strokeWidth="0.5" strokeDasharray="3,3"/><text x={pl-5} y={yy+3.5} fontSize="9" fill="#64748B" textAnchor="end">{val}</text></g>;
      })}
      {showLabels&&[0,data.length-1].map(i=>(
        <text key={i} x={px(i)} y={pt+H+15} fontSize="9" fill="#64748B" textAnchor="middle">{data[i].date}</text>
      ))}
      <path d={area} fill={`url(#${gid})`}/>
      <path d={path} fill="none" stroke={lc} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {coords.map((p,i)=>i===coords.length-1&&(
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="8" fill={lc} fillOpacity="0.15"/>
          <circle cx={p.x} cy={p.y} r="3.5" fill={lc} stroke="white" strokeWidth="1.5"/>
        </g>
      ))}
    </svg>
  );
}

// ─── MINI SPARK ──────────────────────────────────────────────────────────────
function MiniSpark({data}:{data:number[]}){
  if(data.length<2) return <div style={{width:48,height:18}}/>;
  const min=Math.min(...data)-1,max=Math.max(...data)+1,range=max-min||1;
  const pts=data.map((v,i)=>`${(i/(data.length-1))*48},${18-((v-min)/range)*18}`).join(" ");
  const up=data[data.length-1]>=data[0];
  return(
    <svg width={48} height={18} style={{flexShrink:0}}>
      <polyline points={pts} fill="none" stroke={up?"#34D399":"#F87171"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ─── AVATAR ──────────────────────────────────────────────────────────────────
function Avatar({name,pic,size=44,elo}:{name:string;pic?:string;size?:number;elo:number}){
  const {league}=getTierInfo(elo);
  return(
    <div style={{width:size,height:size,borderRadius:"50%",flexShrink:0,position:"relative"}}>
      <div style={{
        width:size,height:size,borderRadius:"50%",overflow:"hidden",
        background:league.bg,border:`2px solid ${league.color}`,
        display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:size*0.35,fontWeight:700,color:league.color,
      }}>
        {pic?<img src={pic} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:name.slice(0,2).toUpperCase()}
      </div>
    </div>
  );
}

// ─── LEAGUE PILL ─────────────────────────────────────────────────────────────
function LeaguePill({elo,small}:{elo:number;small?:boolean}){
  const {league,tierLabel}=getTierInfo(elo);
  return(
    <span style={{
      display:"inline-flex",alignItems:"center",gap:4,
      padding:small?"3px 8px":"4px 10px",
      borderRadius:100,
      background:league.bg,
      border:`1px solid ${league.color}55`,
      fontSize:small?10:11,fontWeight:600,color:league.color,
      whiteSpace:"nowrap",
    }}>
      <span>{league.symbol}</span>
      {league.name}{tierLabel?` ${tierLabel}`:""}
    </span>
  );
}

// ─── TIER BAR ────────────────────────────────────────────────────────────────
function TierBar({elo,thick=4}:{elo:number;thick?:number}){
  const {league,pct}=getTierInfo(elo);
  return(
    <div style={{height:thick,background:"#1E293B",borderRadius:thick,overflow:"hidden"}}>
      <div style={{height:"100%",width:`${pct}%`,background:league.gradient,borderRadius:thick,transition:"width 0.6s ease"}}/>
    </div>
  );
}

// ─── HISTORY MODAL ───────────────────────────────────────────────────────────
function HistoryModal({userId,mode,username,onClose}:{userId:string;mode:GameModeKey;username:string;onClose:()=>void}){
  const [rows,setRows]=useState<EloHistoryRow[]>([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    supabase.from("elo_history").select("*").eq("user_id",userId).eq("game_mode",mode)
      .order("created_at",{ascending:false}).limit(25)
      .then(({data})=>{setRows((data??[]).reverse());setLoading(false);});
  },[userId,mode]);
  const curve=rows.map(r=>({date:new Date(r.created_at).toLocaleDateString("fr-FR",{day:"2-digit",month:"short"}),elo:r.elo_after}));
  const trend=curve.length>=2?curve[curve.length-1].elo-curve[0].elo:0;
  const lastElo=rows[rows.length-1]?.elo_after??1000;
  const {league}=getTierInfo(lastElo);
  return(
    <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(2,6,23,0.92)",display:"flex",flexDirection:"column"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        position:"absolute",bottom:0,left:0,right:0,
        background:"#0F172A",borderRadius:"20px 20px 0 0",
        maxHeight:"75vh",overflow:"hidden",display:"flex",flexDirection:"column",
      }}>
        {/* Handle */}
        <div style={{padding:"12px 0 0",display:"flex",justifyContent:"center"}}>
          <div style={{width:36,height:4,borderRadius:2,background:"#334155"}}/>
        </div>
        {/* Header */}
        <div style={{padding:"12px 20px 16px",borderBottom:"1px solid #1E293B",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:17,fontWeight:700,color:"#F1F5F9"}}>{username}</div>
            <div style={{fontSize:12,color:"#64748B",marginTop:2}}>{MODE_LABELS[mode]}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:22,fontWeight:800,color:league.color}}>{lastElo}</div>
            {trend!==0&&(
              <div style={{fontSize:12,fontWeight:600,color:trend>0?"#34D399":"#F87171"}}>
                {trend>0?"+":""}{trend} pts
              </div>
            )}
          </div>
        </div>
        {/* Courbe */}
        <div style={{padding:"16px 16px 8px",background:"#080F1F"}}>
          {loading?(
            <div style={{height:100,display:"flex",alignItems:"center",justifyContent:"center",color:"#475569"}}>Chargement…</div>
          ):curve.length>=2?(
            <EloCurve data={curve} color={league.color} width={Math.min(460, window.innerWidth-32)} height={110} showLabels={true}/>
          ):(
            <div style={{height:80,display:"flex",alignItems:"center",justifyContent:"center",color:"#475569",fontSize:13}}>Pas encore assez de parties</div>
          )}
        </div>
        {/* Liste parties */}
        <div style={{overflowY:"auto",flex:1,padding:"0 16px 32px"}}>
          <div style={{fontSize:11,fontWeight:600,color:"#475569",letterSpacing:1,textTransform:"uppercase",padding:"12px 0 8px"}}>Dernières parties</div>
          {[...rows].reverse().slice(0,20).map(r=>(
            <div key={r.id} style={{
              display:"flex",alignItems:"center",gap:12,padding:"10px 12px",
              borderRadius:12,marginBottom:6,
              background:r.won?"#052E16":"#2D0A0A",
              border:`1px solid ${r.won?"#166534":"#7F1D1D"}`,
            }}>
              <div style={{
                width:32,height:32,borderRadius:8,flexShrink:0,
                background:r.won?"#14532D":"#450A0A",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:14,
              }}>{r.won?"🏆":"💔"}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,color:r.won?"#86EFAC":"#FCA5A5",fontWeight:500,marginBottom:2}}>
                  {new Date(r.created_at).toLocaleDateString("fr-FR",{day:"2-digit",month:"short"})} · ×{r.multiplier}
                </div>
                <div style={{fontSize:11,color:"#475569",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {r.events?.join(" · ")||"—"}
                </div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:15,fontWeight:700,color:r.delta>=0?"#34D399":"#F87171",fontFamily:"monospace"}}>
                  {r.delta>=0?"+":""}{r.delta}
                </div>
                <div style={{fontSize:10,color:"#475569",fontFamily:"monospace"}}>{r.elo_after}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PROFILE SHEET ───────────────────────────────────────────────────────────
function ProfileSheet({
  player,
  mode,
  onClose,
}: {
  player: PlayerRow;
  mode: GameModeKey;
  onClose: () => void;
}) {
  const [showHistory, setShowHistory] = useState(false);

  const elo = player.elo?.[mode] ?? 1000;

  const { league, pct } = getTierInfo(elo);

  const stats = player.stats?.[mode] ?? {};

  const games = stats.games ?? 0;

  const placementGames = games < 4;

  const kf =
    games < 30
      ? 40
      : games < 100
      ? 25
      : 15;

  if (showHistory)
    return (
      <HistoryModal
        userId={player.id}
        mode={mode}
        username={player.username}
        onClose={() => setShowHistory(false)}
      />
    );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(2,6,23,0.85)",
        display: "flex",
        alignItems: "flex-end",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          background: "#0F172A",
          borderRadius: "20px 20px 0 0",
          maxHeight: "85vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "12px 0 0",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              background: "#334155",
            }}
          />
        </div>

        {/* Bande ligue */}
        <div
          style={{
            height: 3,
            margin: "12px 0 0",
            background: league.gradient,
          }}
        />

        <div
          style={{
            padding: "16px 20px 24px",
            overflowY: "auto",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 20,
              opacity: placementGames ? 0.88 : 1,
            }}
          >
            <Avatar
              name={player.username}
              pic={player.profile_picture}
              size={56}
              elo={elo}
            />

            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#F1F5F9",
                  marginBottom: 6,
                }}
              >
                {player.username}
              </div>

              {!placementGames ? (
                <LeaguePill elo={elo} />
              ) : (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "5px 10px",
                    borderRadius: 999,
                    background: "#1E293B",
                    border: "1px solid #334155",
                    color: "#CBD5E1",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {games}/4 parties de classement
                </div>
              )}
            </div>

            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: 30,
                  fontWeight: 800,
                  color: league.color,
                  lineHeight: 1,

                  filter: placementGames
                    ? "blur(6px)"
                    : "none",

                  userSelect: "none",
                }}
              >
                {elo}
              </div>

              <div
                style={{
                  fontSize: 10,
                  color: "#64748B",
                  marginTop: 3,
                  letterSpacing: 1,
                }}
              >
                ÉLO
              </div>
            </div>
          </div>

          {/* Barre */}
          {!placementGames && (
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 11,
                  color: "#64748B",
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    color: league.color,
                    fontWeight: 600,
                  }}
                >
                  Progression palier
                </span>

                <span>{Math.floor(pct)}/100</span>
              </div>

              <TierBar elo={elo} thick={6} />
            </div>
          )}

          {/* Stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 8,
              marginBottom: 20,
            }}
          >
            {[
              {
                label: "Parties",
                val: games,
                icon: "🎴",
              },
              {
                label: "Victoires",
                val: `${Math.round(
                  stats.winRate ?? 0
                )}%`,
                icon: "🏆",
              },
              {
                label: "Coinche",
                val:
                  stats.coinches > 0
                    ? `${Math.round(
                        (stats.successfulCoinches /
                          stats.coinches) *
                          100
                      )}%`
                    : "—",
                icon: "⚡",
              },
              {
                label: "Capots",
                val: stats.capots ?? 0,
                icon: "💀",
              },
              {
                label: "K-factor",
                val: kf,
                icon: "⚙️",
              },
              {
                label: "Contrats",
                val:
                  stats.successfulContracts ??
                  0,
                icon: "✅",
              },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  background: "#1E293B",
                  borderRadius: 12,
                  padding: "12px 8px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 18,
                    marginBottom: 4,
                  }}
                >
                  {s.icon}
                </div>

                <div
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: "#F1F5F9",
                  }}
                >
                  {s.val}
                </div>

                <div
                  style={{
                    fontSize: 10,
                    color: "#64748B",
                    marginTop: 2,
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Boutons */}
          <div
            style={{
              display: "flex",
              gap: 10,
            }}
          >
            <button
              disabled={placementGames}
              onClick={() => {
                if (!placementGames) {
                  setShowHistory(true);
                }
              }}
              style={{
                flex: 1,
                padding: "14px",
                borderRadius: 14,

                background: placementGames
                  ? "#1E293B"
                  : league.gradient,

                border: "none",

                color: placementGames
                  ? "#64748B"
                  : "white",

                fontSize: 15,
                fontWeight: 600,

                cursor: placementGames
                  ? "not-allowed"
                  : "pointer",

                opacity: placementGames
                  ? 0.6
                  : 1,
              }}
            >
              {placementGames
                ? `${games}/4 parties de classement`
                : "Voir la courbe Élo"}
            </button>

            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: "14px",
                borderRadius: 14,
                background: "#1E293B",
                border: "none",
                color: "#94A3B8",
                fontSize: 15,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
// ─── HERO CARD ────────────────────────────────────────────────────────────────
function HeroCard({
  userId,
  mode,
  onViewHistory
}:{
  userId:string;
  mode:GameModeKey;
  onViewHistory:(p:PlayerRow)=>void
}){

  const [player,setPlayer]=useState<PlayerRow|null>(null);
  const [curve,setCurve]=useState<{date:string;elo:number}[]>([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    if(!userId)return;

    Promise.all([
      supabase
        .from("users")
        .select("id,username:display_name,profile_picture,elo,stats")
        .eq("id",userId)
        .single(),

      supabase
        .from("elo_history")
        .select("elo_after,created_at")
        .eq("user_id",userId)
        .eq("game_mode",mode)
        .order("created_at",{ascending:false})
        .limit(25),

    ]).then(([{data:u},{data:h}])=>{

      if(u) setPlayer(u as any);

      if(h){
        setCurve(
          h.reverse().map((r:any)=>({
            date:new Date(r.created_at).toLocaleDateString(
              "fr-FR",
              {day:"2-digit",month:"short"}
            ),
            elo:r.elo_after
          }))
        );
      }

      setLoading(false);
    });

  },[userId,mode]);

  if(loading){
    return(
      <div style={{
        background:"#0F172A",
        borderRadius:20,
        padding:20,
        marginBottom:16,
        display:"flex",
        alignItems:"center",
        justifyContent:"center",
        height:100
      }}>
        <div style={{color:"#475569",fontSize:13}}>
          Chargement…
        </div>
      </div>
    );
  }

  if(!player) return null;

  const elo = player.elo?.[mode] ?? 1000;

  const {league,pct} = getTierInfo(elo);

  const stats = player.stats?.[mode] ?? {};

  const gamesPlayed = stats.games ?? 0;

  const placementGames = gamesPlayed < 4;

  const trend =
    curve.length >= 2
      ? curve[curve.length-1].elo - curve[0].elo
      : 0;

  return(
    <div
      style={{
        position:"relative",
        background:`linear-gradient(135deg,${league.bg} 0%,#0F172A 100%)`,
        border:`1.5px solid ${league.color}44`,
        borderRadius:20,
        marginBottom:16,
        overflow:"hidden",
        boxShadow:`0 4px 24px ${league.color}18`,
      }}
    >

      {/* FLOUTAGE PLACEMENT */}
      <div
        style={{
          filter: placementGames ? "blur(5px)" : "none",
          opacity: placementGames ? 0.55 : 1,
          transition:"all .25s ease",
          pointerEvents: placementGames ? "none" : "auto",
        }}
      >

        <div style={{height:3,background:league.gradient}}/>

        <div style={{padding:"16px 16px 12px"}}>

          <div style={{
            fontSize:10,
            fontWeight:600,
            color:"#64748B",
            letterSpacing:1.5,
            textTransform:"uppercase",
            marginBottom:10
          }}>
            Ma position · {MODE_LABELS[mode]}
          </div>

          <div style={{
            display:"flex",
            alignItems:"center",
            gap:12,
            marginBottom:14
          }}>

            <Avatar
              name={player.username}
              pic={player.profile_picture}
              size={50}
              elo={elo}
            />

            <div style={{flex:1,minWidth:0}}>
              <div style={{
                fontSize:18,
                fontWeight:700,
                color:"#F1F5F9",
                marginBottom:5,
                overflow:"hidden",
                textOverflow:"ellipsis",
                whiteSpace:"nowrap"
              }}>
                {player.username}
              </div>

              <LeaguePill elo={elo}/>
            </div>

            <div style={{textAlign:"right"}}>

              <div style={{
                fontSize:32,
                fontWeight:800,
                color:league.color,
                lineHeight:1
              }}>
                {elo}
              </div>

              {trend!==0&&(
                <div style={{
                  display:"flex",
                  alignItems:"center",
                  justifyContent:"flex-end",
                  gap:3,
                  marginTop:2
                }}>

                  {trend>0
                    ? <TrendingUp size={11} color="#34D399"/>
                    : <TrendingDown size={11} color="#F87171"/>
                  }

                  <span style={{
                    fontSize:11,
                    fontWeight:600,
                    color:trend>0
                      ? "#34D399"
                      : "#F87171"
                  }}>
                    {trend>0?"+":""}
                    {trend}
                  </span>

                </div>
              )}

            </div>
          </div>

          <TierBar elo={elo} thick={5}/>

          <div style={{
            display:"flex",
            justifyContent:"space-between",
            fontSize:10,
            color:"#64748B",
            marginTop:4,
            marginBottom:curve.length>=2?12:0
          }}>
            <span style={{
              color:league.color,
              fontWeight:600
            }}>
              Palier {getTierInfo(elo).tierLabel}
            </span>

            <span>
              {Math.floor(pct)}/100
            </span>
          </div>

          {curve.length>=2&&(
            <div style={{
              background:"#0A111F",
              borderRadius:12,
              padding:"10px 8px 6px",
              marginBottom:12
            }}>
              <EloCurve
                data={curve}
                color={league.color}
                width={Math.min(580,window.innerWidth-64)}
                height={70}
              />
            </div>
          )}

          <div style={{
            display:"grid",
            gridTemplateColumns:"repeat(4,1fr)",
            gap:6
          }}>

            {[
              {l:"Win%",v:`${Math.round(stats.winRate??0)}%`},
              {l:"Parties",v:stats.games??0},
              {l:"Coinches",v:stats.coinches??0},
              {l:"Capots",v:stats.capots??0},
            ].map(s=>(
              <div
                key={s.l}
                style={{
                  background:"#0A111F",
                  borderRadius:10,
                  padding:"8px 4px",
                  textAlign:"center"
                }}
              >
                <div style={{
                  fontSize:14,
                  fontWeight:700,
                  color:league.color
                }}>
                  {s.v}
                </div>

                <div style={{
                  fontSize:9,
                  color:"#64748B",
                  marginTop:1,
                  fontWeight:500
                }}>
                  {s.l}
                </div>
              </div>
            ))}

          </div>
        </div>

        <button
          onClick={()=>onViewHistory(player)}
          style={{
            width:"100%",
            padding:"12px",
            background:"transparent",
            borderTop:`1px solid ${league.color}22`,
            color:league.color,
            fontSize:13,
            fontWeight:600,
            cursor:"pointer",
            display:"flex",
            alignItems:"center",
            justifyContent:"center",
            gap:6,
          }}
        >
          Voir mon historique Élo complet
          <ChevronRight size={14}/>
        </button>

      </div>

      {/* OVERLAY PARTIES DE CLASSEMENT */}
      {placementGames && (
        <div
          style={{
            position:"absolute",
            inset:0,
            display:"flex",
            alignItems:"center",
            justifyContent:"center",
            background:"rgba(2,6,23,0.35)",
            backdropFilter:"blur(1px)",
          }}
        >
          <div
            style={{
              background:"rgba(15,23,42,0.92)",
              border:`1px solid ${league.color}55`,
              borderRadius:14,
              padding:"12px 18px",
              textAlign:"center",
              boxShadow:`0 0 20px ${league.color}22`,
            }}
          >
            <div
              style={{
                fontSize:26,
                fontWeight:800,
                color:league.color,
                marginBottom:2,
              }}
            >
              {gamesPlayed}/4
            </div>

            <div
              style={{
                fontSize:11,
                color:"#CBD5E1",
                letterSpacing:1,
                textTransform:"uppercase",
              }}
            >
              Parties de classement
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
function Simulator({ onClose }: { onClose: () => void }) {
  const elo1 = getTierInfo(1075).league
  const elo2= getTierInfo(1275).league
  const elo3 = getTierInfo(1475).league
  const elo4 = getTierInfo(1675).league
  const elo5 = getTierInfo(1875).league
  const elo6 = getTierInfo(2075).league
  const elo7 = getTierInfo(2175).league
  const elo8 = getTierInfo(2375).league

  const REWARDS = {elo1,elo2,elo3,elo4,elo5,elo6,elo7,elo8}


  

  const leagueBgMap = {
    Bronze: "#2D1A0E",
    Argent: "#1A1F2E",
    Or: "#2D1F00",
    Platine: "#00252E",
    Diamant: "#1E1B4B",
    Légende: "#2D0A1E",
      Master:"#2A1038",
  "Grand Master":"#330202"
  };

  const leagues = Object.keys(REWARDS);

  return (
    <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(2,6,23,0.92)",display:"flex",flexDirection:"column"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        position:"absolute",bottom:0,left:0,right:0,
        background:"#0F172A",borderRadius:"20px 20px 0 0",
        maxHeight:"75vh",overflow:"hidden",display:"flex",flexDirection:"column",
      }}>
      <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-gray-900 p-6 shadow-2xl">

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white">
            Récompenses de saison
          </h1>
          <p className="text-sm text-gray-400">
            Aperçu complet des arrières plan de profil
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {leagues.map((elo) => {
            const league = REWARDS[elo];

            return (
              <div
  className="mb-6 rounded-2xl p-4 relative overflow-hidden flex flex-col min-h-[240px]"
  style={{
    background: league ? leagueBgMap[league.name] : "white",
    border: `1.5px solid ${league?.color ?? "#ccc"}55`,
  }}
>
      {/* Watermark */}
      <span
  style={{
    position: "absolute",
    right: 60,
    top: -8,
    fontSize: 72,
    color: `${league?.light ?? "#000"}35`,
    pointerEvents: "none",
    userSelect: "none",
  }}
>
  {league?.symbol ?? ""}
</span>
{/* Header */}
      {league && (
  <div className="flex items-center justify-between mb-3">
    <div>
      <p
        className="text-base font-semibold"
        style={{
          position: "absolute",
          left: 55,
          color: league.light ?? league.color,
        }}
      >
        S1 - {league.name.slice(0,4)} {league.tierLabel}
      </p>
    </div>
  </div>
)}
<div className="flex-1" />
<div className="flex flex-wrap gap-4 mt-auto">
                <div className="relative">
  <button disabled
onClick={(e) => e.preventDefault()}    className="flex items-center space-x-2 px-3 py-2  rounded-lg hover: transition-colors text-sm"
    style={{
    color: league?.light || "#043a10",
    backgroundColor: league?.color || "#69dd82"
  }}
  >
    <UserPlus className="w-4 h-4" />
    
  </button>

  {/* Pastille rouge avec le nombre de demandes */}
  
</div>


              <button disabled
onClick={(e) => e.preventDefault()}                className="flex items-center space-x-2 px-3 py-2  rounded-lg hover: transition-colors text-sm"
              style={{
    color: league?.light || "#42032d",
    backgroundColor: league?.color || "#fc9ddc"
  }}
              >
                <BarChart3 className="w-4 h-4" />
                
              </button>
              <button disabled
onClick={(e) => e.preventDefault()}      className="flex items-center space-x-2 px-3 py-2  rounded-lg hover: transition-colors text-sm"
    style={{
    color: league?.light || "#374151",
    backgroundColor: league?.color || "#b6d1d1"
  }}>
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">Historique</span>
              </button>
              {/* === BOUTON PRINCIPAL === */}
      <button disabled
onClick={(e) => e.preventDefault()}        className="flex items-center space-x-2 px-3 py-2  rounded-lg hover: transition-colors text-sm"
      style={{
    color: league?.light || "#3a0505",
    backgroundColor: league?.color || "#ff2121"
  }}>
        <LogOut className="w-4 h-4" />
        <span className="hidden sm:inline">Déconnexion</span>
      </button>
      <button disabled
onClick={(e) => e.preventDefault()}  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover: transition-colors text-sm"
style={{
    color: league?.light || "#ffffff",
    backgroundColor: league?.color || "#000000" 
  }}>
  <BarChart3 className="w-4 h-4 " style={{
    color: league?.light || "#fafafa",
  }} />

</button>
</div>


                

                {/* Flavor */}
                
              </div>
            );
          })}
        </div>

        {/* Close hint */}
        
        <p className="text-center text-xs text-gray-500 mt-6">
          Cliquez en dehors pour fermer
        </p>
      </div>
    </div>
    </div>
    
  );
}
// ─── PAGE PRINCIPALE ─────────────────────────────────────────────────────────
export default function EloPage(){
  const {gameState,goBack}=useGame();
  const [players,setPlayers]=useState<PlayerRow[]>([]);
  const [loading,setLoading]=useState(true);
  const [mode,setMode]=useState<GameModeKey>("coinche4P");
  const [selected,setSelected]=useState<PlayerRow|null>(null);
  const [showSim,setShowSim]=useState(false);
  const [search,setSearch]=useState("");
  const [currentUserId,setCurrentUserId]=useState<string|null>(null);

  useEffect(()=>{
    const uid=gameState?.currentUser?.id;
    if(uid){setCurrentUserId(uid);return;}
    supabase.auth.getUser().then(({data})=>setCurrentUserId(data.user?.id??null));
  },[gameState?.currentUser?.id]);

  useEffect(()=>{
    setLoading(true);
    supabase.from("users").select("id,username:display_name,profile_picture,elo,stats")
      .not("elo","is",null)
      .then(({data})=>{setPlayers((data??[]) as PlayerRow[]);setLoading(false);});
  },[]);

  const sorted = useMemo(() => {
  let l = players.filter((p) => {
    const stats = p.stats?.[mode] ?? {};
    const placementGames = (stats.games ?? 0) < 4;

    return p.elo?.[mode] && !placementGames;
  });

  if (search)
    l = l.filter((p) =>
      p.username?.toLowerCase().includes(search.toLowerCase())
    );

  return l.sort(
    (a, b) =>
      (b.elo?.[mode] ?? 1000) - (a.elo?.[mode] ?? 1000)
  );
}, [players, mode, search]);

  const myRank=useMemo(()=>{
    if(!currentUserId)return null;
    const i=sorted.findIndex(p=>p.id===currentUserId);
    return i>=0?i+1:null;
  },[sorted,currentUserId]);
 
  return(
    <div style={{minHeight:"100vh",background:"#020617",color:"#F1F5F9",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        input[type=range]{cursor:pointer;}
        ::-webkit-scrollbar{width:0;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .rin{animation:fadeUp 0.2s ease forwards;opacity:0;}
      `}</style>

      {/* ── NAVBAR ── */}
      <div style={{
        position:"sticky",top:40,zIndex:5,
        background:"rgba(2,6,23,0.9)",backdropFilter:"blur(12px)",
        borderBottom:"1px solid #1E293B",
        padding:"0 16px",
        display:"flex",alignItems:"center",gap:12,
        height:56,
      }}>
        <button onClick={goBack} style={{
          width:38,height:38,borderRadius:12,
          background:"#1E293B",border:"1px solid #334155",
          display:"flex",alignItems:"center",justifyContent:"center",
          cursor:"pointer",flexShrink:0,
        }}>
          <ArrowLeft size={18} color="#94A3B8"/>
        </button>
        <div style={{flex:1}}>
          <div style={{fontSize:17,fontWeight:700,color:"#F1F5F9",lineHeight:1.2}}>Classement Élo</div>
          {myRank&&<div style={{fontSize:11,color:"#64748B",marginTop:1}}>#{myRank} sur {sorted.length} joueurs</div>}
        </div>
        <div style={{fontSize:20}}></div>
      </div>

      <div style={{padding:"16px 14px 80px",maxWidth:640,margin:"0 auto", top: 20}}>

       {currentUserId && (
  <div style={{ marginTop: 30}}>
    <HeroCard
      userId={currentUserId}
      mode={mode}
      onViewHistory={p => {
        setSelected(p);
        setTimeout(() => {}, 50);
      }}
    />
  </div>
)}

        {/* ── MODE SELECTOR ── */}
        <div style={{display:"flex",gap:6,overflowX:"auto",marginBottom:16,paddingBottom:2}}>
          {MODE_KEYS.map(k=>{
            const active=mode===k;
            return(
              <button key={k} onClick={()=>setMode(k)} style={{
                padding:"7px 14px",borderRadius:100,fontSize:12,fontWeight:600,
                whiteSpace:"nowrap",cursor:"pointer",border:"1.5px solid",
                borderColor:active?"#3B82F6":"#1E293B",
                background:active?"#1D4ED8":"#0F172A",
                color:active?"#BFDBFE":"#64748B",
                transition:"all 0.15s",flexShrink:0,
              }}>{MODE_LABELS[k]}</button>
            );
          })}
        </div>

        {/* ── PODIUM ── */}
{!loading && sorted.length >= 2 && (
  <div
    style={{
      background: "#0F172A",
      borderRadius: 20,
      padding: "20px 12px 0",
      marginBottom: 16,
    }}
  >
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: "#64748B",
        letterSpacing: 1.5,
        textTransform: "uppercase",
        marginBottom: 16,
        textAlign: "center",
      }}
    >
      Top 3
    </div>

    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-end",
        gap: 8,
      }}
    >
      {[sorted[1], sorted[0], sorted[2]].map((p, i) => {
        if (!p)
          return (
            <div
              key={i}
              style={{ width: 90 }}
            />
          );

        const elo = p.elo?.[mode] ?? 1000;

        const { league } = getTierInfo(elo);

        const stats = p.stats?.[mode] ?? {};

        const placementGames =
          (stats.games ?? 0) < 4;

        const rank = [2, 1, 3][i];

        const h = [64, 88, 48][i];

        const medals = ["🥈", "🥇", "🥉"];

        return (
          <div
            key={p.id}
            onClick={() => setSelected(p)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              cursor: "pointer",
              width: 100,
              opacity: placementGames ? 0.82 : 1,
            }}
          >
            <div
              style={{
                fontSize: 24,
                marginBottom: 4,
              }}
            >
              {medals[i]}
            </div>

            <div
              style={{
                position: "relative",
              }}
            >
              <Avatar
                name={p.username}
                pic={p.profile_picture}
                size={rank === 1 ? 48 : 40}
                elo={elo}
              />

              {placementGames && (
                <div
                  style={{
                    position: "absolute",
                    inset: -2,
                    borderRadius: 999,
                    border: "2px solid #64748B",
                    pointerEvents: "none",
                  }}
                />
              )}
            </div>

            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#E2E8F0",
                marginTop: 5,
                textAlign: "center",
                maxWidth: 90,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {p.username}
            </div>

            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: league.color,

                filter: placementGames
                  ? "blur(5px)"
                  : "none",

                userSelect: "none",
              }}
            >
              {elo}
            </div>

            {placementGames && (
              <div
                style={{
                  marginTop: 2,
                  fontSize: 9,
                  fontWeight: 700,
                  color: "#CBD5E1",
                  background: "#1E293B",
                  border: "1px solid #334155",
                  padding: "2px 6px",
                  borderRadius: 999,
                }}
              >
                {stats.games ?? 0}/4
              </div>
            )}

            <div
              style={{
                marginTop: 8,
                width: "100%",
                height: h,

                background: placementGames
                  ? "linear-gradient(180deg,#47556922,transparent)"
                  : `linear-gradient(180deg,${league.color}20,transparent)`,

                borderTop: placementGames
                  ? "2px solid #47556955"
                  : `2px solid ${league.color}44`,

                borderRadius: "4px 4px 0 0",

                display: "flex",
                alignItems: "center",
                justifyContent: "center",

                fontSize: 22,
                opacity: 0.4,
              }}
            >
              {rank}
            </div>
          </div>
        );
      })}
    </div>
  </div>
)}

        {/* ── SEARCH ── */}
        <div style={{position:"relative",marginBottom:12}}>
          <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:16,color:"#475569"}}>🔍</span>
          <input type="text" placeholder="Rechercher un joueur…" value={search} onChange={e=>setSearch(e.target.value)}
            style={{
              width:"100%",padding:"12px 14px 12px 42px",
              background:"#0F172A",border:"1px solid #1E293B",borderRadius:14,
              color:"#F1F5F9",fontSize:15,outline:"none",
            }}/>
        </div>

        {/* ── CLASSEMENT ── */}
<div style={{ marginBottom: 16 }}>
  <div
    style={{
      fontSize: 11,
      fontWeight: 600,
      color: "#64748B",
      letterSpacing: 1.5,
      textTransform: "uppercase",
      marginBottom: 10,
    }}
  >
    Classement complet
  </div>

  {loading ? (
    <div
      style={{
        textAlign: "center",
        padding: 48,
        color: "#475569",
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 8 }}>🃏</div>
      Chargement…
    </div>
  ) : (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      {sorted.map((player, idx) => {
        const elo = player.elo?.[mode] ?? 1000;
        const { league } = getTierInfo(elo);

        const isMe = player.id === currentUserId;

        const stats = player.stats?.[mode] ?? {};

        const rank = idx + 1;

        const spark = [
          elo - 22,
          elo - 8,
          elo + 12,
          elo - 4,
          elo + 18,
          elo,
        ];

        const placementGames = (stats.games ?? 0) < 4;

        return (
          <div
            key={player.id}
            className="rin"
            style={{
              animationDelay: `${Math.min(idx * 20, 180)}ms`,
            }}
            onClick={() => setSelected(player)}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 14,
                cursor: "pointer",
                background: isMe
                  ? `${league.bg}`
                  : "#0F172A",

                border: `1.5px solid ${
                  isMe
                    ? league.color + "66"
                    : rank <= 3
                    ? league.color + "33"
                    : "#1E293B"
                }`,

                boxShadow: isMe
                  ? `0 0 0 1px ${league.color}22`
                  : "none",

                opacity: placementGames ? 0.85 : 1,
              }}
            >
              {/* Rang */}
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  flexShrink: 0,

                  background:
                    rank === 1
                      ? "linear-gradient(135deg,#F59E0B,#92400E)"
                      : rank === 2
                      ? "linear-gradient(135deg,#94A3B8,#475569)"
                      : rank === 3
                      ? "linear-gradient(135deg,#CD853F,#7C2D12)"
                      : "#1E293B",

                  border:
                    rank > 3
                      ? "1px solid #334155"
                      : "none",

                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",

                  fontSize: rank <= 3 ? 13 : 11,
                  fontWeight: 700,

                  color:
                    rank <= 3
                      ? "white"
                      : "#64748B",
                }}
              >
                {rank <= 3
                  ? ["🥇", "🥈", "🥉"][rank - 1]
                  : rank}
              </div>

              {/* Avatar */}
              <Avatar
                name={player.username}
                pic={player.profile_picture}
                size={36}
                elo={elo}
              />

              {/* Infos */}
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 5,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: isMe
                        ? "#F1F5F9"
                        : "#CBD5E1",

                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: 120,
                    }}
                  >
                    {player.username}
                  </span>

                  {isMe && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: "#60A5FA",
                        background: "#1D4ED8",
                        padding: "1px 6px",
                        borderRadius: 100,
                        flexShrink: 0,
                      }}
                    >
                      MOI
                    </span>
                  )}

                  {!placementGames && (
                    <LeaguePill elo={elo} small />
                  )}

                  {placementGames && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: "#CBD5E1",
                        background: "#334155",
                        padding: "2px 7px",
                        borderRadius: 999,
                      }}
                    >
                      {stats.games ?? 0}/4 classement
                    </span>
                  )}
                </div>

                {!placementGames && (
                  <TierBar elo={elo} thick={3} />
                )}
              </div>

              {/* Spark + Élo */}
              {!placementGames && (
                <MiniSpark data={spark} />
              )}

              <div
                style={{
                  textAlign: "right",
                  flexShrink: 0,
                  minWidth: 58,
                }}
              >
                <div
                  style={{
                    fontSize: 17,
                    fontWeight: 800,
                    color: league.color,

                    filter: placementGames
                      ? "blur(5px)"
                      : "none",

                    userSelect: "none",
                  }}
                >
                  {elo}
                </div>

                <div
                  style={{
                    fontSize: 10,
                    color: "#475569",
                    marginTop: 1,
                  }}
                >
                  {stats.games ?? 0}p
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {sorted.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: 40,
            color: "#475569",
          }}
        >
          Aucun joueur trouvé
        </div>
      )}
    </div>
  )}
</div>

        {/* ── SIMULATEUR ── */}
        <button onClick={()=>setShowSim(v=>!v)} style={{
          width:"100%",padding:"14px",borderRadius:14,
          background:showSim?"#1D4ED8":"#0F172A",
          border:`1.5px solid ${showSim?"#3B82F6":"#1E293B"}`,
          color:showSim?"#BFDBFE":"#64748B",fontSize:14,fontWeight:600,
          cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,
          marginBottom:12,transition:"all 0.2s",
        }}>
          🎁 {showSim?"Fermer les recompenses":"Récompenses de saison"}
        </button>
        {showSim&&<Simulator  onClose={()=>setShowSim(v=>!v)}/>}

        {/* ── LÉGENDE ── */}
        <div style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:16,padding:16}}>
          <div style={{fontSize:12,fontWeight:600,color:"#64748B",marginBottom:12}}>Multiplicateurs de gain Élo</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            {[
              {l:"Coinche réussie",m:"×1.60",c:"#A78BFA"},
              {l:"Surcoinche réussie",m:"×2.20",c:"#F472B6"},
              {l:"Capot infligé",m:"×1.70",c:"#FB923C"},
              {l:"Victoire écrasante",m:"×1.30",c:"#FBBF24"},
              {l:"Série de victoires",m:"1+V*0.1",c:"#CD853F"},
              {l:"Contrat Réussi",m:"×1.15",m2:"×1.20",c:"#60A5FA"},
            ].map(m=>(
              <div key={m.l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 10px",background:"#1E293B",borderRadius:10}}>
                <span style={{fontSize:11,color:"#94A3B8"}}>{m.l}</span>
                <span style={{fontSize:13,fontWeight:700,color:m.c,fontFamily:"monospace"}}>{m.m}</span>
              </div>
            ))}
          </div>
          <div style={{marginTop:10,fontSize:11,color:"#334155",textAlign:"center"}}>Les multiplicateurs se cumulent · Coinche + Capot = ~×2.60</div>
        </div>

      </div>

      {/* Modals */}
      {selected&&<ProfileSheet player={selected} mode={mode} onClose={()=>setSelected(null)}/>}
      
    </div>
  );
}
