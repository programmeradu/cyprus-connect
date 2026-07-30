"use client";
import { ConsoleOverview } from "@/components/app/dashboard/ConsoleOverview";
const months = ["Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun","Jul"];
const history = months.map((m,i)=>({label:m,carbon:9+Math.sin(i/1.7)*3+i*0.2,electricity:4200+Math.cos(i/2)*900,renewable:12+i*1.4,efficiency:55+Math.sin(i/2)*9+i}));
export default function P(){
  return <div className="p-6"><ConsoleOverview greeting="Hello, Andreas." subline="This is where your footprint stands today, month by month." history={history}
    current={{carbon:11.4,carbonTrend:-6.2,electricity:4800,renewable:28,renewableTrend:3.1,efficiency:67,efficiencyTrend:2.4,waste:41}}
    grid={{value:610,unit:"gCO₂/kWh",renewables:24,source:"Cyprus grid mix, EAC transmission data."}}
    peers={[{label:"Total carbon footprint",percentile:62},{label:"Renewable share",percentile:38},{label:"Waste diversion",percentile:74},{label:"Overall standing",percentile:58}]}
    peerNote="Rank 42 of 310 Cyprus SMEs."
    deadlines={[{label:"VSME voluntary disclosure",date:"2026-12-31",detail:"Requested by banks and large customers."},{label:"CSRD wave 3 first report",date:"2027-01-01",detail:"Listed SMEs report on financial year 2026."},{label:"CBAM definitive declaration (FY2026)",date:"2027-05-31",detail:"Importers of steel, cement, aluminium and fertiliser."}]}
    labels={{carbon:"Total carbon footprint",electricity:"Electricity used",renewables:"Renewable share",efficiency:"Resource efficiency",waste:"Waste diversion",grid:"Cyprus grid intensity",peers:"Peer comparison",horizon:"Regulatory horizon",monthly:"Footprint by month",noDeadlines:"None.",noSeries:"No series.",noPeers:"No peers.",daysLeft:(d:number)=>d===0?"Due today":`${d} days`}} /></div>;
}
