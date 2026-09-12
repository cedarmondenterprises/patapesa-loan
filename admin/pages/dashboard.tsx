/* eslint-disable react-hooks/set-state-in-effect,react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api, ApiError } from '../lib/api';
type Row = Record<string, string | string[] | number | null>;
type Metrics = Record<string, string>;
const tabs = [
  'Overview',
  'Registrations',
  'Users & roles',
  'Loan review',
  'KYC review',
  'Loan ledger',
  'Support',
  'Audit',
];
const money = (v: unknown) => `KES ${Number(v || 0).toLocaleString()}`;
const date = (v: unknown) => (v ? new Date(String(v)).toLocaleString() : '—');
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
    [message, setMessage] = useState('');
  const safe = async (path: string) =>
    api<{ data: Row[] | Metrics }>(path)
      .then((r) => r.data)
      .catch(() => [] as Row[]);
  async function load() {
    try {
      const me = await api<{ data: { roles: string[]; permissions: string[] } }>('/admin/me');
      setRoles(me.data.roles);
      setPermissions(me.data.permissions);
      const [m, u, a, k, l, s, au] = await Promise.all([
        safe('/admin/dashboard'),
        safe('/admin/users'),
        safe('/admin/applications'),
        safe('/admin/kyc'),
        safe('/admin/ledger'),
        safe('/admin/support'),
        safe('/admin/audit'),
      ]);
      setMetrics(m as Metrics);
      setUsers(u as Row[]);
      setApps(a as Row[]);
      setKyc(k as Row[]);
      setLedger(l as Row[]);
      setSupport(s as Row[]);
      setAudit(au as Row[]);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await router.replace('/');
        return;
      }
      setMessage(error instanceof Error ? error.message : 'Unable to load dashboard');
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function act(path: string, method: string, body: Row = {}) {
    try {
      await api(path, { method, body: JSON.stringify(body) });
      setMessage('Action completed');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Action failed');
    }
  }
  async function signout() {
    await api('/auth/logout', { method: 'POST' }).catch(() => undefined);
    await router.push('/');
  }
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
        <h2>PataPesa Admin</h2>
        {tabs.map((x) => (
          <button key={x} className={tab === x ? 'active' : ''} onClick={() => setTab(x)}>
            {x}
          </button>
        ))}
        <button onClick={() => void signout()}>Sign out</button>
      </aside>
      <main className="content">
        <div className="top">
          <div>
            <small>SECURE OPERATIONS</small>
            <h1>{tab}</h1>
          </div>
          <span className="badge">{(roles[0] || 'STAFF').replace('_', ' ')}</span>
        </div>
        {message && <p className="panel">{message}</p>}
        {tab === 'Overview' && (
          <>
            <div className="cards">
              {[
                ['Active users', metrics.activeUsers],
                ['Pending registrations', metrics.pendingRegistrations],
                ['Pending applications', metrics.pendingApplications],
                ['Pending KYC', metrics.pendingKyc],
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
            <div className="panel">
              <h2>Operational snapshot</h2>
              <p>
                This dashboard is calculated from the live users, loans, repayment schedules and
                completed payments in PostgreSQL.
              </p>
            </div>
          </>
        )}
        {tab === 'Registrations' && (
          <Table
            heads={['Customer', 'Contact', 'Registered', 'Action']}
            rows={users
              .filter((u) => u.status === 'PENDING')
              .map((u) => [
                `${u.firstName} ${u.lastName}`,
                `${u.email}\n${u.phone}`,
                date(u.createdAt),
                <div className="actions" key="a">
                  <button
                    className="approve"
                    onClick={() =>
                      void act(`/admin/users/${u.id}/status`, 'PATCH', { status: 'ACTIVE' })
                    }
                  >
                    Approve
                  </button>
                  <button
                    onClick={() =>
                      void act(`/admin/users/${u.id}/status`, 'PATCH', { status: 'REJECTED' })
                    }
                  >
                    Reject
                  </button>
                </div>,
              ])}
          />
        )}
        {tab === 'Users & roles' && (
          <Table
            heads={['User', 'Status', 'Last active', 'Roles', 'Manage']}
            rows={users.map((u) => [
              `${u.firstName} ${u.lastName}\n${u.email}`,
              <span className="badge" key="s">
                {u.status}
              </span>,
              date(u.lastLogin),
              String(u.roles || '—'),
              <div className="actions" key="m">
                <button
                  onClick={() =>
                    void act(`/admin/users/${u.id}/status`, 'PATCH', {
                      status: u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE',
                    })
                  }
                >
                  {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                </button>
                {permissions.includes('roles:assign') && (
                  <select
                    defaultValue={Array.isArray(u.roles) ? u.roles[0] || 'NONE' : 'NONE'}
                    onChange={(e) =>
                      void act(`/admin/users/${u.id}/role`, 'PUT', { role: e.target.value })
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
        )}
        {tab === 'Loan review' && (
          <Table
            heads={['Reference', 'Customer', 'Request', 'Status', 'Decision']}
            rows={apps.map((a) => [
              a.applicationNumber,
              `${a.firstName} ${a.lastName}\n${a.email}`,
              `${a.product}\n${money(a.amount)} · ${a.term} months\n${a.purpose}`,
              <span className="badge" key="s">
                {a.status}
              </span>,
              <div className="actions" key="d">
                {a.status !== 'APPROVED' ? (
                  <>
                    <button
                      onClick={() =>
                        void act(`/admin/applications/${a.id}`, 'PATCH', { status: 'UNDER_REVIEW' })
                      }
                    >
                      Reviewing
                    </button>
                    <button
                      className="approve"
                      onClick={() =>
                        void act(`/admin/applications/${a.id}`, 'PATCH', { status: 'APPROVED' })
                      }
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Rejection reason');
                        if (reason)
                          void act(`/admin/applications/${a.id}`, 'PATCH', {
                            status: 'REJECTED',
                            reason,
                          });
                      }}
                    >
                      Reject
                    </button>
                  </>
                ) : (
                  <button
                    className="approve"
                    onClick={() =>
                      confirm(
                        'Confirm funds were sent externally and record this loan as disbursed?',
                      ) && void act(`/admin/applications/${a.id}/disburse`, 'POST')
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
              `${k.firstName} ${k.lastName}\n${k.email}`,
              `${k.idType}: ${k.idNumber}`,
              date(k.createdAt),
              <div className="actions" key="d">
                <button
                  className="approve"
                  onClick={() => void act(`/admin/kyc/${k.id}`, 'PATCH', { status: 'APPROVED' })}
                >
                  Approve
                </button>
                <button
                  onClick={() => {
                    const reason = prompt('Rejection reason');
                    if (reason)
                      void act(`/admin/kyc/${k.id}`, 'PATCH', { status: 'REJECTED', reason });
                  }}
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
            </div>
            <Table
              heads={[
                'Loan',
                'Customer',
                'Principal',
                'Interest',
                'Fees',
                'Total payable',
                'Paid',
                'Outstanding',
                'Overdue',
                'Status',
                'Maturity',
              ]}
              rows={ledger.map((l) => [
                l.loanNumber,
                `${l.firstName} ${l.lastName}\n${l.email}`,
                money(l.principal),
                money(l.interest),
                money(l.fees),
                money(l.totalPayable),
                money(l.paid),
                money(l.outstanding),
                money(l.overdue),
                <span className="badge" key="s">
                  {l.status}
                </span>,
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
              `${s.name}\n${s.email}`,
              s.subject,
              s.message,
              <span className="badge" key="s">
                {s.status}
              </span>,
              <select
                key="m"
                defaultValue={String(s.status)}
                onChange={(e) =>
                  void act(`/admin/support/${s.id}`, 'PATCH', { status: e.target.value })
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
            heads={['Time', 'Actor', 'Action', 'Resource', 'IP']}
            rows={audit.map((a) => [
              date(a.createdAt),
              a.actor || 'System',
              a.action,
              `${a.resourceType || ''} ${a.resourceId || ''}`,
              a.ipAddress || '—',
            ])}
          />
        )}
      </main>
    </div>
  );
}
function Table({
  heads,
  rows,
}: {
  heads: string[];
  rows: (string | number | null | React.ReactNode)[][];
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
        <p>No records in this queue.</p>
      )}
    </div>
  );
}
