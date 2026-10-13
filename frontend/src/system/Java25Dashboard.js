import React, { useState, useEffect } from 'react';
import { apiClient, extractErrorMessage } from '../api';
import { useToast } from '../ToastContext';
import { useI18n } from '../i18n/I18nContext';

export default function Java25Dashboard() {
  const { t } = useI18n();
  const { addToast } = useToast();

  // Diagnostics state
  const [nativeInfo, setNativeInfo] = useState(null);
  const [payloadText, setPayloadText] = useState('Modern Java 25 Native FFM API Payload');
  const [loadingNative, setLoadingNative] = useState(false);

  // Virtual threads state
  const [vtResults, setVtResults] = useState([]);
  const [runningVt, setRunningVt] = useState(false);
  const [activeTasks, setActiveTasks] = useState([]);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [concurrencyStats, setConcurrencyStats] = useState(null);
  const [customTasks, setCustomTasks] = useState('MatriculaBatch, CalculoPromedios, SincronizacionCloud, NotificacionesPush');

  // Audit log state
  const [auditLog, setAuditLog] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  useEffect(() => {
    fetchNativeInfo();
    fetchAuditLog();
  }, []);

  async function fetchNativeInfo() {
    setLoadingNative(true);
    try {
      const res = await apiClient.get(`/system/native-info?payload=${encodeURIComponent(payloadText)}`);
      setNativeInfo(res.data);
    } catch (err) {
      addToast(extractErrorMessage(err), 'error');
    } finally {
      setLoadingNative(false);
    }
  }

  async function runVirtualThreads() {
    const taskList = customTasks
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    if (taskList.length === 0) {
      addToast(t('dashboard.enterAtLeastOne'), 'error');
      return;
    }

    if (taskList.length > 20) {
      addToast('Máximo 20 tareas concurrentes permitidas para proteger el servidor', 'warning');
      return;
    }

    setRunningVt(true);
    setVtResults([]);
    setActiveTasks(taskList);
    setElapsedMs(0);
    setConcurrencyStats(null);

    const startTime = Date.now();
    const timerInterval = setInterval(() => {
      setElapsedMs(Date.now() - startTime);
    }, 50);

    try {
      const res = await apiClient.post('/system/virtual-threads/run', taskList);
      const results = res.data || [];
      const totalElapsed = Date.now() - startTime;
      clearInterval(timerInterval);
      setElapsedMs(totalElapsed);
      setVtResults(results);

      // Calculate sequential vs parallel speedup
      const sumSequentialMs = results.reduce((acc, r) => acc + (r.durationMs || 1400), 0);
      setConcurrencyStats({
        totalTasks: results.length,
        concurrentTimeMs: totalElapsed,
        sequentialEstimatedMs: sumSequentialMs,
        speedup: (sumSequentialMs / Math.max(totalElapsed, 1)).toFixed(1),
      });

      addToast(t('dashboard.executedToast', { count: results.length, time: (totalElapsed / 1000).toFixed(1) }), 'success');
      // Refresh audit log as tasks may emit events
      fetchAuditLog();
    } catch (err) {
      clearInterval(timerInterval);
      addToast(extractErrorMessage(err), 'error');
    } finally {
      clearInterval(timerInterval);
      setRunningVt(false);
    }
  }

  async function fetchAuditLog() {
    setLoadingAudit(true);
    try {
      const res = await apiClient.get('/courses/audit-log');
      setAuditLog(res.data || []);
    } catch (err) {
      // Endpoint may be empty if no events yet
      console.warn('Audit log fetch:', err);
    } finally {
      setLoadingAudit(false);
    }
  }

  return (
    <div>
      {/* Top Banner */}
      <div className="glass-card mb-4" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(6, 182, 212, 0.1))', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="brand-pill">{t('dashboard.pill')}</span>
              <span className="status-indicator online">
                <span className="status-dot"></span>
                <span>{t('dashboard.active')}</span>
              </span>
            </div>
            <h3 style={{ margin: 0, fontWeight: 700, color: '#f8fafc' }}>
              {t('dashboard.title')}
            </h3>
            <p className="text-muted small mb-0 mt-1">
              {t('dashboard.subtitle')}
            </p>
          </div>

          <div className="d-flex gap-2">
            <button className="btn-modern-secondary" onClick={() => { fetchNativeInfo(); fetchAuditLog(); }}>
              {t('dashboard.refreshAll')}
            </button>
          </div>
        </div>
      </div>

      {/* Row 1: FFM API / Native Bridge */}
      <div className="glass-card mb-4">
        <div className="glass-card-header">
          <h4 className="glass-card-title">
            <span>{t('dashboard.ffmTitle')}</span>
            <span className="brand-pill">{t('dashboard.ffmPill')}</span>
          </h4>
          <button className="btn-modern-cyan" onClick={fetchNativeInfo} disabled={loadingNative}>
            {loadingNative ? t('dashboard.calculating') : t('dashboard.recalculate')}
          </button>
        </div>

        <div className="mb-3">
          <label className="form-label text-muted small">{t('dashboard.payloadLabel')}</label>
          <div className="input-group">
            <input
              className="form-control modern-input"
              value={payloadText}
              onChange={e => setPayloadText(e.target.value)}
              placeholder={t('dashboard.payloadPlaceholder')}
              maxLength={256}
            />
          </div>
        </div>

        {nativeInfo ? (
          <div className="row g-3">
            <div className="col-md-4 col-sm-6">
              <div className="metric-card">
                <div className="metric-label">{t('dashboard.processArch')}</div>
                <div className="metric-value" style={{ fontSize: '1.2rem', color: '#a5b4fc' }}>
                  PID {nativeInfo.nativeProcessId || nativeInfo.processId || 1}
                </div>
                <div className="metric-sub">{nativeInfo.osName || nativeInfo.operatingSystem || 'Linux'} ({nativeInfo.osArch})</div>
              </div>
            </div>

            <div className="col-md-8 col-sm-12">
              <div className="metric-card">
                <div className="metric-label">{t('dashboard.digestLabel')}</div>
                <div className="font-monospace small text-truncate" style={{ color: '#10b981', background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: 6 }}>
                  {nativeInfo.offHeapDigest || nativeInfo.sha256OffHeapDigest}
                </div>
                <div className="metric-sub">{t('dashboard.digestSub')}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-3 text-muted">{t('dashboard.loadingNative')}</div>
        )}
      </div>

      {/* Row 2: Virtual Threads Benchmark */}
      <div className="glass-card mb-4">
        <div className="glass-card-header">
          <h4 className="glass-card-title">
            <span>{t('dashboard.loomTitle')}</span>
            <span className="brand-pill">{t('dashboard.loomPill')}</span>
          </h4>
          <button className="btn-modern-primary d-flex align-items-center gap-2" onClick={runVirtualThreads} disabled={runningVt}>
            {runningVt && <span className="vt-spinner" />}
            {runningVt ? t('dashboard.runningBtn') : t('dashboard.triggerBtn')}
          </button>
        </div>

        <div className="mb-3">
          <label className="form-label text-muted small">{t('dashboard.tasksLabel')}</label>
          <input
            className="form-control modern-input"
            value={customTasks}
            onChange={e => setCustomTasks(e.target.value)}
            disabled={runningVt}
            maxLength={300}
          />
        </div>

        {/* Live Parallel Execution Monitor while running */}
        {runningVt && (
          <div className="mb-4 p-3 rounded" style={{ background: 'rgba(6, 182, 212, 0.04)', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
              <div className="d-flex align-items-center gap-2">
                <span className="status-dot" style={{ background: '#06b6d4' }}></span>
                <strong style={{ color: '#67e8f9', fontSize: '0.95rem' }}>
                  {t('dashboard.liveMonitorTitle', { count: activeTasks.length })}
                </strong>
                <span className="badge-glow-indigo font-monospace">
                  {t('dashboard.loomActive')}
                </span>
              </div>
              <div className="font-monospace small" style={{ color: '#a5b4fc', background: 'rgba(0,0,0,0.3)', padding: '4px 10px', borderRadius: 6 }}>
                ⏱️ {t('dashboard.elapsedTime', { time: (elapsedMs / 1000).toFixed(1) })}
              </div>
            </div>

            <div className="row g-3">
              {activeTasks.map((taskName, idx) => (
                <div key={idx} className="col-md-6 col-sm-12">
                  <div className="vt-live-card active">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span style={{ fontWeight: 600, color: '#f8fafc' }}>{taskName}</span>
                      <span className="d-flex align-items-center gap-1 small" style={{ color: '#06b6d4' }}>
                        <span className="vt-spinner" />
                        <span>{t('dashboard.taskRunning')}</span>
                      </span>
                    </div>
                    <div className="vt-progress-bar mb-2"></div>
                    <div className="d-flex justify-content-between align-items-center text-dim small">
                      <span>{t('dashboard.virtualThreadId', { id: idx + 1 })}</span>
                      <span className="text-emerald">{t('dashboard.nonBlocking')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Concurrency Stats banner after completion */}
        {!runningVt && concurrencyStats && (
          <div className="mb-4 p-3 rounded" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <span className="badge-role student" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.4)' }}>
                    ✓ {t('dashboard.completedBannerTitle')}
                  </span>
                  <span style={{ color: '#f8fafc', fontWeight: 600 }}>
                    {t('dashboard.tasksProcessed', { count: concurrencyStats.totalTasks })}
                  </span>
                </div>
                <div className="small text-muted">
                  {t('dashboard.timingComparison', {
                    concurrent: (concurrencyStats.concurrentTimeMs / 1000).toFixed(2),
                    sequential: (concurrencyStats.sequentialEstimatedMs / 1000).toFixed(2),
                    speedup: concurrencyStats.speedup,
                  })}
                </div>
              </div>
              <span className="badge-glow-indigo font-monospace small">
                {t('dashboard.zeroOsThreads')}
              </span>
            </div>
          </div>
        )}

        {/* Results Table */}
        {vtResults.length > 0 && (
          <div className="table-responsive">
            <table className="table table-dark table-hover mb-0" style={{ background: 'transparent' }}>
              <thead>
                <tr className="text-muted small" style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th>{t('dashboard.thTask')}</th>
                  <th>{t('dashboard.thThread')}</th>
                  <th>{t('dashboard.thType')}</th>
                  <th>{t('dashboard.thDuration')}</th>
                  <th>{t('dashboard.thStatus')}</th>
                </tr>
              </thead>
              <tbody>
                {vtResults.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ fontWeight: 600, color: '#f8fafc' }}>{r.taskName}</td>
                    <td>
                      <span className="badge-glow-indigo font-monospace small">
                        {r.threadInfo || r.threadName}
                      </span>
                    </td>
                    <td>
                      <span className="badge-role student" style={{ fontSize: '0.75rem' }}>
                        {r.isVirtual ? t('dashboard.virtualThreadTag') : 'Platform Thread'}
                      </span>
                    </td>
                    <td style={{ color: '#a5b4fc', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                      {r.durationMs != null ? `${r.durationMs} ms` : t('dashboard.completedTag')}
                    </td>
                    <td style={{ color: '#10b981', fontSize: '0.88rem' }}>
                      <span className="d-flex align-items-center gap-1">
                        <span>✓</span>
                        <span>{r.status || t('dashboard.completedTag')}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Row 3: Pattern Matching & Audit Log */}
      <div className="glass-card">
        <div className="glass-card-header">
          <h4 className="glass-card-title">
            <span>{t('dashboard.auditTitle')}</span>
            <span className="brand-pill">{t('dashboard.auditPill')}</span>
          </h4>
          <button className="btn-modern-secondary" onClick={fetchAuditLog} disabled={loadingAudit}>
            {loadingAudit ? t('dashboard.loadingLog') : t('dashboard.updateLog')}
          </button>
        </div>

        {auditLog.length === 0 ? (
          <div className="p-3 text-center text-muted">
            {t('dashboard.emptyAudit')}
          </div>
        ) : (
          <div className="code-console">
            {auditLog.map((log, index) => (
              <div key={index} style={{ marginBottom: 6, color: '#cbd5e1' }}>
                <span style={{ color: '#06b6d4', marginRight: 8 }}>[{index + 1}]</span>
                <span>{log}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
