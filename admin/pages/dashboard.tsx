/* eslint-disable react-hooks/set-state-in-effect,react-hooks/exhaustive-deps */
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Brand from '../components/Brand';
import { api, ApiError } from '../lib/api';

type Row = Record<string, string | string[] | number | boolean | null>;
type Metrics = Record<string, string>;
type Dialog = {
  title: string;
  copy: string;
  label: string;
  danger?: boolean;
  reason?: boolean;
  run: (reason: string) => Promise<boolean>;
};
const groups = [
  { label: 'Workspace', items: ['Overview', 'Registrations', 'Users & roles'] },
  {
    label: 'Lending',
    items: ['Loan review', 'KYC review', 'Repayments', 'Loan products', 'Loan ledger'],
  },
  { label: 'Operations', items: ['Support', 'Tracking & ads', 'Audit'] },
];
const permissionFor: Record<string, string> = {
  Overview: 'dashboard:view',
  Registrations: 'users:view',
  'Users & roles': 'users:view',
  'Loan review': 'loans:review',
  'KYC review': 'kyc:review',
  Repayments: 'payments:review',
  'Loan products': 'products:manage',
  'Loan ledger': 'ledger:view',
  Support: 'support:manage',
  'Tracking & ads': 'ads:manage',
  Audit: 'audit:view',
};
const money = (v: unknown) => `KES ${Number(v || 0).toLocaleString('en-KE')}`;
const date = (v: unknown) =>
  v
    ? new Date(String(v)).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })
    : '—';
const matches = (row: Row, search: string, fields: string[]) => {
  const needle = search.trim().toLowerCase();
  return (
    !needle ||
    fields.some((field) =>
      String(row[field] || '')
        .toLowerCase()
        .includes(needle),
    )
  );
};
const queueAge = (value: Row[string]) => {
  const timestamp = new Date(String(value || '')).getTime();
  if (!Number.isFinite(timestamp)) return 'Unknown age';
  const hours = Math.max(0, Math.floor((Date.now() - timestamp) / 3_600_000));
  if (hours < 1) return 'Less than 1 hour';
  if (hours < 24) return `${hours}h waiting`;
  const days = Math.floor(hours / 24);
  return `${days}d waiting`;
};
const approvalBlockers = (row: Row): string[] =>
  [
    row.userStatus !== 'ACTIVE' ? 'Account not active' : '',
    Number(row.age || 0) < 18 ? 'Age not eligible' : '',
    row.profileComplete !== true ? 'Profile incomplete' : '',
    row.declarationAccepted !== true ? 'Declaration missing' : '',
    Number(row.affordabilityRatio ?? Number.POSITIVE_INFINITY) > 0.5
      ? 'Affordability above 50%'
      : '',
    row.kycStatus !== 'APPROVED' ? `KYC ${String(row.kycStatus || 'not submitted')}` : '',
  ].filter(Boolean);

