// import React, { useState, useMemo } from 'react';
// import './App.css';

// /**
//  * MONARCH METAL - PRODUCTION GRADE OPTIMIZER
//  */

// // Helper to format numbers: 2.000 -> 2, 2.110 -> 2.11, 2.111 -> 2.111
// const fmt = (num) => {
//   if (isNaN(num)) return "0";
//   return parseFloat(Number(num).toFixed(3)).toString();
// };

// const optimizedBestFit = (stockLen, kerf, partsList) => {
//   const parts = [];
//   partsList.forEach(p => {
//     const qty = parseInt(p.qty);
//     const len = parseFloat(p.length);
//     if (qty > 0 && len > 0 && len <= stockLen) {
//       for (let i = 0; i < qty; i++) parts.push(len);
//     }
//   });
  
//   if (parts.length === 0) return [];
//   parts.sort((a, b) => b - a);
  
//   const bars = [];
//   while (parts.length > 0) {
//     let currentCuts = [];
//     let currentUsedWithKerf = 0;
    
//     let improved = true;
//     while (improved && parts.length > 0) {
//       improved = false;
//       let bestIdx = -1;
//       let bestWaste = Infinity;
//       for (let i = 0; i < parts.length; i++) {
//         const partLen = parts[i];
//         const spaceNeeded = partLen + kerf;
//         if (currentUsedWithKerf + spaceNeeded <= stockLen + kerf) {
//           const waste = stockLen - (currentUsedWithKerf + spaceNeeded - kerf);
//           if (waste < bestWaste) {
//             bestWaste = waste;
//             bestIdx = i;
//             improved = true;
//           }
//         }
//       }
//       if (bestIdx !== -1) {
//         currentCuts.push(parts[bestIdx]);
//         currentUsedWithKerf += parts[bestIdx] + kerf;
//         parts.splice(bestIdx, 1);
//       }
//     }
    
//     if (currentCuts.length > 0) {
//       let filled = true;
//       while (filled && parts.length > 0) {
//         filled = false;
//         const remaining = stockLen - (currentUsedWithKerf - kerf);
//         for (let i = parts.length - 1; i >= 0; i--) {
//           if (parts[i] <= remaining + 0.00001) {
//             currentCuts.push(parts[i]);
//             currentUsedWithKerf += parts[i] + kerf;
//             parts.splice(i, 1);
//             filled = true;
//             break;
//           }
//         }
//       }
//     }
    
//     if (currentCuts.length > 0) {
//       const sumOfParts = currentCuts.reduce((a, b) => a + b, 0);
//       const totalBladeLoss = Math.max(0, (currentCuts.length - 1) * kerf);
//       const opticutterLoss = currentCuts.length * kerf;
      
//       bars.push({
//         stockLength: stockLen,
//         cuts: [...currentCuts].sort((a, b) => b - a),
//         totalKerf: totalBladeLoss,
//         opticutterKerf: opticutterLoss,
//         trueWaste: Math.max(0, stockLen - sumOfParts - totalBladeLoss),
//         opticutterWaste: Math.max(0, stockLen - sumOfParts - opticutterLoss),
//         key: [...currentCuts].sort((a, b) => b - a).join(',')
//       });
//     } else break;
//   }
//   return bars;
// };

// const LayoutItem = ({ layout, index, partColorMap, optimize }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const groupedCuts = layout.cuts.reduce((acc, c) => { acc[c] = (acc[c] || 0) + 1; return acc; }, {});
//   const displayWaste = optimize ? layout.opticutterWaste : layout.trueWaste;

//   return (
//     <div className="visual-card">
//       <button className="toggle-details-btn no-print" onClick={() => setIsOpen(!isOpen)}>
//         {isOpen ? '− Hide' : '+ Info'}
//       </button>

//       <div className="card-header">
//         <div className="layout-title">
//           <div className="title-text">
//           <h3>
//             Layout {String.fromCharCode(65 + index)} - <span className="repetition-badge"> {layout.repetition}x</span> 
//           </h3>
//           </div>
//         </div>
//         <div className="waste-header-box no-print">
//           <span className={`waste-label ${optimize ? 'opti-mode' : ''}`}>
//             Waste: {fmt(displayWaste)}″
//           </span>
//         </div>
//         <div className="print-only-waste">
//             Waste: {fmt(displayWaste)}″
//         </div>
//       </div>

