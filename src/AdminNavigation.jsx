import { useState } from 'react'
import {
  Banknote, BarChart3, Briefcase, ChevronDown, CircleDollarSign,
  ClipboardList, Contact, FileText, Percent, Trash2, TrendingUp,
  UserPlus, Users,
} from 'lucide-react'

export const ADMIN_MODULE_TITLES = {
  fdManagement: 'Fixed Deposit (FD) Management',
  createFd: 'Create FD Account',
  closeFd: 'Close/Delete FD Account',
  rdManagement: 'Recurring Deposit (RD) Management',
  createMinor: 'Create Minor Account',
  manageMinors: 'Manage Minor Accounts',
  loans: 'Loan Management',
  beneficiaries: 'Beneficiary Management',
  interest: 'Interest Management',
  statements: 'Account Statements',
  auditLogs: 'Audit Logs',
  reports: 'Reports',
}

const submenuItems = [
  ['fdManagement', ADMIN_MODULE_TITLES.fdManagement, Banknote],
  ['createFd', ADMIN_MODULE_TITLES.createFd, CircleDollarSign],
  ['closeFd', ADMIN_MODULE_TITLES.closeFd, Trash2],
  ['rdManagement', ADMIN_MODULE_TITLES.rdManagement, TrendingUp],
  ['createMinor', ADMIN_MODULE_TITLES.createMinor, UserPlus],
  ['manageMinors', ADMIN_MODULE_TITLES.manageMinors, Users],
  ['loans', ADMIN_MODULE_TITLES.loans, Briefcase],
  ['beneficiaries', ADMIN_MODULE_TITLES.beneficiaries, Contact],
  ['interest', ADMIN_MODULE_TITLES.interest, Percent],
  ['statements', ADMIN_MODULE_TITLES.statements, FileText],
  ['auditLogs', ADMIN_MODULE_TITLES.auditLogs, ClipboardList],
  ['reports', ADMIN_MODULE_TITLES.reports, BarChart3],
]

export default function AdminNavigation({ view, onNavigate }) {
  const [isOpen, setIsOpen] = useState(false)
  const childIsActive = submenuItems.some(([id]) => id === view)

  return (
    <>
      <button
        type="button"
        className={`others-toggle ${childIsActive ? 'nav-active' : ''}`}
        aria-expanded={isOpen}
        aria-controls="admin-others-menu"
        onClick={() => setIsOpen(open => !open)}
      >
        <span className="others-label">
          <Users size={18} />
          <span>Others</span>
        </span>
        <ChevronDown
          size={15}
          className={`nav-chevron ${isOpen ? 'is-open' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="nav-submenu" id="admin-others-menu">
          {submenuItems.map(([id, label, Icon]) => (
            <button
              type="button"
              key={id}
              className={view === id ? 'nav-active' : ''}
              aria-current={view === id ? 'page' : undefined}
              onClick={() => onNavigate(id)}
              title={label}
            >
              <Icon size={17} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}
    </>
  )
}
