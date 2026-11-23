import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownToLine, Check, CircleAlert, Plus,
  Printer, Search, Trash2, X,
} from 'lucide-react'
import { ADMIN_MODULE_TITLES } from './AdminNavigation.jsx'

const STORAGE_KEY = 'northstar-admin-modules'
const emptyData = {
  fds: [], rds: [], minors: [], loans: [], beneficiaries: [],
  rates: [], rateHistory: [], interestHistory: [],
}
const money = value => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 2,
}).format(Number(value) || 0)
const today = () => new Date().toISOString().slice(0, 10)
const monthsAfter = months => {
  const date = new Date()
  date.setMonth(date.getMonth() + Number(months))
  return date.toISOString().slice(0, 10)
}
const newId = prefix => `${prefix}${Date.now().toString(36).toUpperCase()}`
const emptyForm = {
  customerId: '', accountId: '', deposit: '', tenure: '', rate: '',
  nominee: '', nomineeRelation: '', monthlyAmount: '', dob: '',
  guardian: '', guardianAccountId: '', guardianPhone: '', guardianEmail: '',
  minorPhone: '', minorEmail: '',
  amount: '', purpose: '', loanType: '', rateName: '', rateValue: '',
  name: '', beneficiaryAccount: '', ifsc: '', bank: '', startDate: '',
  endDate: '', search: '', status: 'All', dateFrom: '', dateTo: '',
}

function readData() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (!stored || typeof stored !== 'object') return emptyData
    return Object.fromEntries(
      Object.keys(emptyData).map(key => [key, Array.isArray(stored[key]) ? stored[key] : []]),
    )
  } catch {
    return emptyData
  }
}

const accountName = (accounts, id) => accounts.find(item => item.id === id)?.name || 'Unknown customer'
const accountNumber = (accounts, id) => accounts.find(item => item.id === id)?.id || id || '—'
const dateText = value => value ? new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString('en-IN') : '—'
const daysOld = dob => {
  if (!dob) return null
  const birth = new Date(`${dob}T00:00:00`)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--
  return age
}
const fdMaturity = (principal, rate, months) => {
  const years = Number(months) / 12
  return Number(principal) * (1 + Number(rate) / 400) ** (4 * years)
}
const rdMaturity = (installment, rate, months) => {
  const n = Number(months)
  const monthlyRate = Number(rate) / 1200
  if (!monthlyRate) return Number(installment) * n
  return Number(installment) * (((1 + monthlyRate) ** n - 1) / monthlyRate) * (1 + monthlyRate)
}

function Field({ label, children, hint }) {
  return <label className="module-field">{label}{children}{hint && <small>{hint}</small>}</label>
}

function TextInput({ label, form, setForm, name, ...props }) {
  return <Field label={label} hint={props.hint}>
    <input
      value={form[name] ?? ''}
      onChange={event => setForm(old => ({ ...old, [name]: event.target.value }))}
      {...Object.fromEntries(Object.entries(props).filter(([key]) => key !== 'hint'))}
    />
  </Field>
}

function SelectInput({ label, form, setForm, name, children, ...props }) {
  return <Field label={label}>
    <select
      value={form[name] ?? ''}
      onChange={event => setForm(old => ({ ...old, [name]: event.target.value }))}
      {...props}
    >{children}</select>
  </Field>
}

function SectionTitle({ title, description, action }) {
  return <div className="module-section-title"><div><h3>{title}</h3>{description && <p>{description}</p>}</div>{action}</div>
}

function PrototypeNotice() {
  return <div className="prototype-notice"><CircleAlert size={17}/><span><strong>Frontend prototype.</strong> Records entered here stay in this browser only. Rates and maturity values are indicative; no account balances, payments, or real banking records are changed.</span></div>
}

function DataTable({ headers, rows, empty, children }) {
  return <div className="table-wrap module-table"><table><thead><tr>{headers.map(header => <th key={header}>{header}</th>)}</tr></thead><tbody>{children}</tbody></table>{rows === 0 && <div className="empty-state">{empty}</div>}</div>
}