//       <div className="visual-bar-container no-print">
//         {layout.cuts.map((cut, ci) => (
//           <div key={ci} className="cut-piece" style={{ width: `${(cut / layout.stockLength) * 100}%`, backgroundColor: partColorMap[cut] }}>
//             {fmt(cut)}″
//           </div>
//         ))}
//         <div className="waste-segment" style={{ flex: 1 }}></div>
//       </div>

//       <div className={`cut-details-expanded ${isOpen ? 'show-details' : ''} ${!isOpen ? 'print-show' : ''}`}>
//         <div className="details-grid">
//           <div className="details-column">
//             <span className="col-label">Required Cuts</span>
//             <span className="col-value highlight">
//                {Object.entries(groupedCuts).map(([len, qty]) => `${qty}x: ${fmt(len)}″`).join(', ')}
//             </span>
//           </div>
//           <div className="details-column">
//             <span className="col-label">Blade Dust</span>
//             <span className="col-value highlight">{fmt(optimize ? layout.opticutterKerf : layout.totalKerf)}″</span>
//           </div>
//           <div className="details-column">
//             <span className="col-label">Remnant</span>
//             <span className="col-value highlight">{fmt(displayWaste)}″</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default function App() {
//   const [stockLength, setStockLength] = useState(144);
//   const [kerf, setKerf] = useState(0.125);
//   const [optimize, setOptimize] = useState(false);
//   const [parts, setParts] = useState([{ length: '', qty: '' }]);
//   const [results, setResults] = useState(null);
//   const [isCalculating, setIsCalculating] = useState(false);

//   const partColorMap = useMemo(() => {
//     const uniqueLens = [...new Set(parts.map(p => Number(p.length)).filter(l => l > 0))].sort((a,b) => b-a);
//     const colors = ['#c31d2a', '#353b3f', '#612d31', '#7e8f9c', '#000000', '#94a3b8'];
//     const map = {};
//     uniqueLens.forEach((len, i) => { map[len] = colors[i % colors.length]; });
//     return map;
//   }, [parts]);

//   const stats = useMemo(() => {
//     if (!results || results.length === 0) return null;
//     const totalBars = results.reduce((a, b) => a + b.repetition, 0);
//     const totalPartsLen = parts.reduce((a, b) => a + (Number(b.length) * (parseInt(b.qty) || 0)), 0);
//     const totalUsedStockLength = totalBars * Number(stockLength);
//     const wasteField = optimize ? "opticutterWaste" : "trueWaste";
//     const sumWaste = results.reduce((a, b) => a + (Number(b[wasteField]) * Number(b.repetition)), 0);
//     const sumBladeDust = results.reduce((a, b) => a + (Number(optimize ? b.opticutterKerf : b.totalKerf) * Number(b.repetition)), 0);

//     const yieldNum = totalUsedStockLength > 0 ? (totalPartsLen / totalUsedStockLength) * 100 : 0;

//     return {
//       yieldPct: fmt(yieldNum),
//       status: yieldNum >= 90 ? 'good' : (yieldNum >= 80 ? 'neutral' : 'bad'),
//       totalPartsLen: fmt(totalPartsLen),
//       totalPartsCount: parts.reduce((a, b) => a + (parseInt(b.qty) || 0), 0),
//       totalBars,
//       stockLenValue: fmt(stockLength),
//       totalUsedStockLength: fmt(totalUsedStockLength),
//       sumWaste: fmt(sumWaste),
//       sumBladeDust: fmt(sumBladeDust),
//       uniqueLayouts: results.length
//     };
//   }, [results, parts, stockLength, optimize]);

//   const handleCalculate = () => {
//     if (Number(stockLength) <= 0) return;
//     setResults(null); 
//     setIsCalculating(true);
//     setTimeout(() => {
//       const rawBars = optimizedBestFit(Number(stockLength), Number(kerf), [...parts]);
//       const groupedResults = rawBars.reduce((acc, bar) => {
//         const existing = acc.find(l => l.key === bar.key);
//         if (existing) { existing.repetition += 1; } 
//         else { acc.push({ ...bar, repetition: 1 }); }
//         return acc;
//       }, []);
//       setResults(groupedResults.sort((a, b) => b.repetition - a.repetition));
//       setIsCalculating(false);
//     }, 150);
//   };