export default function Dashboard() {
  const router = useRouter(),
    [tab, setTab] = useState('Overview'),
    [metrics, setMetrics] = useState<Metrics>({}),
    [users, setUsers] = useState<Row[]>([]),
    [apps, setApps] = useState<Row[]>([]),
    [kyc, setKyc] = useState<Row[]>([]),
    [payments, setPayments] = useState<Row[]>([]),
    [ledger, setLedger] = useState<Row[]>([]),
    [products, setProducts] = useState<Row[]>([]),
    [support, setSupport] = useState<Row[]>([]),
    [ads, setAds] = useState<Row[]>([]),
    [integrations, setIntegrations] = useState<Row[]>([]),
    [audit, setAudit] = useState<Row[]>([]),
    [roles, setRoles] = useState<string[]>([]),
    [permissions, setPermissions] = useState<string[]>([]),
    [revealedKyc, setRevealedKyc] = useState<Record<string, string>>({}),
    [message, setMessage] = useState(''),
    [query, setQuery] = useState(''),
    [loading, setLoading] = useState(true),
    [lastSync, setLastSync] = useState<Date | null>(null),
    [dialog, setDialog] = useState<Dialog | null>(null);
  const safe = async (path: string) =>
    api<{ data: Row[] | Metrics }>(path)
      .then((r) => r.data)
      .catch((error) => {
        if (error instanceof ApiError && error.status === 401) throw error;
        return null;
      });
  async function load(background = false) {
    try {
      const me = await api<{ data: { roles: string[]; permissions: string[] } }>('/admin/me');
      const currentPermissions = me.data.permissions;
      setRoles(me.data.roles);
      setPermissions(currentPermissions);
      const allowed = (permission: string) => currentPermissions.includes(permission);
      const [m, u, a, k, p, repayments] = await Promise.all([
        allowed('dashboard:view') ? safe('/admin/dashboard') : null,
        allowed('users:view') ? safe('/admin/users') : null,
        allowed('loans:review') ? safe('/admin/applications') : null,
        allowed('kyc:review') ? safe('/admin/kyc') : null,
        allowed('products:manage') ? safe('/admin/products') : null,
        allowed('payments:review') ? safe('/admin/payments') : null,
      ]);
      if (m) setMetrics(m as Metrics);
      if (u) setUsers(u as Row[]);
      if (a) setApps(a as Row[]);
      if (k) setKyc(k as Row[]);
      if (p) setProducts(p as Row[]);
      if (repayments) setPayments(repayments as Row[]);
      if (!background) {
        const [l, s, ad, integrationsData, au] = await Promise.all([
          allowed('ledger:view') ? safe('/admin/ledger') : null,
          allowed('support:manage') ? safe('/admin/support') : null,
          allowed('ads:manage') ? safe('/admin/ads') : null,
          allowed('ads:manage') ? safe('/admin/integrations') : null,
          allowed('audit:view') ? safe('/admin/audit') : null,
        ]);
        if (l) setLedger(l as Row[]);
        if (s) setSupport(s as Row[]);
        if (ad) setAds(ad as Row[]);
        if (integrationsData) setIntegrations(integrationsData as Row[]);
        if (au) setAudit(au as Row[]);
      }
      setLastSync(new Date());
    } catch (error) {
      if (error instanceof ApiError && [401, 403].includes(error.status)) {
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
  useEffect(() => {
    if (permissions.length && !permissions.includes(permissionFor[tab])) {
      const firstAllowed = groups
        .flatMap((group) => group.items)
        .find((item) => permissions.includes(permissionFor[item]));
      if (firstAllowed) setTab(firstAllowed);
    }
  }, [permissions, tab]);
  async function act(
    path: string,
    method: string,
    body: Row = {},
    success = 'Action completed',
  ): Promise<boolean> {
    try {
      await api(path, { method, body: JSON.stringify(body) });
      setMessage(success);
      await load();
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Action failed');
      return false;
    }
  }
  function ask(config: Dialog) {
    setDialog(config);
  }
  function openRegistrationPdf(id: Row[string]) {
    window.open(`/api/admin/users/${id}/registration.pdf`, '_blank', 'noopener,noreferrer');
  }
  async function revealIdentity(id: string) {
    try {
      const result = await api<{ data: { idNumber: string } }>(`/admin/kyc/${id}/identity`);
      setRevealedKyc((current) => ({ ...current, [id]: result.data.idNumber }));
      window.setTimeout(() => {
        setRevealedKyc((current) => {
          const next = { ...current };
          delete next[id];
          return next;
        });
      }, 60_000);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to reveal identity');
    }
  }
  async function signout() {
    try {
      await api('/auth/logout', { method: 'POST' });
      await router.push('/');
    } catch {
      setMessage('Sign out could not be completed. Please try again.');
    }
  }
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return users.filter(
      (u) => !q || `${u.firstName} ${u.lastName} ${u.email} ${u.phone}`.toLowerCase().includes(q),
    );
  }, [users, query]);
  const filteredApps = useMemo(
    () =>
      apps.filter((row) =>
        matches(row, query, [
          'applicationNumber',
          'firstName',
          'lastName',
          'email',
          'product',
          'purposeCategory',
          'status',
        ]),
      ),
    [apps, query],
  );
  const filteredKyc = useMemo(
    () => kyc.filter((row) => matches(row, query, ['firstName', 'lastName', 'email', 'idType'])),
    [kyc, query],
  );
  const filteredPayments = useMemo(
    () =>
      payments.filter((row) =>
        matches(row, query, [
          'reference',
          'loanNumber',
          'firstName',
          'lastName',
          'email',
          'method',
          'status',
        ]),
      ),
    [payments, query],
  );
  const filteredSupport = useMemo(
    () =>
      support.filter((row) =>
        matches(row, query, ['reference', 'name', 'email', 'subject', 'message', 'status']),
      ),
    [support, query],
  );
  const counts: Record<string, number> = {
    Registrations: users.filter((u) => u.registrationReference).length,
    'Loan review': apps.length,
    'KYC review': kyc.length,
    Repayments: payments.filter((payment) =>
      ['PENDING', 'PROCESSING'].includes(String(payment.status)),
    ).length,
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
            {g.items
              .filter((x) => permissions.includes(permissionFor[x]))
              .map((x) => (
                <button
                  key={x}
                  className={tab === x ? 'active' : ''}
                  onClick={() => {
                    setTab(x);
                    setQuery('');
                    if (x !== 'KYC review') setRevealedKyc({});
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
          <div key={tab} className="admin-panel-enter">
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
                            copy: `This will immediately ${
                              u.status === 'ACTIVE'
                                ? 'end the user’s active sessions and block access'
                                : 'allow the user to sign in'
                            }.`,
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
                          value={Array.isArray(u.roles) ? u.roles[0] || 'NONE' : 'NONE'}
                          onChange={(e) => {
                            const role = e.target.value;
                            ask({
                              title:
                                role === 'NONE'
                                  ? 'Remove staff access?'
                                  : `Assign ${role.replace('_', ' ')} role?`,
                              copy:
                                role === 'NONE'
                                  ? `Remove all staff access from ${u.email}. Their customer account will remain available.`
                                  : `Give ${u.email} the permissions attached to the ${role.replace(
                                      '_',
                                      ' ',
                                    )} role.`,
                              label: role === 'NONE' ? 'Remove staff access' : 'Assign role',
                              danger: role === 'NONE' || role === 'SUPER_ADMIN',
                              run: () =>
                                act(
                                  `/admin/users/${u.id}/role`,
                                  'PUT',
                                  { role },
                                  'Staff role updated',
                                ),
                            });
                          }}
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
              <>
                <Toolbar value={query} setValue={setQuery} placeholder="Search loan queue" />
                <Table
                  heads={['Reference', 'Customer', 'Request', 'Eligibility', 'Status', 'Decision']}
                  rows={filteredApps.map((a) => {
                    const blockers = approvalBlockers(a);
                    return [
                      `${a.applicationNumber}\n${queueAge(a.createdAt)}`,
                      <Person row={a} key="p" />,
                      `${a.product} · ${String(a.purposeCategory || 'OTHER').replaceAll(
                        '_',
                        ' ',
                      )}\n${money(a.amount)} · ${a.term} months · ${money(a.monthlyPayment)}/month\n${
                        a.purpose
                      }\nRepayment: ${a.repaymentSource || 'Legacy record'}`,
                      `Age: ${a.age ?? 'Missing'}\nIncome: ${String(
                        a.incomeRange || 'Missing',
                      ).replaceAll('_', ' ')}\nExisting debt: ${money(
                        a.existingMonthlyDebt,
                      )}\nCommitment ratio: ${(Number(a.affordabilityRatio || 0) * 100).toFixed(
                        1,
                      )}%\nKYC: ${String(a.kycStatus || 'NOT_SUBMITTED').replaceAll('_', ' ')}`,
                      <Status value={a.status} key="s" />,
                      <div className="actions" key="d">
                        {a.status !== 'APPROVED' ? (
                          <>
                            {a.status === 'SUBMITTED' && (
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
                            )}
                            {blockers.length ? (
                              <>
                                <button disabled title={blockers.join(' · ')}>
                                  Approval blocked
                                </button>
                                {a.kycStatus !== 'APPROVED' &&
                                  permissions.includes('kyc:review') && (
                                    <button
                                      onClick={() => {
                                        setTab('KYC review');
                                        setQuery(String(a.email || ''));
                                      }}
                                    >
                                      Review KYC first
                                    </button>
                                  )}
                                <small className="decision-blockers">{blockers.join(' · ')}</small>
                              </>
                            ) : (
                              <button
                                className="approve"
                                onClick={() =>
                                  ask({
                                    title: 'Approve this loan application?',
                                    copy: `Approve ${money(a.amount)} for ${a.firstName} ${
                                      a.lastName
                                    }. All recorded eligibility checks have passed.`,
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
                            )}
                            <button
                              className="danger"
                              onClick={() =>
                                ask({
                                  title: 'Reject this loan application?',
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
                              Reject loan
                            </button>
                          </>
                        ) : (
                          <button
                            className="approve"
                            onClick={() =>
                              ask({
                                title: 'Confirm external disbursement?',
                                copy: `Only continue after confirming that ${money(
                                  a.amount,
                                )} was successfully sent outside PataPesa. This creates the loan ledger and repayment schedule.`,
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
                    ];
                  })}
                />
              </>
            )}
            {tab === 'KYC review' && (
              <>
                <Toolbar value={query} setValue={setQuery} placeholder="Search identity queue" />
                <Table
                  heads={['Customer', 'Identity', 'Submitted', 'Decision']}
                  rows={filteredKyc.map((k) => [
                    <Person row={k} key="p" />,
                    <div className="identity-cell" key="identity">
                      <strong>{String(k.idType).replaceAll('_', ' ')}</strong>
                      <small>Ending {k.idNumberLast4 || '—'}</small>
                      {revealedKyc[String(k.id)] ? (
                        <>
                          <code>{revealedKyc[String(k.id)]}</code>
                          <button
                            onClick={() =>
                              setRevealedKyc((current) => {
                                const next = { ...current };
                                delete next[String(k.id)];
                                return next;
                              })
                            }
                          >
                            Hide number
                          </button>
                        </>
                      ) : (
                        <button onClick={() => void revealIdentity(String(k.id))}>
                          Reveal for review
                        </button>
                      )}
                    </div>,
                    `${date(k.createdAt)}\n${queueAge(k.createdAt)}`,
                    <div className="actions" key="d">
                      <button
                        className="approve"
                        onClick={() =>
                          ask({
                            title: 'Approve identity verification?',
                            copy: `Confirm that the submitted ${String(k.idType)
                              .replaceAll('_', ' ')
                              .toLowerCase()} belongs to ${k.firstName} ${k.lastName}.`,
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
              </>
            )}
            {tab === 'Loan products' && (
              <ProductManager
                products={products}
                save={(id, body) =>
                  act(`/admin/products/${id}`, 'PATCH', body, 'Loan product updated')
                }
              />
            )}
            {tab === 'Repayments' && (
              <>
                <Toolbar
                  value={query}
                  setValue={setQuery}
                  placeholder="Search payment references, loans or customers"
                />
                <Table
                  heads={['Reference', 'Customer', 'Loan', 'Payment', 'Status', 'Verification']}
                  rows={filteredPayments.map((payment) => [
                    `${payment.reference}\nPaid ${date(payment.paymentDate)}`,
                    <Person row={payment} key="p" />,
                    `${payment.loanNumber}\nInstalment #${payment.instalment || '—'}`,
                    `${money(payment.amount)}\n${String(payment.method).replaceAll('_', ' ')}\nSubmitted ${date(
                      payment.submittedAt,
                    )}`,
                    <div key="status">
                      <Status value={payment.status} />
                      {payment.failureReason && (
                        <small className="decision-blockers">{payment.failureReason}</small>
                      )}
                    </div>,
                    <div className="actions" key="actions">
                      {['PENDING', 'PROCESSING'].includes(String(payment.status)) ? (
                        <>
                          <button
                            className="approve"
                            onClick={() =>
                              ask({
                                title: 'Confirm this repayment?',
                                copy: `Confirm only after matching reference ${payment.reference} and ${money(
                                  payment.amount,
                                )} against the external payment statement. This will update the loan balance and repayment schedule.`,
                                label: 'Confirm payment',
                                run: () =>
                                  act(
                                    `/admin/payments/${payment.id}`,
                                    'PATCH',
                                    { status: 'COMPLETED' },
                                    'Payment confirmed and loan balance updated',
                                  ),
                              })
                            }
                          >
                            Confirm payment
                          </button>
                          <button
                            className="danger"
                            onClick={() =>
                              ask({
                                title: 'Reject this payment record?',
                                copy: 'Provide the reason the receipt could not be verified. The customer will see it in payment history.',
                                label: 'Reject payment',
                                danger: true,
                                reason: true,
                                run: (reason) =>
                                  act(
                                    `/admin/payments/${payment.id}`,
                                    'PATCH',
                                    { status: 'FAILED', reason },
                                    'Payment rejected',
                                  ),
                              })
                            }
                          >
                            Reject payment
                          </button>
                        </>
                      ) : (
                        <span className="muted">Review completed</span>
                      )}
                    </div>,
                  ])}
                />
              </>
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
              <>
                <Toolbar value={query} setValue={setQuery} placeholder="Search support queue" />
                <Table
                  heads={['Reference', 'Customer', 'Subject', 'Message', 'Status', 'Manage']}
                  rows={filteredSupport.map((s) => [
                    `${s.reference}\n${queueAge(s.createdAt)}`,
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
              </>
            )}
            {tab === 'Tracking & ads' && (
              <AdManager
                ads={ads}
                integrations={integrations}
                save={(slot, body) =>
                  act(`/admin/ads/${slot}`, 'PUT', body, 'Advertising placement saved')
                }
                saveIntegration={(provider, body) =>
                  act(
                    `/admin/integrations/${provider}`,
                    'PUT',
                    body,
                    'Tracking or advertising integration saved',
                  )
                }
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
          </div>
        )}
      </main>
      {dialog && <ActionDialog dialog={dialog} close={() => setDialog(null)} />}
    </div>
  );
}

function ProductManager({
  products,
  save,
}: {
  products: Row[];
  save: (id: string, body: Row) => Promise<boolean>;
}) {
  return (
    <div className="product-admin-grid">
      <div className="product-admin-intro">
        <p className="overline">Credit catalogue</p>
        <h2>Loan products</h2>
        <p>
          Change the figures customers see and can apply for. Existing applications keep the rate
          and fees recorded when they were submitted.
        </p>
      </div>
      {products.map((product) => (
        <form
          className="product-card"
          key={String(product.id)}
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            void save(String(product.id), {
              name: String(data.get('name') || ''),
              description: String(data.get('description') || ''),
              minAmount: Number(data.get('minAmount')),
              maxAmount: Number(data.get('maxAmount')),
              minTerm: Number(data.get('minTerm')),
              maxTerm: Number(data.get('maxTerm')),
              interestRate: Number(data.get('interestRate')),
              processingFee: Number(data.get('processingFee')),
              status: String(data.get('status') || ''),
            });
          }}
        >
          <div className="product-card-heading">
            <span>{product.code}</span>
            <Status value={product.status} />
          </div>
          <label>
            <span>Customer-facing name</span>
            <input
              name="name"
              defaultValue={String(product.name || '')}
              minLength={2}
              maxLength={100}
              required
            />
          </label>
          <label>
            <span>Description</span>
            <textarea
              name="description"
              defaultValue={String(product.description || '')}
              minLength={10}
              maxLength={500}
              required
            />
          </label>
          <div className="product-fields">
            <ProductField
              name="minAmount"
              label="Minimum amount"
              value={product.minAmount}
              min={1000}
            />
            <ProductField
              name="maxAmount"
              label="Maximum amount"
              value={product.maxAmount}
              min={1000}
            />
            <ProductField
              name="minTerm"
              label="Minimum months"
              value={product.minTerm}
              min={1}
              max={60}
            />
            <ProductField
              name="maxTerm"
              label="Maximum months"
              value={product.maxTerm}
              min={1}
              max={60}
            />
            <ProductField
              name="interestRate"
              label="Annual interest %"
              value={product.interestRate}
              min={0}
              max={100}
              step="0.01"
            />
            <ProductField
              name="processingFee"
              label="Processing fee %"
              value={product.processingFee}
              min={0}
              max={100}
              step="0.01"
            />
          </div>
          <div className="product-card-footer">
            <label>
              <span>Availability</span>
              <select name="status" defaultValue={String(product.status || 'INACTIVE')}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </label>
            <button className="primary" type="submit">
              Save product
            </button>
          </div>
        </form>
      ))}
    </div>
  );
}

function ProductField({
  name,
  label,
  value,
  min,
  max,
  step = '1',
}: {
  name: string;
  label: string;
  value: Row[string];
  min: number;
  max?: number;
  step?: string;
}) {
  return (
    <label>
      <span>{label}</span>
      <input
        name={name}
        type="number"
        defaultValue={String(value ?? '')}
        min={min}
        max={max}
        step={step}
        required
      />
    </label>
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
          ['Signed in · 30 min', metrics.recentlyActive],
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
          ['Live ads', metrics.activeAds],
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
function AdManager({
  ads,
  integrations,
  save,
  saveIntegration,
}: {
  ads: Row[];
  integrations: Row[];
  save: (slot: string, body: Row) => Promise<boolean>;
  saveIntegration: (provider: string, body: Row) => Promise<boolean>;
}) {
  const providers = [
    {
      id: 'GOOGLE_ANALYTICS',
      name: 'Google Analytics 4',
      hint: 'Measurement ID (G-…) or the standard Google tag snippet',
      placeholder: 'G-XXXXXXXXXX',
    },
    {
      id: 'GOOGLE_TAG_MANAGER',
      name: 'Google Tag Manager',
      hint: 'Container ID (GTM-…) or the standard container snippet',
      placeholder: 'GTM-XXXXXXX',
    },
    {
      id: 'PLAUSIBLE',
      name: 'Plausible Analytics',
      hint: 'Tracked domain or the standard Plausible snippet',
      placeholder: 'cedarmondtv.site',
    },
    {
      id: 'GOOGLE_ADSENSE',
      name: 'Google AdSense',
      hint: 'Publisher ID (ca-pub-…) or the standard AdSense snippet',
      placeholder: 'ca-pub-0000000000000000',
    },
  ];
  const slots = [
    {
      id: 'HOME_BELOW_PLANNER',
      name: 'Homepage placement',
      location: 'Below the loan estimator on the public homepage',
    },
    {
      id: 'LOANS_BELOW_HEADER',
      name: 'Loan page placement',
      location: 'Below the introduction on the public loan page',
    },
  ];
  const inputDate = (value: Row[string] | undefined) => {
    if (!value) return '';
    const parsed = new Date(String(value));
    const offset = parsed.getTimezoneOffset() * 60_000;
    return new Date(parsed.getTime() - offset).toISOString().slice(0, 16);
  };
  return (
    <div className="ad-admin-grid">
      <div className="ad-admin-intro">
        <p className="overline">Consent-aware integrations</p>
        <h2>Tracking &amp; advertising</h2>
        <p>
          Paste a provider ID or its standard snippet. PataPesa extracts only the verified ID;
          arbitrary JavaScript is rejected and nothing loads before the visitor gives consent.
        </p>
        <div className="integration-warning">
          Use GA4 directly or through Tag Manager—not both for the same page view. Publishing
          misleading, discriminatory or unlicensed financial advertising is prohibited.
        </div>
      </div>
      <section className="integration-section">
        <div className="integration-heading">
          <p className="overline">Provider connections</p>
          <h3>Analytics and ad networks</h3>
        </div>
        <div className="integration-grid">
          {providers.map((provider) => {
            const integration = integrations.find((item) => item.provider === provider.id);
            return (
              <form
                className="integration-card"
                key={`${provider.id}-${integration?.updatedAt || 'new'}`}
                onSubmit={(event) => {
                  event.preventDefault();
                  const data = new FormData(event.currentTarget);
                  void saveIntegration(provider.id, {
                    value: String(data.get('value') || ''),
                    homeSlot: String(data.get('homeSlot') || ''),
                    loansSlot: String(data.get('loansSlot') || ''),
                    enabled: data.get('enabled') === 'on',
                  });
                }}
              >
                <div className="ad-editor-head">
                  <div>
                    <h3>{provider.name}</h3>
                    <small>{provider.hint}</small>
                  </div>
                  <label className="ad-switch">
                    <input
                      name="enabled"
                      type="checkbox"
                      defaultChecked={integration?.enabled === true}
                    />
                    <span>Enabled</span>
                  </label>
                </div>
                <label className="integration-value">
                  <span>Provider ID or standard snippet</span>
                  <textarea
                    name="value"
                    required
                    maxLength={10000}
                    defaultValue={String(integration?.publicId || '')}
                    placeholder={provider.placeholder}
                    spellCheck={false}
                  />
                </label>
                {provider.id === 'GOOGLE_ADSENSE' && (
                  <div className="ad-form-grid compact">
                    <label>
                      <span>Homepage ad slot ID</span>
                      <input
                        name="homeSlot"
                        inputMode="numeric"
                        pattern="[0-9]{5,20}"
                        defaultValue={String(integration?.homeSlot || '')}
                        placeholder="1234567890"
                      />
                    </label>
                    <label>
                      <span>Loans page ad slot ID</span>
                      <input
                        name="loansSlot"
                        inputMode="numeric"
                        pattern="[0-9]{5,20}"
                        defaultValue={String(integration?.loansSlot || '')}
                        placeholder="0987654321"
                      />
                    </label>
                  </div>
                )}
                <div className="ad-editor-actions">
                  <small>
                    {integration?.updatedAt
                      ? `Last saved ${date(integration.updatedAt)}`
                      : 'Not configured'}
                  </small>
                  <button className="primary" type="submit">
                    Save integration
                  </button>
                </div>
              </form>
            );
          })}
        </div>
      </section>
      <div className="ad-admin-intro placement-intro">
        <p className="overline">Direct campaigns</p>
        <h2>First-party placements</h2>
        <p>
          Publish approved sponsor creative without a third-party network. A direct campaign takes
          priority over AdSense in the same placement.
        </p>
      </div>
      {slots.map((slot) => {
        const ad = ads.find((item) => item.slot === slot.id);
        return (
          <form
            className="ad-editor"
            key={`${slot.id}-${ad?.updatedAt || 'new'}`}
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              void save(slot.id, {
                sponsor: String(data.get('sponsor') || ''),
                headline: String(data.get('headline') || ''),
                body: String(data.get('body') || ''),
                ctaLabel: String(data.get('ctaLabel') || ''),
                targetUrl: String(data.get('targetUrl') || ''),
                imageUrl: String(data.get('imageUrl') || ''),
                startsAt: String(data.get('startsAt') || ''),
                endsAt: String(data.get('endsAt') || ''),
                enabled: data.get('enabled') === 'on',
              });
            }}
          >
            <div className="ad-editor-head">
              <div>
                <h3>{slot.name}</h3>
                <small>{slot.location}</small>
              </div>
              <label className="ad-switch">
                <input name="enabled" type="checkbox" defaultChecked={ad?.enabled === true} />
                <span>Enabled</span>
              </label>
            </div>
            <div className="ad-form-grid">
              <label>
                <span>Sponsor name</span>
                <input
                  name="sponsor"
                  required
                  minLength={2}
                  maxLength={120}
                  defaultValue={String(ad?.sponsor || '')}
                  placeholder="Business or campaign name"
                />
              </label>
              <label>
                <span>Button label</span>
                <input
                  name="ctaLabel"
                  required
                  minLength={2}
                  maxLength={60}
                  defaultValue={String(ad?.ctaLabel || '')}
                  placeholder="Learn more"
                />
              </label>
              <label className="span-2">
                <span>Headline</span>
                <input
                  name="headline"
                  required
                  minLength={3}
                  maxLength={160}
                  defaultValue={String(ad?.headline || '')}
                  placeholder="Short, factual headline"
                />
              </label>
              <label className="span-2">
                <span>Description</span>
                <textarea
                  name="body"
                  required
                  minLength={5}
                  maxLength={500}
                  defaultValue={String(ad?.body || '')}
                  placeholder="Explain the offer without misleading claims"
                />
              </label>
              <label className="span-2">
                <span>Destination URL</span>
                <input
                  name="targetUrl"
                  required
                  defaultValue={String(ad?.targetUrl || '')}
                  placeholder="https://example.com/offer"
                />
              </label>
              <label className="span-2">
                <span>Image URL (optional)</span>
                <input
                  name="imageUrl"
                  defaultValue={String(ad?.imageUrl || '')}
                  placeholder="HTTPS image URL or /images/banner.jpg"
                />
              </label>
              <label>
                <span>Starts (optional)</span>
                <input
                  name="startsAt"
                  type="datetime-local"
                  defaultValue={inputDate(ad?.startsAt)}
                />
              </label>
              <label>
                <span>Ends (optional)</span>
                <input name="endsAt" type="datetime-local" defaultValue={inputDate(ad?.endsAt)} />
              </label>
            </div>
            <div className="ad-editor-actions">
              <small>{ad?.updatedAt ? `Last saved ${date(ad.updatedAt)}` : 'Not configured'}</small>
              <button className="primary" type="submit">
                Save placement
              </button>
            </div>
          </form>
        );
      })}
    </div>
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
    Repayments: 'M4 7h16v12H4zM4 11h16M8 15h3M16 4v3M8 4v3',
    'Loan products': 'M4 5h16v14H4zM8 9h8M8 13h5M16 13h1',
    'Loan ledger': 'M4 3h16v18H4zM8 7h8M8 11h8M8 15h3M14 15h2',
    Support: 'M21 15a4 4 0 0 1-4 4H8l-5 3v-7a7 7 0 0 1-1-4 9 9 0 0 1 9-9h1a9 9 0 0 1 9 9z',
    'Tracking & ads': 'M3 11v2l12 5V6L3 11zM15 9h4l2 2v2l-2 2h-4M6 14l2 7h4l-2-5',
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
    const succeeded = await dialog.run(reason.trim());
    setBusy(false);
    if (succeeded) close();
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
