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
            <div className="cut-piece" style={{ width: `${(cut.len / layout.stockLength) * 100}%`, backgroundColor: partColorMap[cut.len] }} title={cut.name}>
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
  const [showHelp, setShowHelp] = useState(false);
  const [showHelp2, setShowHelp2] = useState(false);
  const [parts, setParts] = useState([{ name: '', length: '', qty: '' }]);
  const [results, setResults] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [bulkFileName, setBulkFileName] = useState(null);
  const fileInputRef = useRef(null);

  const partColorMap = useMemo(() => {
    const uniqueLens = [...new Set(parts.map(p => Number(p.length)).filter(l => l > 0))].sort((a, b) => b - a);
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

  const validation = useMemo(() => {
    const stock = parseFloat(stockLength) || 0;
    const errors = [];
    const oversizedIndices = parts
      .map((p, i) => (parseFloat(p.length) > stock ? i : -1))
      .filter(i => i !== -1);

    if (stock <= 0) errors.push("Stock length is required.");
    if (oversizedIndices.length > 0) errors.push(`${oversizedIndices.length} part(s) exceed stock length.`);
    if (!parts.some(p => parseFloat(p.length) > 0 && parseInt(p.qty) > 0)) errors.push("No valid parts added.");

    return { isValid: errors.length === 0, messages: errors, oversizedIndices };
  }, [stockLength, parts]);

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
    setIsCalculating(true);
    setResults(null);
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
      const newParts = lines.map((line, index) => {
        const cols = line.split(',').map(s => s.trim()).filter(s => s !== "");
        if (cols.length < 2) return null;
        if (index === 0 && (cols[0].toLowerCase().includes("name") || cols[1].toLowerCase().includes("length"))) return null;
        return (cols.length >= 3)
          ? { name: cols[0], length: cols[1], qty: cols[2] }
          : { name: '', length: cols[0], qty: cols[1] };
      }).filter(p => p && p.length !== "" && !isNaN(parseFloat(p.length)));

      if (newParts.length > 0) {
        setParts(newParts);
        setBulkFileName(file.name);
        setResults(null);
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const handleClearData = () => {
    setParts([{ name: '', length: '', qty: '' }]);
    setResults(null);
    setBulkFileName(null);
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
        csv += `${String.fromCharCode(65 + i)},${idx === 0 ? l.repetition : ''},${name},${len},${qty},${idx === 0 ? fmt(l[wasteField]) : ''}\n`;
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
        <div className="logo-stack">
          <h1 className="logo-top">Linear Cutting List</h1>
          <div className="logo-bottom">
            <span>Optimizer</span>
            <button className="help-icon-btn" onClick={() => setShowHelp2(!showHelp2)}>?</button>
            {showHelp2 && (
              <div className="help-tooltip2">
                <h4>How To Use It:
                </h4>
                <ul>
                  <li><strong>Stock & Blade:</strong> Set your raw material length and the thickness of your saw blade (Kerf). <br/>
                  Default values are 144" and 0.125" respectively.</li>

                  <li><strong>Optimized (Full Kerf):</strong>
                    <br /><em>- OFF:</em> Only subtracts blade width between parts.
                    <br /><em>- ON:</em> Subtracts blade width for <strong>every</strong> cut, including the very last one. Best for high-precision or where the edge cleanup is required on both sides of every part.
                  </li>

                  <li><strong>Smallest First:</strong>
                    <br /><em>- OFF:</em> Fits the longest parts first (standard practice to reduce total waste).
                    <br /><em>- ON:</em> Fits shortest parts first. Useful if you want to prioritize using up remnants for small pieces first.
                  </li>

                  <li><strong>Bulk Upload:</strong> 
                  <br /><em>-</em> Upload a CSV with <i><strong>Name, Length<sup>*</sup>, Qty<sup>*</sup></strong></i> to save time.  
                    <br /><em>- Clear File:</em> Removes the uploaded file and resets the parts list.
                    <br/><em>-</em> You will be able to edit the list, but not add parts on top of the uploaded data.
                    </li>

                  <li><strong>Parts List:</strong>
                    <br /><em>- Name:</em> Name the part to keep track of it
                    <br /><em>- Length:</em> Specify the length of the part
                    <br /><em>- Qty:</em> Specify the quantity of the part
                    <br /><em>- <i>+ Add:</i></em> Add another part to the list
                  </li>

                  <li><strong>Calculate Layout:</strong> Calculate the parts list layout based on the current settings.</li>
                  <li><strong>Reset All:</strong> Resets the whole application to its initial state.</li>
                   <li><strong>+ Info</strong> View detailed information about the layout</li>
                   <li><strong>CSV Report</strong> Download the results in a csv format</li>
                   <li><strong>Print/PDF</strong> Download a PDF version of the results</li>

                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="settings-box">
          <div className="input-group">
            <label>Stock (″)<span className='req'>*</span></label>
            <input type="number" value={stockLength} onChange={e => setStockLength(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Blade (″)<span className='req'>*</span></label>
            <input type="number" step="0.001" value={kerf} onChange={e => setKerf(e.target.value)} required />
          </div>
        </div>

        <div className="toggle-container">
          <label className="switch">
            <input type="checkbox" checked={optimize} onChange={() => setOptimize(!optimize)} />
            <span className="slider round"></span>
          </label>
          <span className="toggle-label">Optimized Results (Full Kerf Logic)</span>
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
            <div style={{ display: 'flex', gap: '5px' }}>
              {!bulkFileName && (
                <>
                  <button className="add-btn bulk" onClick={() => fileInputRef.current.click()}>Bulk</button>
                  <button className="add-btn" onClick={() => setParts([...parts, { name: '', length: '', qty: '' }])}>+ Add</button>
                </>
              )}
              {bulkFileName && (
                <button className="add-btn reset-small" onClick={handleClearData}>Clear File</button>
              )}
            </div>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".csv,.txt" onChange={handleBulkUpload} />
          </div>

          {bulkFileName && (
            <div className="bulk-file-badge">
              📂 Active File: <span>{bulkFileName}</span>
            </div>
          )}

          <div className="parts-labels">
            <span style={{ flex: '1.2' }}>Name</span>
            <span>Length<span className='req'>*</span></span>
            <span>Qty<span className='req'>*</span></span>
            <span style={{ flex: '0.3' }}></span>
          </div>
          <div className={`parts-scroll ${bulkFileName ? 'bulk-active' : ''}`}>
            {parts.map((p, i) => {
              const isTooLong = parseFloat(p.length) > parseFloat(stockLength);
              return (
                <div key={i} className="part-entry-container">
                  <div className="part-entry">
                    <input style={{ flex: '1.2' }} type="text" placeholder="P1" value={p.name} onChange={e => { const n = [...parts]; n[i].name = e.target.value; setParts(n); }} />
                    <input type="number" placeholder="0.00" value={p.length} className={isTooLong ? 'error-border' : ''} onChange={e => { const n = [...parts]; n[i].length = e.target.value; setParts(n); }} />
                    <input type="number" placeholder="0" value={p.qty} onChange={e => { const n = [...parts]; n[i].qty = e.target.value; setParts(n); }} />
                    {!bulkFileName && <button className="del-btn" style={{ flex: '0.3' }} onClick={() => setParts(parts.filter((_, idx) => idx !== i))}>×</button>}
                  </div>
                  {isTooLong && <div className="error-text">! Part longer than stock</div>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="action-buttons">
          {/* Real-time Sidebar Warnings */}
          {!validation.isValid && (
            <div className="sidebar-error-box no-print">
              {validation.messages.map((m, i) => <div key={i}>• {m}</div>)}
            </div>
          )}

          <button
            className={`main-calc-btn ${!validation.isValid ? 'disabled' : ''}`}
            onClick={handleCalculate}
            disabled={isCalculating || !validation.isValid}
          >
            {isCalculating ? 'Processing...' : 'Calculate Layout'}
          </button>

          <button className="reset-btn" onClick={handleClearData}>Reset All</button>
          {!results && (
            <p style={{ fontSize: '10px', textAlign: 'center', marginTop: '10px' }}><span className='req'>*</span> Required fields</p>)}
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
          <img src="/Monarch3Logo.svg" alt="Logo" style={{ width: '150px' }} />
          <h2>Cutting Optimization Report</h2>
        </div>

        {stats && (
          <>
            <div className="summary-header no-print">
              <div className="summary-title">
                <label>Utilization Ratio</label>
                <button className="help-icon-btn" onClick={() => setShowHelp(!showHelp)}>?</button>
              </div>
              {showHelp && (
                <div className="help-tooltip">
                  <h4>Understanding the Summary Bar</h4>
                  <ul>
                    <li><span className="dot used"></span> <strong>Used:</strong> Material in parts.</li>
                    <li><span className="dot dust"></span> <strong>Blade Dust:</strong> Material lost to Kerf.</li>
                    <li><span className="dot waste"></span> <strong>Remnant:</strong> Off-cuts and waste.</li>
                  </ul>
                </div>
              )}
            </div>

            <div className="material-summary-bar no-print">
              <div className="summary-segment used" style={{ width: `${stats.yieldPct}%` }}></div>
              <div className="summary-segment dust" style={{ width: `${(parseFloat(stats.sumBladeDust) / parseFloat(stats.totalUsedStockLength)) * 100}%` }}></div>
              <div className="summary-segment waste" style={{ flex: 1 }}></div>
            </div>

            <div className="stats-dashboard">
              <div className={`stat-card highlight status-${stats.status}`}>
                <label>Yield</label>
                <strong>{stats.totalUsedStockLength}″ ({stats.yieldPct}%)</strong>
              </div>
              <div className="stat-card"><label>Kerf / Blade</label><strong>{fmt(kerf)}″</strong></div>
              <div className="stat-card">
                <label>Stocks Required</label>
                <strong>{stats.totalBars} ({stats.stockLenValue}″)</strong>
              </div>
              <div className="stat-card"><label>Total Parts</label><strong>{stats.totalPartsCount} ({stats.totalPartsLen}″)</strong></div>
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