export default function AdminModules({ view, accounts, transactions, auditLogs, onAudit, onNotice }) {
  const [data, setData] = useState(readData)
  const [form, setForm] = useState(emptyForm)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [editBeneficiary, setEditBeneficiary] = useState('')
  const [guardianDrafts, setGuardianDrafts] = useState({})
  const [repaymentDrafts, setRepaymentDrafts] = useState({})
  const title = ADMIN_MODULE_TITLES[view]

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      onNotice('Could not save prototype records in this browser.')
    }
  }, [data, onNotice])

  useEffect(() => {
    setForm(emptyForm)
    setSearch('')
    setStatusFilter('All')
    setEditBeneficiary('')
    setGuardianDrafts({})
    setRepaymentDrafts({})
  }, [view])

  const change = (key, value) => setForm(old => ({ ...old, [key]: value }))
  const announce = (action, affected) => {
    onAudit(action, affected)
    onNotice(`${action} saved in this browser prototype.`)
  }
  const currentRates = useMemo(() => Object.fromEntries(data.rates.map(rate => [rate.product, rate])), [data.rates])
  const activeFdRate = currentRates.FD?.rate
  const activeRdRate = currentRates.RD?.rate

  const saveFd = event => {
    event.preventDefault()
    if (!accounts.some(account => account.id === form.accountId)) return onNotice('Select a linked savings account.')
    if (Number(form.deposit) <= 0 || Number(form.tenure) <= 0 || Number(form.rate) <= 0) return onNotice('Enter a valid deposit, tenure, and rate.')
    const entry = {
      id: newId('FD'), customerId: form.customerId, accountId: form.accountId,
      principal: Number(form.deposit), tenure: Number(form.tenure), rate: Number(form.rate),
      nominee: form.nominee.trim(), nomineeRelation: form.nomineeRelation.trim(),
      startDate: today(), maturityDate: monthsAfter(form.tenure),
      maturityAmount: fdMaturity(form.deposit, form.rate, form.tenure), status: 'Active',
    }
    setData(old => ({ ...old, fds: [entry, ...old.fds] }))
    setForm(emptyForm)
    announce(`Fixed deposit ${entry.id} created`, entry.id)
  }

  const saveRd = event => {
    event.preventDefault()
    if (!accounts.some(account => account.id === form.accountId)) return onNotice('Select a linked savings account.')
    if (Number(form.monthlyAmount) <= 0 || Number(form.tenure) <= 0 || Number(form.rate) <= 0) return onNotice('Enter a valid installment, tenure, and rate.')
    const entry = {
      id: newId('RD'), customerId: form.customerId, accountId: form.accountId,
      monthlyAmount: Number(form.monthlyAmount), tenure: Number(form.tenure),
      rate: Number(form.rate), startDate: today(), maturityDate: monthsAfter(form.tenure),
      maturityAmount: rdMaturity(form.monthlyAmount, form.rate, form.tenure),
      installments: [], status: 'Active',
    }
    setData(old => ({ ...old, rds: [entry, ...old.rds] }))
    setForm(emptyForm)
    announce(`Recurring deposit ${entry.id} created`, entry.id)
  }

  const updateFdStatus = (entry, status) => {
    setData(old => ({ ...old, fds: old.fds.map(item => item.id === entry.id ? { ...item, status } : item) }))
    announce(`Fixed deposit ${entry.id} ${status.toLowerCase()}`, entry.id)
  }
  const updateRdStatus = (entry, status) => {
    setData(old => ({ ...old, rds: old.rds.map(item => item.id === entry.id ? { ...item, status } : item) }))
    announce(`Recurring deposit ${entry.id} ${status.toLowerCase()}`, entry.id)
  }

  const saveMinor = event => {
    event.preventDefault()
    const age = daysOld(form.dob)
    if (age === null || age < 0 || age >= 18) return onNotice('Enter a valid date of birth for a minor under 18.')
    if (!accounts.some(account => account.id === form.guardianAccountId)) return onNotice('Select an existing guardian account.')
    const entry = {
      id: newId('MIN'), name: form.name.trim(), dob: form.dob, age,
      minorPhone: form.minorPhone.trim(), minorEmail: form.minorEmail.trim(),
      guardian: form.guardian.trim(), guardianAccountId: form.guardianAccountId,
      guardianPhone: form.guardianPhone.trim(), guardianEmail: form.guardianEmail.trim(),
      created: today(), status: 'Minor savings',
    }
    setData(old => ({ ...old, minors: [entry, ...old.minors] }))
    setForm(emptyForm)
    announce(`Minor account ${entry.id} created`, entry.id)
  }

  const saveLoan = event => {
    event.preventDefault()
    if (Number(form.amount) <= 0 || Number(form.tenure) <= 0 || Number(form.rate) <= 0) return onNotice('Enter a valid loan amount, tenure, and rate.')
    const principal = Number(form.amount)
    const monthlyRate = Number(form.rate) / 1200
    const periods = Number(form.tenure)
    const emi = principal * monthlyRate * (1 + monthlyRate) ** periods / ((1 + monthlyRate) ** periods - 1)
    const entry = {
      id: newId('LN'), customerId: form.customerId, loanType: form.loanType,
      purpose: form.purpose.trim(), amount: principal, tenure: periods,
      rate: Number(form.rate), emi, outstanding: principal,
      repayments: [], status: 'Pending', created: today(),
    }
    setData(old => ({ ...old, loans: [entry, ...old.loans] }))
    setForm(emptyForm)
    announce(`Loan application ${entry.id} submitted`, entry.id)
  }

  const saveBeneficiary = event => {
    event.preventDefault()
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifsc.trim().toUpperCase())) return onNotice('Enter an IFSC in the format ABCD0123456.')
    if (!/^[0-9]{9,18}$/.test(form.beneficiaryAccount.trim())) return onNotice('Enter an account number containing 9–18 digits.')
    const entry = {
      id: editBeneficiary || newId('BEN'), customerId: form.customerId,
      name: form.name.trim(), accountNumber: form.beneficiaryAccount.trim(),
      ifsc: form.ifsc.trim().toUpperCase(), bank: form.bank.trim(),
    }
    setData(old => ({
      ...old,
      beneficiaries: editBeneficiary
        ? old.beneficiaries.map(item => item.id === editBeneficiary ? entry : item)
        : [entry, ...old.beneficiaries],
    }))
    setForm(emptyForm)
    setEditBeneficiary('')
    announce(`Beneficiary ${entry.id} ${editBeneficiary ? 'updated' : 'added'}`, entry.id)
  }

  const saveRate = event => {
    event.preventDefault()
    if (!form.rateName || Number(form.rateValue) <= 0 || Number(form.rateValue) > 100) return onNotice('Choose a product and enter an annual rate from 0 to 100%.')
    const product = form.rateName
    const previous = currentRates[product]?.rate ?? null
    const entry = { product, rate: Number(form.rateValue), effectiveDate: today() }
    setData(old => ({
      ...old,
      rates: [...old.rates.filter(rate => rate.product !== product), entry],
      rateHistory: [{ ...entry, previous, changedAt: new Date().toISOString() }, ...old.rateHistory],
    }))
    setForm(emptyForm)
    announce(`${product} indicative rate changed to ${entry.rate}%`, product)
  }

  if (!title) return null

  const customers = accounts.filter(account => account.status === 'Active')
  const customerOption = (account, prefix = '') => <option key={`${prefix}${account.id}`} value={account.id}>{account.name} · {account.id}</option>
  const fdQuery = search.trim().toLowerCase()
  const depositStatus = item => item.status === 'Active' && item.maturityDate <= today() ? 'Matured' : item.status
  const visibleFds = data.fds.filter(item =>
    (!fdQuery || `${accountName(accounts, item.customerId)} ${item.accountId} ${item.id}`.toLowerCase().includes(fdQuery)) &&
    (statusFilter === 'All' || depositStatus(item) === statusFilter),
  )
  const rdQuery = search.trim().toLowerCase()
  const visibleRds = data.rds.filter(item =>
    (!rdQuery || `${accountName(accounts, item.customerId)} ${item.accountId} ${item.id}`.toLowerCase().includes(rdQuery)) &&
    (statusFilter === 'All' || depositStatus(item) === statusFilter),
  )

  const renderFdList = allowClose => <>
    <div className="module-toolbar">
      <label className="module-search"><Search size={16}/><input aria-label="Search fixed deposits" placeholder="Search customer, account or FD number" value={search} onChange={event => setSearch(event.target.value)}/></label>
      <select aria-label="Filter fixed deposit status" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option>All</option><option>Active</option><option>Matured</option><option>Closed</option></select>
    </div>
    <DataTable headers={['FD number', 'Customer / linked account', 'Principal', 'Rate', 'Tenure', 'Maturity date', 'Maturity amount', 'Status', allowClose ? 'Action' : 'Nominee']} rows={visibleFds.length} empty="No fixed deposits yet. Create one to see it here.">
      {visibleFds.map(item => <tr key={item.id}>
        <td>{item.id}</td><td>{accountName(accounts, item.customerId)}<small className="module-subcell">{accountNumber(accounts, item.accountId)}</small></td>
        <td>{money(item.principal)}</td><td>{item.rate}%</td><td>{item.tenure} mo</td><td>{dateText(item.maturityDate)}</td>
        <td>{money(item.maturityAmount)}</td><td><span className={`status ${depositStatus(item).toLowerCase()}`}>{depositStatus(item)}</span></td>
        <td>{allowClose ? depositStatus(item) === 'Active' && <button className="secondary small" onClick={() => updateFdStatus(item, 'Closed')}>Close</button> : item.nominee || '—'}</td>
      </tr>)}
    </DataTable>
  </>

  const renderFdForm = <form className="module-form" onSubmit={saveFd}>
    <SectionTitle title="Open a fixed deposit" description="Choose a linked customer account. This prototype does not debit funds."/>
    <div className="module-form-grid">
      <SelectInput label="Customer / savings account" name="customerId" form={form} setForm={setForm} required><option value="">Select a customer account</option>{customers.map(account => customerOption(account))}</SelectInput>
      <SelectInput label="Linked savings account" name="accountId" form={form} setForm={setForm} required><option value="">Select an account</option>{customers.filter(account => !form.customerId || account.id === form.customerId).map(account => customerOption(account))}</SelectInput>
      <TextInput label="Deposit amount (INR)" type="number" min="1" step="0.01" name="deposit" form={form} setForm={setForm} required/>
      <TextInput label="Tenure (months)" type="number" min="1" max="120" name="tenure" form={form} setForm={setForm} required/>
      <TextInput label="Annual interest rate (%)" type="number" min="0.01" max="100" step="0.01" name="rate" form={form} setForm={setForm} required hint={activeFdRate ? `Configured indicative FD rate: ${activeFdRate}%` : 'No indicative FD rate configured; enter a rate.'}/>
      <TextInput label="Nominee name" name="nominee" form={form} setForm={setForm} required/>
      <TextInput label="Nominee relationship" name="nomineeRelation" form={form} setForm={setForm} required/>
    </div>
    {Number(form.deposit) > 0 && Number(form.rate) > 0 && Number(form.tenure) > 0 && <div className="calculation-preview"><span>Indicative maturity (quarterly compounding)</span><strong>{money(fdMaturity(form.deposit, form.rate, form.tenure))}</strong></div>}
    <button className="primary" type="submit"><Plus size={16}/> Create FD record</button>
  </form>

  const renderFdPage = <>
    <SectionTitle title="Fixed deposit portfolio" description="Search, review maturity details, and close prototype FD records." action={<button className="text-btn" onClick={() => window.print()}><Printer size={15}/> Print</button>}/>
    {view === 'createFd' ? renderFdForm : renderFdList(view === 'closeFd')}
    {view !== 'createFd' && <details className="module-details"><summary><Plus size={15}/> Open a new FD</summary>{renderFdForm}</details>}
  </>

  const renderRd = <>
    <SectionTitle title="Recurring deposit portfolio" description="Track installments and maturity projections for locally created records."/>
    <form className="module-form" onSubmit={saveRd}>
      <div className="module-form-grid">
        <SelectInput label="Customer / savings account" name="customerId" form={form} setForm={setForm} required><option value="">Select a customer account</option>{customers.map(account => customerOption(account))}</SelectInput>
        <SelectInput label="Linked savings account" name="accountId" form={form} setForm={setForm} required><option value="">Select an account</option>{customers.filter(account => !form.customerId || account.id === form.customerId).map(account => customerOption(account))}</SelectInput>
        <TextInput label="Monthly installment (INR)" type="number" min="1" step="0.01" name="monthlyAmount" form={form} setForm={setForm} required/>
        <TextInput label="Tenure (months)" type="number" min="1" max="120" name="tenure" form={form} setForm={setForm} required/>
        <TextInput label="Annual interest rate (%)" type="number" min="0.01" max="100" step="0.01" name="rate" form={form} setForm={setForm} required hint={activeRdRate ? `Configured indicative RD rate: ${activeRdRate}%` : 'No indicative RD rate configured; enter a rate.'}/>
      </div>
      {Number(form.monthlyAmount) > 0 && Number(form.rate) > 0 && Number(form.tenure) > 0 && <div className="calculation-preview"><span>Indicative maturity (monthly installments in advance)</span><strong>{money(rdMaturity(form.monthlyAmount, form.rate, form.tenure))}</strong></div>}
      <button className="primary" type="submit"><Plus size={16}/> Create RD record</button>
    </form>
    <div className="module-toolbar">
      <label className="module-search"><Search size={16}/><input aria-label="Search recurring deposits" placeholder="Search customer, account or RD number" value={search} onChange={event => setSearch(event.target.value)}/></label>
      <select aria-label="Filter recurring deposit status" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option>All</option><option>Active</option><option>Matured</option><option>Closed</option></select>
    </div>
    <DataTable headers={['RD number', 'Customer / linked account', 'Installment', 'Rate', 'Tenure', 'Maturity date', 'Maturity amount', 'Status', 'Installments', 'Action']} rows={visibleRds.length} empty="No recurring deposits yet. Create one to see it here.">
      {visibleRds.map(item => <tr key={item.id}>
        <td>{item.id}</td><td>{accountName(accounts, item.customerId)}<small className="module-subcell">{accountNumber(accounts, item.accountId)}</small></td>
        <td>{money(item.monthlyAmount)}</td><td>{item.rate}%</td><td>{item.tenure} mo</td><td>{dateText(item.maturityDate)}</td><td>{money(item.maturityAmount)}</td>
        <td><span className={`status ${depositStatus(item).toLowerCase()}`}>{depositStatus(item)}</span></td>
        <td>{item.installments.length ? <details className="installment-history"><summary>{item.installments.length} payments</summary>{item.installments.map(payment => <div key={payment.id}>{dateText(payment.date)} · {money(payment.amount)}</div>)}</details> : <span className="module-muted">No payments</span>}</td>
        <td className="module-actions">{depositStatus(item) === 'Active' && <><button className="secondary small" disabled={item.installments.length >= item.tenure} onClick={() => {
          if (item.installments.length >= item.tenure) return onNotice('All scheduled installments have already been recorded.')
          const payment = { id: newId('PAY'), amount: item.monthlyAmount, date: today() }
          setData(old => ({ ...old, rds: old.rds.map(record => record.id === item.id ? { ...record, installments: [payment, ...record.installments] } : record) }))
          announce(`Installment recorded for ${item.id}`, item.id)
        }}>Record installment</button><button className="secondary small" onClick={() => updateRdStatus(item, 'Closed')}>Close</button></>}</td>
      </tr>)}
    </DataTable>
  </>

  const renderMinorForm = <form className="module-form" onSubmit={saveMinor}>
    <SectionTitle title="Register a minor" description="Capture guardian information and link an existing active customer account."/>
    <div className="module-form-grid">
      <TextInput label="Minor full name" name="name" form={form} setForm={setForm} required/>
      <TextInput label="Date of birth" type="date" name="dob" form={form} setForm={setForm} max={today()} required/>
      <TextInput label="Minor phone (optional)" type="tel" name="minorPhone" form={form} setForm={setForm} pattern="[0-9]{7,15}"/>
      <TextInput label="Minor email (optional)" type="email" name="minorEmail" form={form} setForm={setForm}/>
      <TextInput label="Parent / guardian name" name="guardian" form={form} setForm={setForm} required/>
      <SelectInput label="Guardian's linked account" name="guardianAccountId" form={form} setForm={setForm} required><option value="">Select an active account</option>{customers.map(account => customerOption(account))}</SelectInput>
      <TextInput label="Guardian phone" type="tel" name="guardianPhone" form={form} setForm={setForm} pattern="[0-9]{7,15}" required/>
      <TextInput label="Guardian email" type="email" name="guardianEmail" form={form} setForm={setForm}/>
    </div>
    {form.dob && <div className="calculation-preview"><span>Age (prototype eligibility check)</span><strong>{daysOld(form.dob)} years</strong></div>}
    <p className="module-muted">Conversion to a regular account requires bank policy checks; this frontend does not execute conversions.</p>
    <button className="primary" type="submit"><Plus size={16}/> Create minor record</button>
  </form>

  const updateMinor = (minor, key, value) => {
    setData(old => ({ ...old, minors: old.minors.map(item => item.id === minor.id ? { ...item, [key]: value } : item) }))
    announce(`Guardian details updated for ${minor.id}`, minor.id)
  }

  const renderLoans = <>
    <SectionTitle title="Loan applications" description="Submit and review prototype applications. Decisions do not disburse funds."/>
    <form className="module-form" onSubmit={saveLoan}>
      <div className="module-form-grid">
        <SelectInput label="Applicant" name="customerId" form={form} setForm={setForm} required><option value="">Select an active customer</option>{customers.map(account => customerOption(account))}</SelectInput>
        <SelectInput label="Loan type" name="loanType" form={form} setForm={setForm} required><option value="">Select a loan type</option>{['Personal', 'Home', 'Vehicle', 'Education', 'Other'].map(option => <option key={option}>{option}</option>)}</SelectInput>
        <TextInput label="Loan amount (INR)" type="number" min="1" step="0.01" name="amount" form={form} setForm={setForm} required/>
        <TextInput label="Annual interest rate (%)" type="number" min="0.01" max="100" step="0.01" name="rate" form={form} setForm={setForm} required/>
        <TextInput label="Tenure (months)" type="number" min="1" max="600" name="tenure" form={form} setForm={setForm} required/>
        <TextInput label="Purpose" name="purpose" form={form} setForm={setForm} required/>
      </div>
      {Number(form.amount) > 0 && Number(form.rate) > 0 && Number(form.tenure) > 0 && (() => {
        const monthlyRate = Number(form.rate) / 1200
        const periods = Number(form.tenure)
        const emi = Number(form.amount) * monthlyRate * (1 + monthlyRate) ** periods / ((1 + monthlyRate) ** periods - 1)
        return <div className="calculation-preview"><span>Indicative monthly installment (EMI)</span><strong>{money(emi)}</strong></div>
      })()}
      <button className="primary" type="submit"><Plus size={16}/> Submit application</button>
    </form>
    <div className="module-toolbar"><label className="module-search"><Search size={16}/><input placeholder="Search applicant or loan number" aria-label="Search loans" value={search} onChange={event => setSearch(event.target.value)}/></label><select aria-label="Filter loan status" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option>All</option><option>Pending</option><option>Approved</option><option>Rejected</option></select></div>
    {data.loans.filter(item => (!search || `${item.id} ${accountName(accounts, item.customerId)}`.toLowerCase().includes(search.toLowerCase())) && (statusFilter === 'All' || item.status === statusFilter)).map(item => <div className="loan-card" key={item.id}>
      <div className="loan-card-head"><div><strong>{item.loanType} · {item.id}</strong><span>{accountName(accounts, item.customerId)} · Applied {dateText(item.created)}</span></div><span className={`status ${item.status.toLowerCase()}`}>{item.status}</span></div>
      <div className="loan-metrics"><span>Principal<strong>{money(item.amount)}</strong></span><span>Interest<strong>{item.rate}%</strong></span><span>Tenure<strong>{item.tenure} months</strong></span><span>EMI<strong>{money(item.emi)}</strong></span><span>Outstanding<strong>{money(item.outstanding)}</strong></span></div>
      <div className="loan-card-actions">{item.status === 'Pending' && <><button className="primary small" onClick={() => {
        setData(old => ({ ...old, loans: old.loans.map(record => record.id === item.id ? { ...record, status: 'Approved' } : record) }))
        announce(`Loan ${item.id} approved (prototype only)`, item.id)
      }}><Check size={14}/> Approve</button><button className="secondary small" onClick={() => {
        setData(old => ({ ...old, loans: old.loans.map(record => record.id === item.id ? { ...record, status: 'Rejected' } : record) }))
        announce(`Loan ${item.id} rejected (prototype only)`, item.id)
      }}><X size={14}/> Reject</button></>}
        {item.repayments.length > 0 ? <details><summary>Repayment history</summary>{item.repayments.map(payment => <div key={payment.id}>{dateText(payment.date)} · {money(payment.amount)}</div>)}</details> : <span className="module-muted">No repayment records</span>}
          {item.status === 'Approved' && item.outstanding > 0 && <div className="repayment-entry"><input aria-label={`Repayment amount for ${item.id}`} type="number" min="0.01" max={item.outstanding} step="0.01" placeholder="Repayment amount" value={repaymentDrafts[item.id] || ''} onChange={event => setRepaymentDrafts(old => ({ ...old, [item.id]: event.target.value }))}/><button className="secondary small" onClick={() => {
            const amount = Number(repaymentDrafts[item.id])
            if (!Number.isFinite(amount) || amount <= 0 || amount > item.outstanding) return onNotice('Enter a repayment greater than zero and no more than the outstanding balance.')
            const payment = { id: newId('REP'), amount, date: today() }
            setData(old => ({ ...old, loans: old.loans.map(record => record.id === item.id ? { ...record, outstanding: Math.max(0, record.outstanding - amount), repayments: [payment, ...record.repayments] } : record) }))
            setRepaymentDrafts(old => ({ ...old, [item.id]: '' }))
            announce(`Repayment recorded for ${item.id}`, item.id)
          }}>Record repayment</button></div>}
        </div>
    </div>)}
    {data.loans.length === 0 && <div className="empty-state">No loan applications yet.</div>}
  </>

  const renderBeneficiaries = <>
    <SectionTitle title="Beneficiaries" description="Validate basic account-number and IFSC formats before saving locally."/>
    <form className="module-form" onSubmit={saveBeneficiary}>
      <div className="module-form-grid">
        <SelectInput label="Customer" name="customerId" form={form} setForm={setForm} required><option value="">Select a customer</option>{customers.map(account => customerOption(account))}</SelectInput>
        <TextInput label="Beneficiary name" name="name" form={form} setForm={setForm} required/>
        <TextInput label="Beneficiary account number" name="beneficiaryAccount" form={form} setForm={setForm} inputMode="numeric" pattern="[0-9]{9,18}" required/>
        <TextInput label="IFSC code" name="ifsc" form={form} setForm={setForm} pattern="[A-Za-z]{4}0[A-Za-z0-9]{6}" maxLength={11} required/>
        <TextInput label="Bank name" name="bank" form={form} setForm={setForm} required/>
      </div>
      <button className="primary" type="submit"><Plus size={16}/>{editBeneficiary ? 'Update beneficiary' : 'Add beneficiary'}</button>
      {editBeneficiary && <button type="button" className="secondary module-cancel" onClick={() => { setEditBeneficiary(''); setForm(emptyForm) }}>Cancel edit</button>}
    </form>
    <DataTable headers={['Beneficiary', 'Customer', 'Account number', 'IFSC', 'Bank', 'Actions']} rows={data.beneficiaries.length} empty="No beneficiaries have been added.">
      {data.beneficiaries.map(item => <tr key={item.id}><td>{item.name}</td><td>{accountName(accounts, item.customerId)}</td><td>{item.accountNumber}</td><td>{item.ifsc}</td><td>{item.bank}</td><td className="module-actions">
        <button className="secondary small" onClick={() => { setEditBeneficiary(item.id); setForm({ ...emptyForm, customerId: item.customerId, name: item.name, beneficiaryAccount: item.accountNumber, ifsc: item.ifsc, bank: item.bank }) }}>Edit</button>
        <button className="danger small" aria-label={`Delete ${item.name}`} onClick={() => { setData(old => ({ ...old, beneficiaries: old.beneficiaries.filter(record => record.id !== item.id) })); announce(`Beneficiary ${item.id} deleted`, item.id) }}><Trash2 size={14}/></button>
      </td></tr>)}
    </DataTable>
  </>

  const renderInterest = <>
    <SectionTitle title="Indicative rate configuration" description="Changes are stored only in this browser and do not affect account calculations or accruals."/>
    <form className="module-form" onSubmit={saveRate}>
      <div className="module-form-grid">
        <SelectInput label="Product" name="rateName" form={form} setForm={setForm} required><option value="">Select a product</option><option value="Savings">Savings</option><option value="FD">Fixed deposit (FD)</option><option value="RD">Recurring deposit (RD)</option></SelectInput>
        <TextInput label="Annual rate (%)" type="number" min="0.01" max="100" step="0.01" name="rateValue" form={form} setForm={setForm} required/>
      </div>
      <button className="primary" type="submit"><Check size={16}/> Save indicative rate</button>
    </form>
    <DataTable headers={['Product', 'Current indicative annual rate', 'Effective date']} rows={data.rates.length} empty="No rates configured. No default banking rates are assumed.">
      {['Savings', 'FD', 'RD'].map(product => {
        const rate = currentRates[product]
        return rate && <tr key={product}><td>{product}</td><td>{rate.rate}%</td><td>{dateText(rate.effectiveDate)}</td></tr>
      })}
    </DataTable>
    <SectionTitle title="Rate change history" description="Administrator-entered changes in this browser."/>
    <DataTable headers={['Product', 'Previous rate', 'New rate', 'Changed at']} rows={data.rateHistory.length} empty="No rate changes recorded.">
      {data.rateHistory.map((entry, index) => <tr key={`${entry.product}-${entry.changedAt}-${index}`}><td>{entry.product}</td><td>{entry.previous === null ? '—' : `${entry.previous}%`}</td><td>{entry.rate}%</td><td>{new Date(entry.changedAt).toLocaleString('en-IN')}</td></tr>)}
    </DataTable>
    <SectionTitle title="Prototype calculation notes" description="These previews are not bank-approved accrual methods or loan offers."/>
    <ul className="calculation-notes">
      <li><strong>FD maturity:</strong> principal × (1 + annual rate ÷ 400)<sup>4 × tenure in years</sup> (quarterly compounding assumption).</li>
      <li><strong>RD maturity:</strong> monthly annuity-due projection with monthly compounding; installments are assumed at the start of each month.</li>
      <li><strong>Loan EMI:</strong> standard monthly reducing-balance formula using the entered annual rate and tenure.</li>
      <li><strong>Savings interest:</strong> no accrual is calculated; the bank's eligible balance rules, compounding, and tax treatment require backend policy.</li>
    </ul>
  </>

  const selectedStatementAccount = form.accountId || accounts[0]?.id || ''
  const statementTransactions = transactions.filter(item => {
    const involved = item.from === selectedStatementAccount || item.to === selectedStatementAccount
    const date = (item.date || '').slice(0, 10)
    return involved && (!form.dateFrom || date >= form.dateFrom) && (!form.dateTo || date <= form.dateTo)
  })
  const statementOpeningBalance = accounts.find(account => account.id === selectedStatementAccount)?.balance || 0

  const monthlyActivity = useMemo(() => {
    const months = new Map()
    transactions.forEach(item => {
      const month = (item.date || '').slice(0, 7)
      if (!month) return
      const current = months.get(month) || { month, count: 0, volume: 0 }
      current.count++
      current.volume += Number(item.amount) || 0
      months.set(month, current)
    })
    return [...months.values()].sort((a, b) => b.month.localeCompare(a.month)).slice(0, 12).reverse()
  }, [transactions])

  const renderStatements = <>
    <SectionTitle title="Account statement" description="Filter existing demo transactions. Save a PDF using your browser's print dialog."/>
    <div className="module-toolbar statement-filters">
      <select aria-label="Select statement account" value={selectedStatementAccount} onChange={event => change('accountId', event.target.value)}><option value="">Select an account</option>{accounts.map(account => customerOption(account))}</select>
      <label className="module-date-filter">From<input type="date" value={form.dateFrom} max={form.dateTo || undefined} onChange={event => change('dateFrom', event.target.value)}/></label>
      <label className="module-date-filter">To<input type="date" value={form.dateTo} min={form.dateFrom || undefined} onChange={event => change('dateTo', event.target.value)}/></label>
      <button className="primary small" onClick={() => window.print()} disabled={!selectedStatementAccount}><ArrowDownToLine size={15}/> Save as PDF</button>
    </div>
    {selectedStatementAccount ? <div className="statement-print">
      <div className="statement-heading"><div><div className="eyebrow">NORTHSTAR BANK · DEMO STATEMENT</div><h3>{accountName(accounts, selectedStatementAccount)}</h3><span>Account {selectedStatementAccount} · {form.dateFrom || 'All time'} to {form.dateTo || today()}</span></div></div>
      <div className="statement-balances"><div><span>Opening balance (current balance*)</span><strong>{money(statementOpeningBalance)}</strong></div><div><span>Closing balance (current balance*)</span><strong>{money(statementOpeningBalance)}</strong></div></div>
      <p className="module-muted">*Historical balances are unavailable in this frontend prototype; both balances show the current stored balance.</p>
      <DataTable headers={['Date', 'Transaction', 'Reference', 'Debit / Credit', 'Amount', 'Note']} rows={statementTransactions.length} empty="No transactions for this account and date range.">
        {statementTransactions.map(item => {
          const incoming = item.to === selectedStatementAccount
          return <tr key={item.id}><td>{dateText(item.date)}</td><td>{item.type}</td><td>{item.id}</td><td>{incoming ? 'Credit' : 'Debit'}</td><td>{money(item.amount)}</td><td>{item.note || '—'}</td></tr>
        })}
      </DataTable>
    </div> : <div className="empty-state">No customer accounts are available.</div>}
  </>

  const renderAudit = <>
    <SectionTitle title="Administrative activity" description="Actions logged in the local demo browser. This is not a tamper-proof audit trail."/>
    <DataTable headers={['Administrator', 'Action', 'Date & time', 'Affected account / record']} rows={auditLogs.length} empty="No administrator activity has been logged yet.">
      {auditLogs.map(entry => <tr key={entry.id}><td>{entry.administrator}</td><td>{entry.action}</td><td>{new Date(entry.timestamp).toLocaleString('en-IN')}</td><td>{entry.affected || '—'}</td></tr>)}
    </DataTable>
  </>

  const totalFd = data.fds.reduce((total, item) => total + item.principal, 0)
  const totalRd = data.rds.reduce((total, item) => total + item.monthlyAmount * item.tenure, 0)
  const totalLoans = data.loans.reduce((total, item) => total + item.amount, 0)
  const blockedAccounts = accounts.filter(account => account.status === 'Blocked').length
  const renderReports = <>
    <SectionTitle title="Portfolio overview" description="Aggregates from the current browser data. Empty products remain zero until records are created."/>
    <div className="report-grid">
      {[
        ['Customers', accounts.length], ['Savings balance total', money(accounts.reduce((sum, account) => sum + account.balance, 0))],
        ['FD principal', money(totalFd)], ['RD scheduled deposits', money(totalRd)],
        ['Loan applications', data.loans.length], ['Application principal', money(totalLoans)],
        ['Active accounts', accounts.filter(account => account.status === 'Active').length],
        ['Blocked accounts', blockedAccounts], ['Closed customer accounts', accounts.filter(account => account.status === 'Closed').length],
        ['Closed deposit records', data.fds.filter(item => item.status === 'Closed').length + data.rds.filter(item => item.status === 'Closed').length],
      ].map(([label, value]) => <div className="report-stat" key={label}><span>{label}</span><strong>{value}</strong></div>)}
    </div>
    <SectionTitle title="Monthly transaction summary" description="Transaction count and recorded volume per month."/>
    {monthlyActivity.length ? <><div className="report-chart" role="img" aria-label="Monthly transaction volume bar chart">
      {monthlyActivity.map(item => <div className="report-bar-column" key={item.month}><div className="report-bar-value">{money(item.volume)}</div><div className="report-bar" style={{ height: `${Math.max(4, item.volume / Math.max(...monthlyActivity.map(value => value.volume), 1) * 100)}%` }}/><span>{item.month}</span></div>)}
    </div><DataTable headers={['Month', 'Transactions', 'Recorded volume']} rows={monthlyActivity.length}>{[...monthlyActivity].reverse().map(item => <tr key={item.month}><td>{item.month}</td><td>{item.count}</td><td>{money(item.volume)}</td></tr>)}</DataTable></> : <div className="empty-state">No transactions available to report.</div>}
    <p className="module-muted">Savings balances use the demo account balances. FD, RD, and loan aggregates reflect only locally entered prototype records, not bank liabilities or disbursements.</p>
  </>

  const renderMinors = <>
    <SectionTitle title="Minor accounts" description="Update guardian contacts and review age. Regular-account conversion requires bank policy and backend verification."/>
    <DataTable headers={['Minor', 'Date of birth / age', 'Guardian', 'Linked account', 'Contact', 'Status', 'Action']} rows={data.minors.length} empty="No minor records yet.">
      {data.minors.map(item => <tr key={item.id}>
        <td>{item.name}<small className="module-subcell">{item.minorPhone || item.minorEmail || item.id}</small></td>
        <td>{dateText(item.dob)} · {daysOld(item.dob)} yrs</td>
        <td><input className="inline-edit" aria-label={`Guardian name for ${item.name}`} value={guardianDrafts[item.id]?.guardian ?? item.guardian} onChange={event => setGuardianDrafts(old => ({ ...old, [item.id]: { ...old[item.id], guardian: event.target.value } }))} onBlur={event => { const value = event.target.value.trim(); if (value && value !== item.guardian) updateMinor(item, 'guardian', value) }}/></td>
        <td><select className="inline-edit" aria-label={`Guardian account for ${item.name}`} value={item.guardianAccountId} onChange={event => updateMinor(item, 'guardianAccountId', event.target.value)}>{customers.map(account => customerOption(account))}</select></td>
        <td><input className="inline-edit" aria-label={`Guardian phone for ${item.name}`} value={guardianDrafts[item.id]?.guardianPhone ?? item.guardianPhone} onChange={event => setGuardianDrafts(old => ({ ...old, [item.id]: { ...old[item.id], guardianPhone: event.target.value } }))} onBlur={event => { const value = event.target.value.trim(); if (value && value !== item.guardianPhone) updateMinor(item, 'guardianPhone', value) }}/>
          <input className="inline-edit" aria-label={`Guardian email for ${item.name}`} value={guardianDrafts[item.id]?.guardianEmail ?? item.guardianEmail} onChange={event => setGuardianDrafts(old => ({ ...old, [item.id]: { ...old[item.id], guardianEmail: event.target.value } }))} onBlur={event => { const value = event.target.value.trim(); if (value !== item.guardianEmail) updateMinor(item, 'guardianEmail', value) }}/></td>
        <td>{daysOld(item.dob) >= 18 ? 'Eligible for policy review' : 'Minor savings'}</td>
        <td>{daysOld(item.dob) >= 18 ? <button className="secondary small" onClick={() => onNotice('Account conversion requires bank-policy and backend verification.')}>Review conversion</button> : '—'}</td>
      </tr>)}
    </DataTable>
  </>

  return <section className="panel page-panel admin-module-page">
    <div className="module-page-heading"><div><h3>{title}</h3><p>Administrative workspace</p></div><span className="prototype-badge">BROWSER PROTOTYPE</span></div>
    <PrototypeNotice/>
    {view === 'fdManagement' || view === 'createFd' || view === 'closeFd' ? renderFdPage
      : view === 'rdManagement' ? renderRd
      : view === 'createMinor' ? renderMinorForm
      : view === 'manageMinors' ? renderMinors
      : view === 'loans' ? renderLoans
      : view === 'beneficiaries' ? renderBeneficiaries
      : view === 'interest' ? renderInterest
      : view === 'statements' ? renderStatements
      : view === 'auditLogs' ? renderAudit
      : view === 'reports' ? renderReports
      : null}
  </section>
}