//   const handleReset = () => {
//     setStockLength(0);
//     setKerf(0);
//     setParts([{ length: '', qty: '' }]);
//     setResults(null);
//   };

//   const handleExportCSV = () => {
//     if (!results) return;
//     const wasteField = optimize ? "opticutterWaste" : "trueWaste";
//     let csv = `Kerf,${kerf}"\nStock length,Quantity\n${stockLength}",${stats.totalBars}\nTotal Waste,${stats.sumWaste}"\n\n`;
//     results.forEach((l, i) => {
//       csv += `Layout ${String.fromCharCode(65 + i)} (${l.repetition}x),Waste: ${fmt(l[wasteField])}"\n`;
//       const counts = l.cuts.reduce((acc, c) => { acc[c] = (acc[c] || 0) + 1; return acc; }, {});
//       Object.entries(counts).forEach(([len, qty]) => { csv += `${len}",${qty}\n`; });
//       csv += `\n`;
//     });
//     const blob = new Blob([csv], { type: 'text/csv' });
//     const url = window.URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = `Monarch-Cut-List.csv`;
//     a.click();
//   };

//   return (
//     <div className="app-container">
//       <aside className="sidebar no-print">
//         <img src="/Monarch3Logo.svg" alt="Logo" className="company-logo" />
//         <h1 className="logo">Linear Cutting List <br/><span>Optimizer</span></h1>
        
//         <div className="settings-box">
//           <div className="input-group">
//             <label>Stock (″)</label>
//             <input type="number" value={stockLength} onChange={e => setStockLength(e.target.value)} />
//           </div>
//           <div className="input-group">
//             <label>Blade (″)</label>
//             <input type="number" step="0.001" value={kerf} onChange={e => setKerf(e.target.value)} />
//           </div>
//         </div>

//         <div className="toggle-container">
//           <label className="switch">
//             <input type="checkbox" checked={optimize} onChange={() => setOptimize(!optimize)} />
//             <span className="slider round"></span>
//           </label>
//           <span className="toggle-label">Optimize Results</span>
//         </div>

//         <div className="parts-list-container">
//           <div className="parts-header"><h3>Parts List</h3><button className="add-btn" onClick={() => setParts([...parts, { length: '', qty: '' }])}>+ Add</button></div>
//           <div className="parts-labels"><span>Length (″)</span><span>Quantity</span></div>
//           <div className="parts-scroll">
//             {parts.map((p, i) => (
//               <div key={i} className="part-entry">
//                 <input type="number" placeholder="0.00" value={p.length} onChange={e => { const n = [...parts]; n[i].length = e.target.value; setParts(n); }} />
//                 <input type="number" placeholder="0" value={p.qty} onChange={e => { const n = [...parts]; n[i].qty = e.target.value; setParts(n); }} />
//                 <button className="del-btn" onClick={() => setParts(parts.filter((_, idx) => idx !== i))}>×</button>
//               </div>
//             ))}
//           </div>
//         </div>
        
//         <div className="action-buttons">
//           <button className="main-calc-btn" onClick={handleCalculate} disabled={isCalculating}>Calculate Layout</button>
//           <button className="reset-btn" onClick={handleReset}>Reset All</button>
//         </div>

//         {results && (
//             <div className="download-group">
//                 <button className="export-btn csv" onClick={handleExportCSV}>Download CSV</button>
//                 <button className="export-btn pdf" onClick={() => window.print()}>Download PDF</button>
//             </div>
//         )}
//       </aside>

//       <main className="results-view">
//         <div className="print-header">
//             <img src="/Monarch3Logo.svg" alt="Logo" style={{width:'200px'}} />
//             <h2>Cutting Optimization Report</h2>
//         </div>

