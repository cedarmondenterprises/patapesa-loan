/* eslint-disable react-hooks/set-state-in-effect,react-hooks/exhaustive-deps */
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Brand from '../components/Brand';
import { api, ApiError } from '../lib/api';

type Row = Record<string, string | string[] | number | null>;
type Metrics = Record<string, string>;
type Dialog = {
  title: string;
  copy: string;
  label: string;
  danger?: boolean;
  reason?: boolean;
  run: (reason: string) => Promise<void>;
};
const groups = [
  { label: 'Workspace', items: ['Overview', 'Registrations', 'Users & roles'] },
  { label: 'Lending', items: ['Loan review', 'KYC review', 'Loan ledger'] },
  { label: 'Operations', items: ['Support', 'Audit'] },
];
const money = (v: unknown) => `KES ${Number(v || 0).toLocaleString('en-KE')}`;
const date = (v: unknown) =>
  v
    ? new Date(String(v)).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })
    : '—';

export default function Dashboard() {
  const router = useRouter(),
    [tab, setTab] = useState('Overview'),
    [metrics, setMetrics] = useState<Metrics>({}),
    [users, setUsers] = useState<Row[]>([]),
    [apps, setApps] = useState<Row[]>([]),
    [kyc, setKyc] = useState<Row[]>([]),
    [ledger, setLedger] = useState<Row[]>([]),
    [support, setSupport] = useState<Row[]>([]),
    [audit, setAudit] = useState<Row[]>([]),
    [roles, setRoles] = useState<string[]>([]),
    [permissions, setPermissions] = useState<string[]>([]),
    [message, setMessage] = useState(''),
    [query, setQuery] = useState(''),
    [loading, setLoading] = useState(true),
    [lastSync, setLastSync] = useState<Date | null>(null),
    [dialog, setDialog] = useState<Dialog | null>(null);
  const safe = async (path: string) =>
    api<{ data: Row[] | Metrics }>(path)
      .then((r) => r.data)
      .catch(() => null);
  async function load(background = false) {
    try {
      if (!background) {
        const me = await api<{ data: { roles: string[]; permissions: string[] } }>('/admin/me');
        setRoles(me.data.roles);
        setPermissions(me.data.permissions);
      }
      const [m, u, a, k] = await Promise.all([
        safe('/admin/dashboard'),
        safe('/admin/users'),
        safe('/admin/applications'),
        safe('/admin/kyc'),
      ]);
      if (m) setMetrics(m as Metrics);
      if (u) setUsers(u as Row[]);
      if (a) setApps(a as Row[]);
      if (k) setKyc(k as Row[]);
      if (!background) {
        const [l, s, au] = await Promise.all([
          safe('/admin/ledger'),
          safe('/admin/support'),
          safe('/admin/audit'),
        ]);
        if (l) setLedger(l as Row[]);
        if (s) setSupport(s as Row[]);
        if (au) setAudit(au as Row[]);
      }
      setLastSync(new Date());
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await router.replace('/');
        return;
      }
      setMessage(error instanceof Error ? error.message : 'Unable to load dashboard');
    } finally {
      if (!background) setLoading(false);
    }
  }
  useEffect(() => {
    void load();
    const refresh = () => {
      if (!document.hidden && navigator.onLine) void load(true);
    };
    const interval = window.setInterval(refresh, 30_000);
    window.addEventListener('online', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('online', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);
  async function act(path: string, method: string, body: Row = {}, success = 'Action completed') {
    try {
      await api(path, { method, body: JSON.stringify(body) });
      setMessage(success);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Action failed');
    }
  }
  function ask(config: Dialog) {
    setDialog(config);
  }
  function openRegistrationPdf(id: Row[string]) {
    window.open(`/api/admin/users/${id}/registration.pdf`, '_blank', 'noopener,noreferrer');
  }
  async function signout() {
    await api('/auth/logout', { method: 'POST' }).catch(() => undefined);
    await router.push('/');
  }
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return users.filter(
      (u) => !q || `${u.firstName} ${u.lastName} ${u.email} ${u.phone}`.toLowerCase().includes(q),
    );
  }, [users, query]);
  const counts: Record<string, number> = {
    Registrations: users.filter((u) => u.registrationReference).length,
    'Loan review': apps.length,
    'KYC review': kyc.length,
    Support: support.filter((s) => ['OPEN', 'IN_PROGRESS'].includes(String(s.status))).length,
  };
  function exportCsv() {
    const keys = [
      'loanNumber',
      'firstName',
      'lastName',
      'email',
      'principal',
      'interest',
      'fees',
      'totalPayable',
      'paid',
      'outstanding',
      'overdue',
      'status',
      'disbursedAt',
      'maturityDate',
    ];
    const csv = [
      keys.join(','),
      ...ledger.map((r) =>
        keys.map((k) => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(','),
      ),
    ].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `patapesa-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  return (
    <div className="shell">
      <aside className="sidebar">
        <Brand />
        {groups.map((g) => (
          <div className="nav-group" key={g.label}>
            <span className="nav-label">{g.label}</span>
            {g.items.map((x) => (
              <button
                key={x}
                className={tab === x ? 'active' : ''}
                onClick={() => {
                  setTab(x);
                  setQuery('');
                }}
              >
                <span className="nav-text">
                  <NavIcon name={x} />
                  {x}
                </span>
                {counts[x] ? <span className="nav-count">{counts[x]}</span> : null}
              </button>
            ))}
          </div>
        ))}
        <div className="sidebar-footer">
          <div className="staff-card">
            <span className="avatar">{(roles[0] || 'S').slice(0, 2)}</span>
            <div>
              <strong>{(roles[0] || 'STAFF').replace('_', ' ')}</strong>
              <small>Active session</small>
            </div>
          </div>
          <button onClick={() => void signout()}>Sign out</button>
        </div>
      </aside>
      <main className="content">
        <header className="top">
          <div>
            <p className="overline">PataPesa operations</p>
            <h1>{tab}</h1>
            {lastSync && <small>Live data · updated {lastSync.toLocaleTimeString('en-KE')}</small>}
          </div>
          <span className="role-badge">{(roles[0] || 'STAFF').replace('_', ' ')}</span>
        </header>
        {message && (
          <div className="toast" role="status">
            {message}
          </div>
        )}
        {loading ? (
          <Loading />
        ) : (
          <>
            {tab === 'Overview' && <Overview metrics={metrics} audit={audit} />}
            {tab === 'Registrations' && (
              <>
                <Toolbar value={query} setValue={setQuery} placeholder="Search registrations" />
                <Table
                  heads={['Customer', 'Reference', 'Registered', 'Account', 'Record']}
                  rows={filtered
                    .filter((u) => u.registrationReference)
                    .map((u) => [
                      <Person row={u} key="p" />,
                      u.registrationReference || 'Legacy registration',
                      date(u.createdAt),
                      <Status value={u.status} key="status" />,
                      u.registrationReference ? (
                        <div className="actions" key="pdf">
                          <button onClick={() => openRegistrationPdf(u.id)}>
                            Open / print PDF
                          </button>
                        </div>
                      ) : (
                        'Not available'
                      ),
                    ])}
                />
              </>
            )}
            {tab === 'Users & roles' && (
              <>
                <Toolbar
                  value={query}
                  setValue={setQuery}
                  placeholder="Search name, email or phone"
                />
                <Table
                  heads={['User', 'Status', 'Last active', 'Role', 'Manage']}
                  rows={filtered.map((u) => [
                    <Person row={u} key="p" />,
                    <Status value={u.status} key="s" />,
                    date(u.lastLogin),
                    String(u.roles || '—'),
                    <div className="actions" key="m">
                      {u.registrationReference && (
                        <button onClick={() => openRegistrationPdf(u.id)}>Application PDF</button>
                      )}
                      <button
                        className={u.status === 'ACTIVE' ? 'danger' : ''}
                        onClick={() =>
                          ask({
                            title:
                              u.status === 'ACTIVE'
                                ? 'Suspend this account?'
                                : 'Activate this account?',
                            copy: `This will immediately ${u.status === 'ACTIVE' ? 'end the user’s active sessions and block access' : 'allow the user to sign in'}.`,
                            label: u.status === 'ACTIVE' ? 'Suspend account' : 'Activate account',
                            danger: u.status === 'ACTIVE',
                            run: () =>
                              act(
                                `/admin/users/${u.id}/status`,
                                'PATCH',
                                { status: u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' },
                                'Account status updated',
                              ),
                          })
                        }
                      >
                        {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      </button>
                      {permissions.includes('roles:assign') && (
                        <select
                          aria-label={`Role for ${u.email}`}
                          defaultValue={Array.isArray(u.roles) ? u.roles[0] || 'NONE' : 'NONE'}
                          onChange={(e) =>
                            void act(
                              `/admin/users/${u.id}/role`,
                              'PUT',
                              { role: e.target.value },
                              'Staff role updated',
                            )
                          }
                        >
                          <option>NONE</option>
                          <option>STAFF</option>
                          <option>MANAGER</option>
                          <option>SUPER_ADMIN</option>
                        </select>
                      )}
                    </div>,
                  ])}
                />
              </>
            )}
            {tab === 'Loan review' && (
              <Table
                heads={['Reference', 'Customer', 'Request', 'Eligibility', 'Status', 'Decision']}
                rows={apps.map((a) => [
                  a.applicationNumber,
                  <Person row={a} key="p" />,
                  `${a.product} · ${String(a.purposeCategory || 'OTHER').replaceAll('_', ' ')}\n${money(a.amount)} · ${a.term} months · ${money(a.monthlyPayment)}/month\n${a.purpose}\nRepayment: ${a.repaymentSource || 'Legacy record'}`,
                  `Age: ${a.age ?? 'Missing'}\nIncome: ${String(a.incomeRange || 'Missing').replaceAll('_', ' ')}\nExisting debt: ${money(a.existingMonthlyDebt)}\nCommitment ratio: ${(Number(a.affordabilityRatio || 0) * 100).toFixed(1)}%\nKYC: ${String(a.kycStatus || 'NOT_SUBMITTED').replaceAll('_', ' ')}`,
                  <Status value={a.status} key="s" />,
                  <div className="actions" key="d">
                    {a.status !== 'APPROVED' ? (
                      <>
                        <button
                          onClick={() =>
                            void act(
                              `/admin/applications/${a.id}`,
                              'PATCH',
                              { status: 'UNDER_REVIEW' },
                              'Application moved to review',
                            )
                          }
                        >
                          Start review
                        </button>
                        <button
                          className="approve"
                          onClick={() =>
                            ask({
                              title: 'Approve this loan application?',
                              copy: `Approve ${money(a.amount)} for ${a.firstName} ${a.lastName}. Approved KYC and an active account are required.`,
                              label: 'Approve application',
                              run: () =>
                                act(
                                  `/admin/applications/${a.id}`,
                                  'PATCH',
                                  { status: 'APPROVED' },
                                  'Loan application approved',
                                ),
                            })
                          }
                        >
                          Approve
                        </button>
                        <button
                          className="danger"
                          onClick={() =>
                            ask({
                              title: 'Reject this application?',
                              copy: 'Provide a clear reason. It will be retained with the application record.',
                              label: 'Reject application',
                              danger: true,
                              reason: true,
                              run: (r) =>
                                act(
                                  `/admin/applications/${a.id}`,
                                  'PATCH',
                                  { status: 'REJECTED', reason: r },
                                  'Loan application rejected',
                                ),
                            })
                          }
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <button
                        className="approve"
                        onClick={() =>
                          ask({
                            title: 'Confirm external disbursement?',
                            copy: `Only continue after confirming that ${money(a.amount)} was successfully sent outside PataPesa. This creates the loan ledger and repayment schedule.`,
                            label: 'Record disbursement',
                            run: () =>
                              act(
                                `/admin/applications/${a.id}/disburse`,
                                'POST',
                                {},
                                'Disbursement recorded',
                              ),
                          })
                        }
                      >
                        Record disbursement
                      </button>
                    )}
                  </div>,
                ])}
              />
            )}
            {tab === 'KYC review' && (
              <Table
                heads={['Customer', 'Identity', 'Submitted', 'Decision']}
                rows={kyc.map((k) => [
                  <Person row={k} key="p" />,
                  `${String(k.idType).replaceAll('_', ' ')}\n${k.idNumber}`,
                  date(k.createdAt),
                  <div className="actions" key="d">
                    <button
                      className="approve"
                      onClick={() =>
                        ask({
                          title: 'Approve identity verification?',
                          copy: `Confirm that the submitted ${String(k.idType).replaceAll('_', ' ').toLowerCase()} belongs to ${k.firstName} ${k.lastName}.`,
                          label: 'Approve KYC',
                          run: () =>
                            act(
                              `/admin/kyc/${k.id}`,
                              'PATCH',
                              { status: 'APPROVED' },
                              'Identity verification approved',
                            ),
                        })
                      }
                    >
                      Approve
                    </button>
                    <button
                      className="danger"
                      onClick={() =>
                        ask({
                          title: 'Reject identity verification?',
                          copy: 'Enter the reason the customer must correct before resubmitting.',
                          label: 'Reject KYC',
                          danger: true,
                          reason: true,
                          run: (r) =>
                            act(
                              `/admin/kyc/${k.id}`,
                              'PATCH',
                              { status: 'REJECTED', reason: r },
                              'Identity verification rejected',
                            ),
                        })
                      }
                    >
                      Reject
                    </button>
                  </div>,
                ])}
              />
            )}
            {tab === 'Loan ledger' && (
              <>
                <div className="toolbar">
                  <button className="small" onClick={exportCsv}>
                    Export CSV
                  </button>
                  <span className="muted">{ledger.length} loan records</span>
                </div>
                <Table
                  heads={[
                    'Loan',
                    'Customer',
                    'Principal',
                    'Interest',
                    'Fees',
                    'Total',
                    'Paid',
                    'Outstanding',
                    'Overdue',
                    'Status',
                    'Maturity',
                  ]}
                  rows={ledger.map((l) => [
                    l.loanNumber,
                    <Person row={l} key="p" />,
                    money(l.principal),
                    money(l.interest),
                    money(l.fees),
                    money(l.totalPayable),
                    money(l.paid),
                    money(l.outstanding),
                    money(l.overdue),
                    <Status value={l.status} key="s" />,
                    date(l.maturityDate),
                  ])}
                />
              </>
            )}
            {tab === 'Support' && (
              <Table
                heads={['Reference', 'Customer', 'Subject', 'Message', 'Status', 'Manage']}
                rows={support.map((s) => [
                  s.reference,
                  <Person row={s} key="p" />,
                  s.subject,
                  s.message,
                  <Status value={s.status} key="s" />,
                  <select
                    key="m"
                    value={String(s.status)}
                    onChange={(e) =>
                      void act(
                        `/admin/support/${s.id}`,
                        'PATCH',
                        { status: e.target.value },
                        'Support request updated',
                      )
                    }
                  >
                    <option>OPEN</option>
                    <option>IN_PROGRESS</option>
                    <option>RESOLVED</option>
                    <option>CLOSED</option>
                  </select>,
                ])}
              />
            )}
            {tab === 'Audit' && (
              <Table
                heads={['Time', 'Actor', 'Action', 'Resource', 'IP address']}
                rows={audit.map((a) => [
                  date(a.createdAt),
                  a.actor || 'System',
                  String(a.action).replaceAll('_', ' '),
                  `${a.resourceType || ''}\n${a.resourceId || ''}`,
                  a.ipAddress || '—',
                ])}
              />
            )}
          </>
        )}
      </main>
      {dialog && <ActionDialog dialog={dialog} close={() => setDialog(null)} />}
    </div>
  );
}

function Overview({ metrics, audit }: { metrics: Metrics; audit: Row[] }) {
  const outstanding = Number(metrics.outstanding || 0),
    overdue = Number(metrics.overdue || 0),
    ratio = outstanding ? Math.min(100, (overdue / outstanding) * 100) : 0;
  return (
    <>
      <div className="overview-heading">
        <div>
          <p className="overline">Today’s work</p>
          <h2>Clear the queues that affect customers.</h2>
        </div>
        <p>Registration, identity and credit decisions stay together in one operating view.</p>
      </div>
      <div className="cards">
        {[
          ['Active users', metrics.activeUsers],
          ['Registrations · 7 days', metrics.recentRegistrations],
          ['Applications to review', metrics.pendingApplications],
          ['KYC to review', metrics.pendingKyc],
          ['Total disbursed', money(metrics.totalDisbursed)],
          ['Total repaid', money(metrics.totalRepaid)],
          ['Outstanding', money(metrics.outstanding)],
          ['Overdue', money(metrics.overdue)],
          ['Contracted interest', money(metrics.contractedInterest)],
          ['Processing fees', money(metrics.processingFees)],
          ['Open support', metrics.openSupport],
        ].map(([x, v]) => (
          <div className="card" key={x}>
            <span>{x}</span>
            <strong>{v || 0}</strong>
          </div>
        ))}
      </div>
      <div className="overview-grid">
        <section className="panel">
          <p className="overline">Portfolio health</p>
          <h2>Collections position</h2>
          <div className="progress-row">
            <div>
              <span>Overdue share of outstanding</span>
              <strong>{ratio.toFixed(1)}%</strong>
            </div>
            <div className="track">
              <span style={{ width: `${ratio}%` }} />
            </div>
          </div>
          <p>Figures are calculated from completed payments and live repayment schedules.</p>
        </section>
        <section className="panel">
          <p className="overline">Recent control activity</p>
          <h2>Latest changes</h2>
          {audit.slice(0, 4).map((a) => (
            <div
              key={String(a.id)}
              style={{ padding: '10px 0', borderBottom: '1px solid #e6eae8', fontSize: 12 }}
            >
              <strong>{String(a.action).replaceAll('_', ' ')}</strong>
              <small className="muted" style={{ display: 'block', marginTop: 4 }}>
                {a.actor || 'System'} · {date(a.createdAt)}
              </small>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
function NavIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    Overview: 'M4 4h6v6H4zM14 4h6v10h-6zM4 14h6v6H4zM14 18h6v2h-6z',
    Registrations: 'M15 20a6 6 0 0 0-12 0M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M18 8v6M15 11h6',
    'Users & roles':
      'M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M18 8l2 2 3-3',
    'Loan review': 'M5 3h14v18H5zM8 8h8M8 12h8M8 16h4',
    'KYC review': 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10M9 12l2 2 4-5',
    'Loan ledger': 'M4 3h16v18H4zM8 7h8M8 11h8M8 15h3M14 15h2',
    Support: 'M21 15a4 4 0 0 1-4 4H8l-5 3v-7a7 7 0 0 1-1-4 9 9 0 0 1 9-9h1a9 9 0 0 1 9 9z',
    Audit: 'M12 3a9 9 0 1 0 9 9M12 7v5l3 2M17 3h4v4',
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}
function Toolbar({
  value,
  setValue,
  placeholder,
}: {
  value: string;
  setValue: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="toolbar">
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
function Person({ row }: { row: Row }) {
  return (
    <div>
      <strong>{row.name || `${row.firstName || ''} ${row.lastName || ''}`}</strong>
      {row.email && (
        <small className="muted" style={{ display: 'block', marginTop: 4 }}>
          {row.email}
        </small>
      )}
    </div>
  );
}
function Status({ value }: { value: Row[string] }) {
  const status = String(value || 'unknown').toLowerCase();
  return <span className={`status status-${status}`}>{status.replaceAll('_', ' ')}</span>;
}
function Loading() {
  return (
    <div className="cards">
      {Array.from({ length: 8 }, (_, i) => (
        <div className="card" key={i}>
          <span>Loading</span>
          <strong>—</strong>
        </div>
      ))}
    </div>
  );
}
function Table({
  heads,
  rows,
}: {
  heads: string[];
  rows: (string | number | null | ReactNode)[][];
}) {
  return (
    <div className="panel">
      {rows.length ? (
        <table>
          <thead>
            <tr>
              {heads.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (
                  <td key={j} style={{ whiteSpace: 'pre-line' }}>
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="empty">
          <span />
          <strong>No records here</strong>
          <small>This queue is currently clear.</small>
        </div>
      )}
    </div>
  );
}
function ActionDialog({ dialog, close }: { dialog: Dialog; close: () => void }) {
  const [reason, setReason] = useState(''),
    [busy, setBusy] = useState(false);
  async function confirm() {
    if (dialog.reason && !reason.trim()) return;
    setBusy(true);
    await dialog.run(reason.trim());
    setBusy(false);
    close();
  }
  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="modal">
        <div className="modal-head">
          <p className="overline">Confirm action</p>
          <h2 id="dialog-title">{dialog.title}</h2>
        </div>
        <div className="modal-body">
          {dialog.copy}
          {dialog.reason && (
            <textarea
              autoFocus
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter a clear reason"
              maxLength={1000}
            />
          )}
        </div>
        <div className="modal-actions">
          <button className="cancel" onClick={close}>
            Cancel
          </button>
          <button
            className={dialog.danger ? 'danger' : 'primary'}
            disabled={busy || Boolean(dialog.reason && !reason.trim())}
            onClick={() => void confirm()}
          >
            {busy ? 'Working…' : dialog.label}
          </button>
        </div>
      </div>
    </div>
  );
}