//         {stats && (
//           <div className="stats-dashboard">
//             <div className={`stat-card highlight status-${stats.status}`}>
//               <label>Used total length (Yield)</label>
//               <strong>{stats.totalUsedStockLength}″ ({stats.yieldPct}%)</strong>
//             </div>
//             <div className="stat-card"><label>Kerf / Blade Size</label><strong>{fmt(kerf)}″</strong></div>
//             <div className="stat-card">
//               <label>Stocks Required (Length)</label>
//               <strong>{stats.totalBars} ({stats.stockLenValue}″)</strong>
//             </div>
//             <div className="stat-card"><label>Total Parts (Length)</label><strong>{stats.totalPartsCount} ({stats.totalPartsLen}″)</strong></div>
//             <div className="stat-card"><label>Unique Layouts</label><strong>{stats.uniqueLayouts}</strong></div>
//             <div className="stat-card"><label>Total Cuts</label><strong>{stats.totalPartsCount}</strong></div>
//             <div className={`stat-card status-${stats.status === 'bad' ? 'bad' : ''}`}>
//               <label>Sum of Waste</label>
//               <strong className="primary-text">{stats.sumWaste}″</strong>
//             </div>
//             <div className="stat-card"><label>Total Blade Dust</label><strong>{stats.sumBladeDust}″</strong></div>
//           </div>
//         )}
//         <div className="layout-list">
//           {results && results.map((l, i) => <LayoutItem key={i} layout={l} index={i} partColorMap={partColorMap} optimize={optimize} />)}
//         </div>
//       </main>
//     </div>
//   );
// }
import React, { useState, useMemo, useRef } from 'react';
import './App.css';

/**
 * MONARCH METAL - PRODUCTION GRADE OPTIMIZER
 */

const fmt = (num) => {
  if (isNaN(num)) return "0";
  return parseFloat(Number(num).toFixed(3)).toString();
};

// HIGH PERFORMANCE ALGORITHM
const optimizedBestFit = (stockLen, kerf, partsList, sortAsc = false, useFullKerf = false) => {
  const parts = [];
  partsList.forEach(p => {
    const qty = parseInt(p.qty);
    const len = parseFloat(p.length);
    const name = p.name || "Part";
    if (qty > 0 && len > 0 && len <= stockLen) {
      for (let i = 0; i < qty; i++) parts.push({ len, name });
    }
  });
  
  if (parts.length === 0) return [];
  parts.sort((a, b) => sortAsc ? a.len - b.len : b.len - a.len);
  
  const bars = [];
  const usedIndices = new Set();
  
  while (usedIndices.size < parts.length) {
    let currentCuts = [];
    let currentUsedWithKerf = 0;
    
    for (let i = 0; i < parts.length; i++) {
      if (usedIndices.has(i)) continue;
      const part = parts[i];
      
      const kerfToApply = useFullKerf ? kerf : (currentCuts.length === 0 ? 0 : kerf);
      
      if (currentUsedWithKerf + kerfToApply + part.len <= stockLen) {
        currentCuts.push(part);
        currentUsedWithKerf += (kerfToApply + part.len);
        usedIndices.add(i);
      }
    }
    
    if (currentCuts.length > 0) {
      const sumOfParts = currentCuts.reduce((a, b) => a + b.len, 0);
      const totalBladeLoss = Math.max(0, (currentCuts.length - 1) * kerf);
      const opticutterLoss = currentCuts.length * kerf;
      const key = currentCuts.map(c => c.len).sort((a, b) => b - a).join(',');
      
      bars.push({
        stockLength: stockLen,
        cuts: currentCuts,
        totalKerf: totalBladeLoss,
        opticutterKerf: opticutterLoss,
        trueWaste: Math.max(0, stockLen - sumOfParts - totalBladeLoss),
        opticutterWaste: Math.max(0, stockLen - sumOfParts - opticutterLoss),
        key: key
      });
    } else break;
  }
  return bars;
};

const LayoutItem = ({ layout, index, partColorMap, optimize, kerf }) => {
  const [isOpen, setIsOpen] = useState(false);
  const groupedCuts = useMemo(() => {
    return layout.cuts.reduce((acc, c) => { 
      const label = `${c.name ? c.name + ': ' : ''}${fmt(c.len)}″`;
      acc[label] = (acc[label] || 0) + 1; 
      return acc; 
    }, {});
  }, [layout.cuts]);

  const displayWaste = optimize ? layout.opticutterWaste : layout.trueWaste;

  return (
    <div className="visual-card">
      <button className="toggle-details-btn no-print" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? '− Hide' : '+ Info'}
      </button>

      <div className="card-header">
        <div className="layout-title">
          <h3>Layout {String.fromCharCode(65 + index)} <span className="repetition-badge">{layout.repetition}x</span></h3>
        </div>
        <div className="waste-header-box no-print">
          <span className={`waste-label ${optimize ? 'opti-mode' : ''}`}>
            Waste: {fmt(displayWaste)}″
          </span>
        </div>
        <div className="print-only-waste">Waste: {fmt(displayWaste)}″</div>
      </div>

      <div className="visual-bar-container no-print">
        {layout.cuts.map((cut, ci) => (
          <React.Fragment key={ci}>
            <div 
              className="cut-piece" 
              style={{ width: `${(cut.len / layout.stockLength) * 100}%`, backgroundColor: partColorMap[cut.len] }}
              title={cut.name}
            >
              {fmt(cut.len)}″
            </div>
            {ci < layout.cuts.length - 1 && (
              <div className="visual-kerf-gap" style={{ width: `${(kerf / layout.stockLength) * 100}%` }}></div>
            )}
          </React.Fragment>
        ))}
        <div className="waste-segment" style={{ flex: 1 }}></div>
      </div>

      <div className={`cut-details-expanded ${isOpen ? 'show-details' : ''} print-show`}>
        <div className="details-grid">
          <div className="details-column">
            <span className="col-label">Required Cuts</span>
            <span className="col-value highlight">
               {Object.entries(groupedCuts).map(([label, qty]) => `${qty}x ${label}`).join(', ')}
            </span>
          </div>
          <div className="details-column">
            <span className="col-label">Blade Dust</span>
            <span className="col-value highlight">{fmt(optimize ? layout.opticutterKerf : layout.totalKerf)}″</span>
          </div>
          <div className="details-column">
            <span className="col-label">Remnant</span>
            <span className="col-value highlight">{fmt(displayWaste)}″</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [stockLength, setStockLength] = useState(144);
  const [kerf, setKerf] = useState(0.125);
  const [optimize, setOptimize] = useState(false);
  const [sortAsc, setSortAsc] = useState(false);
  const [showHelp, setShowHelp] = useState(false); // FIXED: Variable first, Function second
  const [parts, setParts] = useState([{ name: '', length: '', qty: '' }]);
  const [results, setResults] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const fileInputRef = useRef(null);

  const partColorMap = useMemo(() => {
    const uniqueLens = [...new Set(parts.map(p => Number(p.length)).filter(l => l > 0))].sort((a,b) => b-a);
    const brandColors = ['#c31d2a', '#353b3f', '#612d31', '#7e8f9c', '#000000', '#94a3b8'];
    const map = {};
    uniqueLens.forEach((len, i) => {
      if (i < brandColors.length) map[len] = brandColors[i];
      else {
        const hue = (i * 137.508) % 360;
        map[len] = `hsl(${hue}, 60%, 45%)`;
      }
    });
    return map;
  }, [parts]);

  const stats = useMemo(() => {
    if (!results || results.length === 0) return null;
    const totalBars = results.reduce((a, b) => a + b.repetition, 0);
    const totalPartsLen = parts.reduce((a, b) => a + (Number(b.length) * (parseInt(b.qty) || 0)), 0);
    const totalUsedStockLength = totalBars * Number(stockLength);
    const wasteField = optimize ? "opticutterWaste" : "trueWaste";
    const kerfField = optimize ? "opticutterKerf" : "totalKerf";
    
    const sumWaste = results.reduce((a, b) => a + (Number(b[wasteField]) * Number(b.repetition)), 0);
    const sumBladeDust = results.reduce((a, b) => a + (Number(b[kerfField]) * Number(b.repetition)), 0);
    
    const yieldNum = totalUsedStockLength > 0 ? (totalPartsLen / totalUsedStockLength) * 100 : 0;

    return {
      yieldPct: fmt(yieldNum),
      status: yieldNum >= 90 ? 'good' : (yieldNum >= 80 ? 'neutral' : 'bad'),
      totalPartsLen: fmt(totalPartsLen),
      totalPartsCount: parts.reduce((a, b) => a + (parseInt(b.qty) || 0), 0),
      totalBars,
      stockLenValue: fmt(stockLength),
      totalUsedStockLength: fmt(totalUsedStockLength),
      sumWaste: fmt(sumWaste),
      sumBladeDust: fmt(sumBladeDust),
      uniqueLayouts: results.length
    };
  }, [results, parts, stockLength, optimize]);

  const handleCalculate = () => {
    if (Number(stockLength) <= 0) return;
    setIsCalculating(true);
    setTimeout(() => {
      const rawBars = optimizedBestFit(Number(stockLength), Number(kerf), [...parts], sortAsc, optimize);
      const groupMap = new Map();
      rawBars.forEach(bar => {
        if (groupMap.has(bar.key)) groupMap.get(bar.key).repetition += 1;
        else groupMap.set(bar.key, { ...bar, repetition: 1 });
      });
      setResults(Array.from(groupMap.values()).sort((a, b) => b.repetition - a.repetition));
      setIsCalculating(false);
    }, 50);
  };

  const handleBulkUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const lines = text.split(/\r?\n/);
      const newParts = lines.map(line => {
        const cols = line.split(',').map(s => s.trim());
        if (cols.length === 3) return { name: cols[0], length: cols[1], qty: cols[2] };
        if (cols.length === 2) return { name: '', length: cols[0], qty: cols[1] };
        return null;
      }).filter(p => p && p.length !== "" && !isNaN(p.length));
      setParts(prev => [...prev.filter(p => p.length !== ""), ...newParts]);
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const handleExportCSV = () => {
    if (!results) return;
    const wasteField = optimize ? "opticutterWaste" : "trueWaste";
    let csv = `Layout ID,Repetitions,Part Name,Length,Qty,Layout Waste\n`;
    results.forEach((l, i) => {
      const counts = l.cuts.reduce((acc, c) => { 
        const key = `${c.name}|${c.len}`;
        acc[key] = (acc[key] || 0) + 1; 
        return acc; 
      }, {});
      Object.entries(counts).forEach(([key, qty], idx) => {
        const [name, len] = key.split('|');
        csv += `${String.fromCharCode(65 + i)},${idx === 0 ? l.repetition : ''},${name},${len}",${qty},${idx === 0 ? fmt(l[wasteField]) + '"' : ''}\n`;
      });
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Monarch-Optimization-Report.csv`;
    a.click();
  };

  return (
    <div className="app-container">
      <aside className="sidebar no-print">
        <img src="/Monarch3Logo.svg" alt="Logo" className="company-logo" />
        <h1 className="logo">Linear Cutting List <br/><span>Optimizer</span></h1>
        
        <div className="settings-box">
          <div className="input-group">
            <label>Stock (″)</label>
            <input type="number" value={stockLength} onChange={e => setStockLength(e.target.value)} />
          </div>
          <div className="input-group">
            <label>Blade (″)</label>
            <input type="number" step="0.001" value={kerf} onChange={e => setKerf(e.target.value)} />
          </div>
        </div>

        <div className="toggle-container">
          <label className="switch">
            <input type="checkbox" checked={optimize} onChange={() => setOptimize(!optimize)} />
            <span className="slider round"></span>
          </label>
          <span className="toggle-label">Optimize Results (full kerf logic)</span>
        </div>

        <div className="toggle-container">
          <label className="switch">
            <input type="checkbox" checked={sortAsc} onChange={() => setSortAsc(!sortAsc)} />
            <span className="slider round"></span>
          </label>
          <span className="toggle-label">Smallest First</span>
        </div>

        <div className="parts-list-container">
          <div className="parts-header">
            <h3>Parts List</h3>
            <div style={{display: 'flex', gap: '5px'}}>
              <button className="add-btn bulk" onClick={() => fileInputRef.current.click()}>Bulk</button>
              <button className="add-btn" onClick={() => setParts([...parts, { name: '', length: '', qty: '' }])}>+ Add</button>
            </div>
            <input type="file" ref={fileInputRef} style={{display:'none'}} accept=".csv,.txt" onChange={handleBulkUpload} />
          </div>
          <div className="parts-labels">
            <span style={{flex: '1.2'}}>Name</span>
            <span>Length</span>
            <span>Qty</span>
            <span style={{flex: '0.3'}}></span>
          </div>
          <div className="parts-scroll">
            {parts.map((p, i) => (
              <div key={i} className="part-entry">
                <input style={{flex: '1.2'}} type="text" placeholder="Part Name" value={p.name} onChange={e => { const n = [...parts]; n[i].name = e.target.value; setParts(n); }} />
                <input type="number" placeholder="0.00" value={p.length} onChange={e => { const n = [...parts]; n[i].length = e.target.value; setParts(n); }} />
                <input type="number" placeholder="0" value={p.qty} onChange={e => { const n = [...parts]; n[i].qty = e.target.value; setParts(n); }} />
                <button className="del-btn" style={{flex: '0.3'}} onClick={() => setParts(parts.filter((_, idx) => idx !== i))}>×</button>
              </div>
            ))}
          </div>
        </div>
        
        <div className="action-buttons">
          <button className="main-calc-btn" onClick={handleCalculate} disabled={isCalculating}>
            {isCalculating ? 'Processing...' : 'Calculate Layout'}
          </button>
          <button className="reset-btn" onClick={() => { setParts([{ name: '', length: '', qty: '' }]); setResults(null); }}>Reset All</button>
        </div>

        {results && (
            <div className="download-group">
                <button className="export-btn csv" onClick={handleExportCSV}>CSV Report</button>
                <button className="export-btn pdf" onClick={() => window.print()}>Print / PDF</button>
            </div>
        )}
      </aside>

      <main className="results-view">
        <div className="print-header">
            <img src="/Monarch3Logo.svg" alt="Logo" style={{width:'150px'}} />
            <h2>Cutting Optimization Report</h2>
        </div>

        {stats && (
          <>
            <div className="summary-header">
              <div className="summary-title">
                <label>Material Utilization Ratio</label>
                <button className="help-icon-btn" onClick={() => setShowHelp(!showHelp)}>?</button>
              </div>
              {showHelp && (
                <div className="help-tooltip">
                  <h4>Understanding the Summary Bar</h4>
                  <ul>
                    <li><span className="dot used"></span> <strong>Used:</strong> Raw material in finished parts.</li>
                    <li><span className="dot dust"></span> <strong>Blade Dust:</strong> Total material lost to the saw blade thickness (Kerf).</li>
                    <li><span className="dot waste"></span> <strong>Remnant:</strong> Off-cuts and waste left on the bars.</li>
                  </ul>
                </div>
              )}
            </div>
            
            

            <div className="material-summary-bar no-print">
              <div className="summary-segment used" style={{ width: `${stats.yieldPct}%` }} title={`Used: ${stats.yieldPct}%`}></div>
              <div className="summary-segment dust" style={{ width: `${(parseFloat(stats.sumBladeDust) / parseFloat(stats.totalUsedStockLength)) * 100}%` }} title="Blade Dust"></div>
              <div className="summary-segment waste" style={{ flex: 1 }} title="Remnant Waste"></div>
            </div>

            <div className="stats-dashboard">
              <div className={`stat-card highlight status-${stats.status}`}>
                <label>Used total length (Yield)</label>
                <strong>{stats.totalUsedStockLength}″ ({stats.yieldPct}%)</strong>
              </div>
              <div className="stat-card"><label>Kerf / Blade Size</label><strong>{fmt(kerf)}″</strong></div>
              <div className="stat-card">
                <label>Stocks Required</label>
                <strong>{stats.totalBars} ({stats.stockLenValue}″)</strong>
              </div>
              <div className="stat-card"><label>Total Parts (Length)</label><strong>{stats.totalPartsCount} ({stats.totalPartsLen}″)</strong></div>
              <div className="stat-card"><label>Unique Layouts</label><strong>{stats.uniqueLayouts}</strong></div>
              <div className="stat-card"><label>Total Cuts</label><strong>{stats.totalPartsCount}</strong></div>
              <div className={`stat-card status-${stats.status === 'bad' ? 'bad' : ''}`}>
                <label>Sum of Waste</label>
                <strong className="primary-text">{stats.sumWaste}″</strong>
              </div>
              <div className="stat-card"><label>Total Blade Dust</label><strong>{stats.sumBladeDust}″</strong></div>
            </div>
          </>
        )}
        <div className="layout-list">
          {results && results.map((l, i) => <LayoutItem key={i} layout={l} index={i} partColorMap={partColorMap} optimize={optimize} kerf={kerf} />)}
        </div>
      </main>
    </div>
  );
}